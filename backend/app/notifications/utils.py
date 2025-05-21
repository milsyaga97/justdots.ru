from fastapi import WebSocket
from sqlalchemy.orm import Session
from .models import Notification
from .routes import active_notification_connections
from typing import Optional


async def send_notification(db: Session, user_id: int, type: str, message: str, task_id: Optional[int] = None):
    notification = Notification(
        user_id=user_id,
        type=type,
        message=message,
        task_id=task_id
    )
    db.add(notification)
    db.commit()

    if user_id in active_notification_connections:
        await active_notification_connections[user_id].send_json({
            "id": notification.id,
            "user_id": user_id, 
            "type": type,
            "message": message,
            "is_read": notification.is_read,
            "created_at": notification.created_at.isoformat(),
            "task_id": task_id
        })