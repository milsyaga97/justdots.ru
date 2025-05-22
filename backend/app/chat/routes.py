# chat/routes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..auth.dependencies import get_current_user
from ..auth.models import User, UserType
from ..tasks.models import Task, TaskStatus
from .models import ChatMessage
from .schemas import ChatMessageCreate, ChatMessageResponse
from ..notifications.utils import send_notification

router = APIRouter()

@router.post("/{task_id}/send", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    task_id: int,
    message_data: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Проверяем задачу
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    # Проверяем доступ
    is_participant = current_user.id in [task.owner_id, task.freelancer_id]
    is_moderator_in_dispute = current_user.user_type == UserType.MODERATOR and task.status == TaskStatus.DISPUTE

    if not (is_participant or is_moderator_in_dispute):
        raise HTTPException(status_code=403, detail="У вас нет доступа к этому чату")

    # Определяем получателя
    if is_moderator_in_dispute:
        # Если пишет модератор, отправляем сообщение обоим участникам
        receivers = [task.owner_id, task.freelancer_id]
    else:
        # Если пишет участник, определяем другого участника
        receivers = [task.freelancer_id if current_user.id == task.owner_id else task.owner_id]
        if not receivers[0]:
            raise HTTPException(status_code=400, detail="Получатель не определен (фрилансер не назначен)")

    # Создаем сообщение
    new_message = ChatMessage(
        owner_id=current_user.id,
        task_id=task_id,
        message=message_data.message
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    # Отправляем уведомления всем получателям
    for receiver_id in receivers:
        await send_notification(
            db=db,
            user_id=receiver_id,
            type="message",
            message=f"Новое сообщение от {current_user.username} по задаче '{task.title}'",
            task_id=task_id
        )

    return ChatMessageResponse.model_validate(new_message)

@router.get("/{task_id}/history", response_model=List[ChatMessageResponse])
async def get_chat_history(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Проверяем задачу
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    # Проверяем доступ
    is_participant = current_user.id in [task.owner_id, task.freelancer_id]
    is_moderator_in_dispute = current_user.user_type == UserType.MODERATOR and task.status == TaskStatus.DISPUTE

    if not (is_participant or is_moderator_in_dispute):
        raise HTTPException(status_code=403, detail="У вас нет доступа к этому чату")

    # Получаем сообщения
    messages = db.query(ChatMessage).filter(ChatMessage.task_id == task_id).order_by(ChatMessage.created_at.asc()).all()
    return [ChatMessageResponse.model_validate(msg) for msg in messages]