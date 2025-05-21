from sqlalchemy import Column, Integer, String, Enum, Text, DateTime,Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base
import sqlalchemy as sa
import enum

class UserType(str, enum.Enum):
    CUSTOMER = "customer"
    FREELANCER = "freelancer"
    MODERATOR = "moderator"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, nullable=False, unique=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    patronymic = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    user_type = Column(Enum(UserType), nullable=False)
    is_banned = Column(sa.Boolean, default=False, nullable=False)
    ban_expires_at = Column(DateTime, nullable=True)
    rating = Column(Float, nullable=True)
    balance = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=func.now())
    profile = relationship("Profile", back_populates="user", uselist=False)

class BlacklistedToken(Base):
    __tablename__ = "blacklisted_tokens"
    id = Column(Integer, primary_key=True, index=True)
    token = Column(Text, unique=True, nullable=False)