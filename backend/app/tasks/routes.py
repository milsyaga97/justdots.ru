from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.auth.dependencies import get_current_user
from app.database import get_db
from .models import Task, TaskCategory, TaskSkillLevel, TaskStatus, Application, ApplicationStatus
from .schemas import TaskCreate, TaskUpdate, TaskResponse, ApplicationCreate, ApplicationResponse
from app.auth.models import User, UserType
from app.users.models import Profile
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import joinedload
from ..notifications.utils import send_notification

router = APIRouter()

def validate_budget(budget_min: float | None, budget_max: float | None):
    if budget_min is not None and budget_max is not None:
        if budget_min > budget_max:
            raise ValueError("Минимальный бюджет не может быть больше максимального")
    return True

@router.post("/create", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.user_type != UserType.CUSTOMER:
        raise HTTPException(status_code=403, detail="Только заказчики могут создавать задачи")

    try:
        validate_budget(task_data.budget_min, task_data.budget_max)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if task_data.category == TaskCategory.OTHER.value and not task_data.custom_category:
        raise HTTPException(status_code=400, detail="Необходимо указать 'custom_category' при категории 'Другое'")

    try:
        category = TaskCategory(task_data.category)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Некорректное значение категории: {task_data.category}")

    try:
        skill_level = TaskSkillLevel(task_data.skill_level)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Некорректный уровень навыка: {task_data.skill_level}")

    new_task = Task(
        title=task_data.title,
        description=task_data.description,
        budget_min=task_data.budget_min,
        budget_max=task_data.budget_max,
        deadline=task_data.deadline,
        category=category,
        custom_category=task_data.custom_category,
        skill_level=skill_level,
        owner_id=current_user.id
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    moderators = db.query(User).filter(User.user_type == UserType.MODERATOR).all()
    for moderator in moderators:
        await send_notification(
            db=db,
            user_id=moderator.id,
            type="task_created",
            message=f"Новая задача '{new_task.title}' ожидает модерации",
            task_id=new_task.id
        )

    return TaskResponse.model_validate(new_task)       


@router.get("/", response_model=List[TaskResponse])
async def get_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    filter: Optional[str] = Query(None, enum=["my", "public", "assigned"]),
    status: Optional[TaskStatus] = None,
    category: Optional[TaskCategory] = None,
    skill_level: Optional[TaskSkillLevel] = None,
    skip: int = 0,
    limit: int = 10
):
    query = db.query(Task)
    if filter == "my":
        if current_user.user_type != UserType.CUSTOMER:
            raise HTTPException(status_code=403, detail="Доступ запрещён, вы не являетесь заказчиком")
        query = query.filter(Task.owner_id == current_user.id)
    elif filter == "public":
        if current_user.user_type != UserType.FREELANCER:
            raise HTTPException(status_code=403, detail="Доступ запрещён, вы не являетесь фрилансером")
        query = query.filter(Task.status == TaskStatus.OPEN)
    elif filter == "assigned":
        if current_user.user_type != UserType.FREELANCER:
            raise HTTPException(status_code=403, detail="Доступ запрещён, вы не являетесь фрилансером")
        query = query.filter(Task.freelancer_id == current_user.id)
    else:
        if current_user.user_type != UserType.MODERATOR:
            raise HTTPException(status_code=403, detail="Доступ запрещён, вы не являетесь модератором")
    if status:
        query = query.filter(Task.status == status)
    if category:
        query = query.filter(Task.category == category)
    if skill_level:
        query = query.filter(Task.skill_level == skill_level)

    tasks = query.offset(skip).limit(limit).all()

    result = []
    for task in tasks:
        owner_profile = db.query(Profile).filter(Profile.user_id == task.owner_id).first()
        result.append(TaskResponse(
            **task.__dict__,
            owner_profile=owner_profile
        ))

    return result

@router.get("/applications", response_model=List[ApplicationResponse])
async def get_task_applications(
    task_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.user_type == UserType.CUSTOMER:
        if task_id is None:
            tasks = db.query(Task).filter(Task.owner_id == current_user.id).all()
            task_ids = [task.id for task in tasks]
            if not task_ids:
                return []
            applications = db.query(Application).filter(Application.task_id.in_(task_ids)).all()
        else:
            task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
            if not task:
                raise HTTPException(status_code=403, detail="Задача не принадлежит вам")
            applications = db.query(Application).filter(Application.task_id == task_id).all()

    elif current_user.user_type == UserType.FREELANCER:
        if task_id is None:
            applications = db.query(Application).filter(Application.freelancer_id == current_user.id).all()
        else:
            applications = db.query(Application).filter(
                Application.task_id == task_id,
                Application.freelancer_id == current_user.id
            ).all()
            if not applications:
                raise HTTPException(status_code=404, detail="У вас нет заявок на эту задачу")

    else:
        raise HTTPException(status_code=403, detail="Недопустимый тип пользователя")

    return [ApplicationResponse.model_validate(app.__dict__) for app in applications]

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task_by_id(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).options(joinedload(Task.reviews)).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    owner_profile = db.query(Profile).filter(Profile.user_id == task.owner_id).first()

    if current_user.user_type == UserType.CUSTOMER and task.owner_id == current_user.id:
        customer_review = next((r for r in task.reviews if r.user_id == task.owner_id), None)
        freelancer_review = next((r for r in task.reviews if r.user_id == task.freelancer_id), None)
    elif current_user.user_type == UserType.FREELANCER and (
        task.status == TaskStatus.OPEN or
        (task.status == TaskStatus.IN_PROGRESS and task.freelancer_id == current_user.id) or
        (task.status == TaskStatus.CLOSED and task.freelancer_id == current_user.id)
    ):
        customer_review = next((r for r in task.reviews if r.user_id == task.owner_id), None)
        freelancer_review = next((r for r in task.reviews if r.user_id == task.freelancer_id), None)
    elif current_user.user_type == UserType.MODERATOR:
        customer_review = next((r for r in task.reviews if r.user_id == task.owner_id), None)
        freelancer_review = next((r for r in task.reviews if r.user_id == task.freelancer_id), None)
    else:
        raise HTTPException(status_code=403, detail="Доступ запрещён")

    return TaskResponse(
        **task.__dict__,
        owner_profile=owner_profile,
        customer_review=customer_review,
        freelancer_review=freelancer_review
    )

@router.put("/{task_id}/update", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.user_type != UserType.CUSTOMER:
        raise HTTPException(status_code=403, detail="Только заказчики могут изменять задачи")

    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    update_data = task_data.dict(exclude_unset=True)

    if "status" in update_data:
        raise HTTPException(status_code=400, detail="Изменение статуса запрещено в этом запросе")

    budget_min = update_data.get("budget_min", task.budget_min)
    budget_max = update_data.get("budget_max", task.budget_max)
    try:
        validate_budget(budget_min, budget_max)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if update_data.get("category") == TaskCategory.OTHER.value:
        if not update_data.get("custom_category") and not task.custom_category:
            raise HTTPException(status_code=400, detail="Необходимо указать 'custom_category' при категории 'Другое'")

    if "category" in update_data:
        try:
            update_data["category"] = TaskCategory(update_data["category"])
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Некорректное значение категории: {update_data['category']}")

    if "skill_level" in update_data:
        try:
            update_data["skill_level"] = TaskSkillLevel(update_data["skill_level"])
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Некорректный уровень навыка: {update_data['skill_level']}")

    for key, value in update_data.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)

    return TaskResponse.model_validate(task.__dict__)

@router.post("/{task_id}/close", response_model=TaskResponse)
async def close_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.user_type != UserType.CUSTOMER:
        raise HTTPException(status_code=403, detail="Только заказчики могут закрывать задачи")

    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    task.status = TaskStatus.CLOSED
    db.commit()
    db.refresh(task)
    
    if task.freelancer_id:
        await send_notification(
            db=db,
            user_id=task.freelancer_id,
            type="task_closed",
            message=f"Задача '{task.title}' была закрыта заказчиком",
            task_id=task.id
        )

    return TaskResponse.model_validate(task)

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.user_type != UserType.CUSTOMER:
        raise HTTPException(status_code=403, detail="Только заказчики могут удалять задачи")

    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    db.delete(task)
    db.commit()

    return {"message": "Задача удалена"}

@router.post("/{task_id}/moderate/approve", response_model=TaskResponse)
async def approve_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.user_type != UserType.MODERATOR:
        raise HTTPException(status_code=403, detail="Только модератор может одобрять задачи")
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    if task.status != TaskStatus.PENDING_MODERATION:
        raise HTTPException(status_code=400, detail="Можно одобрить только задачу на рассмотрении")

    task.created_at = datetime.now(timezone.utc)
    task.status = TaskStatus.OPEN
    db.commit()
    db.refresh(task)
    
    await send_notification(
        db=db,
        user_id=task.owner_id,
        type="task_approved",
        message=f"Ваша задача '{task.title}' одобрена модератором",
        task_id=task.id
    )
    
    return TaskResponse.model_validate(task)

@router.post("/{task_id}/moderate/reject", response_model=TaskResponse)
async def reject_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.user_type != UserType.MODERATOR:
        raise HTTPException(status_code=403, detail="Только модератор может отклонять задачи")

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    if task.status != TaskStatus.PENDING_MODERATION:
        raise HTTPException(status_code=400, detail="Можно отклонить только задачу на рассмотрении")

    task.status = TaskStatus.REJECTED_BY_MODERATION
    db.commit()
    db.refresh(task)
    
    await send_notification(
        db=db,
        user_id=task.owner_id,
        type="task_rejected",
        message=f"Ваша задача '{task.title}' отклонена модератором",        
        task_id=task.id
    )

    return TaskResponse.model_validate(task)

@router.post("/{task_id}/apply", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_for_task(
    task_id: int,
    application_data: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.user_type != UserType.FREELANCER:
        raise HTTPException(status_code=403, detail="Только фрилансеры могут подавать заявки на задачи")

    task = db.query(Task).filter(Task.id == task_id, Task.status == TaskStatus.OPEN).first()
    if not task:
        raise HTTPException(status_code=404, detail="Открытая задача не найдена")

    existing_application = db.query(Application).filter(
        Application.task_id == task_id,
        Application.freelancer_id == current_user.id
    ).first()

    if existing_application:
        if existing_application.status == ApplicationStatus.PENDING:
            raise HTTPException(status_code=400, detail="Вы уже подали заявку на эту задачу")
        elif existing_application.status == ApplicationStatus.REJECTED:
            raise HTTPException(status_code=400, detail="Вы не можете повторно подать заявку: предыдущая заявка была отклонена")
        elif existing_application.status == ApplicationStatus.ACCEPTED:
            raise HTTPException(status_code=400, detail="Заявка уже принята")

    new_application = Application(
        task_id=task_id,
        freelancer_id=current_user.id,
        comment=application_data.comment,
        proposed_price=application_data.proposed_price,
        proposed_deadline=application_data.proposed_deadline,
        status=ApplicationStatus.PENDING
    )

    db.add(new_application)
    db.commit()
    db.refresh(new_application)
    
    await send_notification(
        db=db,
        user_id=task.owner_id,
        type="application_submitted",
        message=f"Новая заявка на задачу '{task.title}' от фрилансера {current_user.username}",
        task_id=task.id
    )

    return ApplicationResponse.model_validate(new_application)

@router.post("/{task_id}/applications/{application_id}/accept", response_model=TaskResponse)
async def accept_application(
    task_id: int,
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.user_type != UserType.CUSTOMER:
        raise HTTPException(status_code=403, detail="Только заказчики могут принимать заявки")

    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    if task.status != TaskStatus.OPEN:
        raise HTTPException(status_code=400, detail="Задача уже в процессе или закрыта")

    application = db.query(Application).filter(
        and_(Application.id == application_id, Application.task_id == task_id)
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    if application.status != ApplicationStatus.PENDING:
        raise HTTPException(status_code=400, detail="Заявка уже обработана")

    application.status = ApplicationStatus.ACCEPTED

    task.status = TaskStatus.IN_PROGRESS
    task.freelancer_id = application.freelancer_id

    if application.proposed_price is not None:
        task.budget_min = application.proposed_price
        task.budget_max = application.proposed_price
    else:
        pass

    other_applications = db.query(Application).filter(
        and_(Application.task_id == task_id, Application.id != application_id)
    ).all()
    for app in other_applications:
        app.status = ApplicationStatus.REJECTED

    db.commit()
    db.refresh(task)
    
    await send_notification(
        db=db,
        user_id=application.freelancer_id,
        type="application_accepted",
        message=f"Ваша заявка на задачу '{task.title}' была принята",
        task_id=task.id
    )

    return TaskResponse.model_validate(task)

@router.post("/{task_id}/applications/{application_id}/reject", response_model=ApplicationResponse)
async def reject_application(
    task_id: int,
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.user_type != UserType.CUSTOMER:
        raise HTTPException(status_code=403, detail="Только заказчики могут отклонять заявки")

    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    application = db.query(Application).filter(
        and_(Application.id == application_id, Application.task_id == task_id)
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    if application.status != ApplicationStatus.PENDING:
        raise HTTPException(status_code=400, detail="Заявка уже обработана")

    application.status = ApplicationStatus.REJECTED
    db.commit()
    db.refresh(application)
    
    await send_notification(
        db=db,
        user_id=application.freelancer_id,
        type="application_rejected",
        message=f"Ваша заявка на задачу '{task.title}' была отклонена",
        task_id=task.id
    )

    return ApplicationResponse.model_validate(application)

@router.post("/applications/cancel", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.user_type != UserType.FREELANCER:
        raise HTTPException(status_code=403, detail="Только фрилансеры могут отменять заявки")

    task = db.query(Task).filter(Task.id == app.task_id).first()

    app = db.query(Application).filter(
        Application.id == application_id,
        Application.freelancer_id == current_user.id,
        Application.status == ApplicationStatus.PENDING
    ).first()

    if not app:
        raise HTTPException(status_code=404, detail="Заявка не найдена или уже обработана")

    db.delete(app)
    db.commit()
    
    await send_notification(
        db=db,
        user_id=task.owner_id,
        type="application_cancelled",
        message=f"Фрилансер {current_user.username} отменил заявку на задачу '{task.title}'",
        task_id=task.id
    )
    
    return {"message": "Заявка успешно отменена"}