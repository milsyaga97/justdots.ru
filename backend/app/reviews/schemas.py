from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional

class ReviewCreate(BaseModel):
    comment: Optional[str] = None
    score: float

    @field_validator("score")
    def validate_score(cls, v):
        if v < 1 or v > 5:
            raise ValueError("Оценка должна быть от 1 до 5")
        return v

class ReviewResponse(BaseModel):
    id: int
    user_id: int
    reviewer_id: int
    task_id: int
    comment: Optional[str]
    score: float
    created_at: datetime

    class Config:
        from_attributes = True