from pydantic import BaseModel
from typing import Optional
from enum import Enum
from datetime import datetime
from ..reviews.schemas import ReviewResponse
from ..users.schemas import Profile

class TaskStatus(str, Enum):
    PENDING_MODERATION = "На рассмотрении модерацией"
    REJECTED_BY_MODERATION = "Отклонена модерацией"
    OPEN = "Открытая"
    IN_PROGRESS = "В процессе"
    CLOSED = "Закрытая"

class TaskSkillLevel(str, Enum):
    BASIC = "Менее года"
    MEDIUM = "От 1 до 3 лет"
    ADVANCED = "Более 3 лет"

class TaskCategory(str, Enum):
    DEVELOPMENT = "Разработка"
    DESIGN = "Дизайн"
    PROGRAMMING = "Программирование"
    COPYWRITING = "Копирайтинг"
    OTHER = "Другое"

class ApplicationStatus(str, Enum):
    PENDING = "На рассмотрении"
    ACCEPTED = "Принята"
    REJECTED = "Отклонена"

class TaskCreate(BaseModel):
    title: str
    description: str
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    deadline: Optional[datetime] = None
    category: TaskCategory
    custom_category: Optional[str] = None
    skill_level: TaskSkillLevel

    model_config = {"use_enum_values": True, "from_attributes": True}

class TaskUpdate(TaskCreate):
    title: Optional[str] = None
    description: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    deadline: Optional[datetime] = None
    category: Optional[TaskCategory] = None
    custom_category: Optional[str] = None
    skill_level: Optional[TaskSkillLevel] = None
    status: Optional[TaskStatus] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    budget_min: Optional[float]
    budget_max: Optional[float]
    deadline: Optional[datetime]
    category: TaskCategory
    custom_category: Optional[str]
    skill_level: TaskSkillLevel
    status: TaskStatus
    owner_id: Optional[int] = None
    freelancer_id: Optional[int] = None
    submitted_at: datetime
    created_at: Optional[datetime]

    customer_review: Optional[ReviewResponse] = None
    freelancer_review: Optional[ReviewResponse] = None

    owner_profile: Optional[Profile] = None

    model_config = {"use_enum_values": True, "from_attributes": True}
    

class ApplicationCreate(BaseModel):
    comment: Optional[str] = None
    proposed_price: Optional[float] = None
    proposed_deadline: Optional[datetime] = None

    model_config = {"from_attributes": True}

class ApplicationResponse(BaseModel):
    id: int
    task_id: int
    freelancer_id: int
    comment: Optional[str]
    proposed_price: Optional[float]
    proposed_deadline: Optional[datetime]
    status: ApplicationStatus

    model_config = {"use_enum_values": True, "from_attributes": True}