from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ChatMessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    task_id: Optional[int]
    message: str
    created_at: datetime

    class Config:
        from_attributes = True