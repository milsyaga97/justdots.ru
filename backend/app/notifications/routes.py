from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..auth.dependencies import get_current_user_ws, get_current_user
from ..auth.models import User
from .models import Notification
from .schemas import NotificationResponse

router = APIRouter()


active_notification_connections: dict[int, WebSocket] = {}


@router.websocket("/ws/{user_id}")
async def websocket_notifications_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db),
                                          current_user: User = Depends(get_current_user_ws)):
    await websocket.accept()
    active_notification_connections[user_id] = websocket

    try:
        while True:
            data = await websocket.receive_json()
    except WebSocketDisconnect:
        active_notification_connections.pop(user_id, None)
    except Exception as e:
        await websocket.send_json({"error": str(e)})
        active_notification_connections.pop(user_id, None)


@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).order_by(Notification.created_at.desc()).all()

    return notifications


@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Уведомление не найдено")

    notification.is_read = True
    db.commit()
    return {"message": "Уведомление отмечено как прочитанное"}