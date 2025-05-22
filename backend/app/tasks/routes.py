from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.auth.dependencies import get_current_user
from app.database import get_db
from .models import Task, TaskCategory, TaskSkillLevel, TaskStatus, Application, ApplicationStatus
from .schemas import TaskCreate, TaskUpdate, TaskResponse, ApplicationCreate, ApplicationResponse, DisputeWinner
from app.auth.models import User, UserType
from app.users.models import Profile
from typing import List, Optional, Literal
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

@router.get("/disputes", response_model=List[TaskResponse])
async def get_disputes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 10
):
    if current_user.user_type != UserType.MODERATOR:
        raise HTTPException(status_code=403, detail="Только модераторы могут просматривать список споров")

    disputes = db.query(Task).filter(Task.status == TaskStatus.DISPUTE)\
        .offset(skip).limit(limit).all()

    result = []
    for task in disputes:
        owner_profile = db.query(Profile).filter(Profile.user_id == task.owner_id).first()
        freelancer_profile = db.query(Profile).filter(Profile.user_id == task.freelancer_id).first()
        task_response = TaskResponse(
            **task.__dict__,
            owner_profile=owner_profile,
            freelancer_profile=freelancer_profile
        )
        result.append(task_response)

    return result

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
        task.status == TaskStatus.DISPUTE or  # Разрешаем доступ при споре
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
        status="На рассмотрении"  # Используем строковое значение
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

    # Проверяем баланс заказчика
    task_price = application.proposed_price if application.proposed_price is not None else task.budget_min
    if task_price is None:
        raise HTTPException(status_code=400, detail="Не указана стоимость задачи")

    if current_user.balance < task_price:
        raise HTTPException(status_code=400, detail="Недостаточно средств на балансе")

    # Списываем средства с баланса заказчика в keeper задачи
    current_user.balance -= task_price
    task.keeper = task_price

    application.status = "Принята"  # Используем строковое значение
    task.status = "В процессе"  # Используем строковое значение
    task.freelancer_id = application.freelancer_id

    if application.proposed_price is not None:
        task.budget_min = application.proposed_price
        task.budget_max = application.proposed_price

    other_applications = db.query(Application).filter(
        and_(Application.task_id == task_id, Application.id != application_id)
    ).all()
    for app in other_applications:
        app.status = "Отклонена"  # Используем строковое значение

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

    application.status = "Отклонена"  # Используем строковое значение
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

    app = db.query(Application).filter(
        Application.id == application_id,
        Application.freelancer_id == current_user.id,
        Application.status == ApplicationStatus.PENDING
    ).first()

    if not app:
        raise HTTPException(status_code=404, detail="Заявка не найдена или уже обработана")

    task = db.query(Task).filter(Task.id == app.task_id).first()

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

@router.post("/{task_id}/open-dispute", response_model=TaskResponse)
async def open_dispute(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    # Проверяем, что пользователь является заказчиком или исполнителем задачи
    if current_user.id != task.owner_id and current_user.id != task.freelancer_id:
        raise HTTPException(status_code=403, detail="Вы не являетесь участником этой задачи")

    if task.status != TaskStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Открыть спор можно только для задачи в процессе")

    task.status = TaskStatus.DISPUTE
    db.commit()
    db.refresh(task)

    # Отправляем уведомления обоим участникам
    if current_user.id == task.owner_id:
        await send_notification(
            db=db,
            user_id=task.freelancer_id,
            type="dispute_opened",
            message=f"Заказчик открыл спор по задаче '{task.title}'",
            task_id=task.id
        )
    else:
        await send_notification(
            db=db,
            user_id=task.owner_id,
            type="dispute_opened",
            message=f"Фрилансер открыл спор по задаче '{task.title}'",
            task_id=task.id
        )

    # Уведомляем модераторов о новом споре
    moderators = db.query(User).filter(User.user_type == UserType.MODERATOR).all()
    for moderator in moderators:
        await send_notification(
            db=db,
            user_id=moderator.id,
            type="new_dispute",
            message=f"Открыт новый спор по задаче '{task.title}'",
            task_id=task.id
        )

    return TaskResponse.model_validate(task)

@router.post("/{task_id}/resolve-dispute", response_model=TaskResponse)
async def resolve_dispute(
    task_id: int,
    winner: DisputeWinner,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.user_type != UserType.MODERATOR:
        raise HTTPException(status_code=403, detail="Только модератор может разрешать споры")

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    if task.status != TaskStatus.DISPUTE:
        raise HTTPException(status_code=400, detail="Можно разрешить только задачу в статусе спора")

    customer = db.query(User).filter(User.id == task.owner_id).first()
    freelancer = db.query(User).filter(User.id == task.freelancer_id).first()
    
    if not customer or not freelancer:
        raise HTTPException(status_code=404, detail="Не найден заказчик или фрилансер")

    customer_profile = db.query(Profile).filter(Profile.user_id == task.owner_id).first()
    freelancer_profile = db.query(Profile).filter(Profile.user_id == task.freelancer_id).first()

    if not customer_profile:
        customer_profile = Profile(user_id=task.owner_id, total_spent=0.0, total_earned=0.0)
        db.add(customer_profile)
        db.commit()

    if not freelancer_profile:
        freelancer_profile = Profile(user_id=task.freelancer_id, total_spent=0.0, total_earned=0.0)
        db.add(freelancer_profile)
        db.commit()

    if winner == DisputeWinner.CUSTOMER:
        # Возвращаем деньги заказчику
        customer.balance += task.keeper
        task.keeper = 0
        # Отменяем изменения в статистике
        customer_profile.total_spent = float(customer_profile.total_spent or 0.0) - float(task.keeper)
    else:
        # Переводим деньги фрилансеру
        freelancer.balance += task.keeper
        # Обновляем статистику
        customer_profile.total_spent = float(customer_profile.total_spent or 0.0) + float(task.keeper)
        freelancer_profile.total_earned = float(freelancer_profile.total_earned or 0.0) + float(task.keeper)
        task.keeper = 0

    # Возвращаем задачу в статус "В процессе"
    task.status = TaskStatus.IN_PROGRESS
    db.commit()
    db.refresh(task)

    # Отправляем уведомления
    await send_notification(
        db=db,
        user_id=task.owner_id,
        type="dispute_resolved",
        message=f"Спор по задаче '{task.title}' был разрешен в пользу {'заказчика' if winner == DisputeWinner.CUSTOMER else 'фрилансера'}",
        task_id=task.id
    )

    await send_notification(
        db=db,
        user_id=task.freelancer_id,
        type="dispute_resolved",
        message=f"Спор по задаче '{task.title}' был разрешен в пользу {'заказчика' if winner == DisputeWinner.CUSTOMER else 'фрилансера'}",
        task_id=task.id
    )

    response_dict = {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "budget_min": task.budget_min,
        "budget_max": task.budget_max,
        "deadline": task.deadline,
        "category": task.category,
        "custom_category": task.custom_category,
        "skill_level": task.skill_level,
        "status": task.status,
        "owner_id": task.owner_id,
        "freelancer_id": task.freelancer_id,
        "keeper": task.keeper,
        "submitted_at": task.submitted_at,
        "created_at": task.created_at,
        "owner_profile": customer_profile,
        "freelancer_profile": freelancer_profile
    }

    return TaskResponse(**response_dict)

@router.post("/{task_id}/submit-for-review", response_model=TaskResponse)
async def submit_task_for_review(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.user_type != UserType.FREELANCER:
        raise HTTPException(status_code=403, detail="Только фрилансеры могут отправлять задачи на проверку")

    task = db.query(Task).filter(Task.id == task_id, Task.freelancer_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    if task.status != TaskStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Можно отправить на проверку только задачу в процессе")

    task.status = TaskStatus.PENDING_REVIEW
    db.commit()
    db.refresh(task)
    
    await send_notification(
        db=db,
        user_id=task.owner_id,
        type="task_submitted_for_review",
        message=f"Задача '{task.title}' отправлена на проверку",
        task_id=task.id
    )

    return TaskResponse.model_validate(task)

@router.post("/{task_id}/review-result", response_model=TaskResponse)
async def process_review_result(
    task_id: int,
    action: Literal["accept", "reject", "reopen"],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.user_type != UserType.CUSTOMER:
        raise HTTPException(status_code=403, detail="Только заказчики могут принимать решение по проверке")

    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    if task.status != TaskStatus.PENDING_REVIEW:
        raise HTTPException(status_code=400, detail="Можно принять решение только по задаче на проверке")

    if action == "accept":
        # Если заказчик принимает работу, задача переходит в статус CLOSED
        task.status = TaskStatus.CLOSED
        message = "Работа принята заказчиком"
        
        # Переводим средства фрилансеру
        freelancer = db.query(User).filter(User.id == task.freelancer_id).first()
        if freelancer and task.keeper > 0:
            customer_profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
            freelancer_profile = db.query(Profile).filter(Profile.user_id == freelancer.id).first()
            
            if not customer_profile:
                customer_profile = Profile(user_id=current_user.id, total_spent=0.0, total_earned=0.0)
                db.add(customer_profile)
                db.commit()
                
            if not freelancer_profile:
                freelancer_profile = Profile(user_id=freelancer.id, total_spent=0.0, total_earned=0.0)
                db.add(freelancer_profile)
                db.commit()
            
            customer_profile.total_spent = float(customer_profile.total_spent or 0.0) + float(task.keeper)
            freelancer_profile.total_earned = float(freelancer_profile.total_earned or 0.0) + float(task.keeper)
            
            freelancer.balance += task.keeper
            task.keeper = 0
            
    elif action == "reject":
        # Если заказчик отклоняет работу, задача возвращается тому же фрилансеру на доработку
        task.status = TaskStatus.IN_PROGRESS
        message = "Работа отправлена на доработку"
    else:  # reopen
        # Если заказчик хочет открыть задачу для других фрилансеров
        task.status = TaskStatus.OPEN
        task.freelancer_id = None
        # Возвращаем средства заказчику из keeper
        if task.keeper > 0:
            current_user.balance += task.keeper
            task.keeper = 0
        message = "Задача открыта для новых заявок"

    db.commit()
    db.refresh(task)
    
    if task.freelancer_id:  # Отправляем уведомление только если есть фрилансер
        await send_notification(
            db=db,
            user_id=task.freelancer_id,
            type="review_result",
            message=f"Задача '{task.title}': {message}",
            task_id=task.id
        )

    return TaskResponse.model_validate(task)