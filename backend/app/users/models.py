from sqlalchemy import Column, Integer, ForeignKey, String, Float, Text
from sqlalchemy.orm import relationship
from ..database import Base


class Profile(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    bio = Column(Text, nullable=True)
    rating = Column(Float, nullable=False, default=0.0)
    avatar_url = Column(String, nullable=True)
    total_spent = Column(Float, nullable=False, default=0.0)  # Общая сумма потраченных средств (для заказчика)
    total_earned = Column(Float, nullable=False, default=0.0)  # Общая сумма заработанных средств (для фрилансера)
    
    user = relationship("User", back_populates="profile")

class Skill(Base):
    __tablename__ = "skills"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    
    user = relationship("User", backref="skills")

class Portfolio(Base):
    __tablename__ = "portfolio"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    url = Column(String, nullable=True)
    
    user = relationship("User", backref="portfolio")