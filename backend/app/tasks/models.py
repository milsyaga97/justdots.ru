from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Enum as SQLAlchemyEnum
from sqlalchemy import ForeignKey
from sqlalchemy import func
from ..database import Base
import enum
from sqlalchemy.orm import relationship

class TaskStatus(enum.Enum):
    PENDING_MODERATION = "На рассмотрении модерацией"
    REJECTED_BY_MODERATION = "Отклонена модерацией"
    OPEN = "Открытая"
    IN_PROGRESS = "В процессе"
    CLOSED = "Закрытая"

class TaskSkillLevel(enum.Enum):
    BASIC = "Менее года"
    MEDIUM = "От 1 до 3 лет"
    ADVANCED = "Более 3 лет"

class TaskCategory(enum.Enum):
    DEVELOPMENT = "Разработка"
    DESIGN = "Дизайн"
    PROGRAMMING = "Программирование"
    COPYWRITING = "Копирайтинг"
    OTHER = "Другое"

def enum_values(enum_class):
    return [e.value for e in enum_class]

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    budget_min = Column(Float, nullable=True)
    budget_max = Column(Float, nullable=True)
    deadline = Column(DateTime, nullable=True)
    category = Column(
        SQLAlchemyEnum(TaskCategory, values_callable=lambda x: enum_values(TaskCategory)),
        nullable=False
    )
    custom_category = Column(String(255), nullable=True)
    skill_level = Column(
        SQLAlchemyEnum(TaskSkillLevel, values_callable=lambda x: enum_values(TaskSkillLevel)),
        nullable=False
    )
    status = Column(
        SQLAlchemyEnum(TaskStatus, values_callable=lambda x: enum_values(TaskStatus)),
        default=TaskStatus.PENDING_MODERATION.value,
        nullable=False
    )
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    freelancer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), nullable=True)
    reviews = relationship("Review", back_populates="task")

class ApplicationStatus(enum.Enum):
    PENDING = "На рассмотрении"
    ACCEPTED = "Принята"
    REJECTED = "Отклонена"

class Application(Base):
    __tablename__ = "applications"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    freelancer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    comment = Column(Text, nullable=True)
    proposed_price = Column(Float, nullable=True)
    proposed_deadline = Column(DateTime, nullable=True)
    status = Column(
        SQLAlchemyEnum(ApplicationStatus, values_callable=lambda x: enum_values(ApplicationStatus)),
        default=ApplicationStatus.PENDING.value,
        nullable=False
    )
    