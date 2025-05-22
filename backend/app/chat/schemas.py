from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ChatMessageCreate(BaseModel):
    message: str

class ChatMessageResponse(BaseModel):
    task_id: Optional[int]
    sender_id: int
    receiver_id: int
    message: str
    created_at: datetime

    class Config:
        from_attributes = True