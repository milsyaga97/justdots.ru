from pydantic import BaseModel, validator
from typing import List
from pydantic.networks import AnyUrl
from pydantic_core import PydanticCustomError
from pydantic import TypeAdapter
import re
from fastapi import UploadFile

class SkillBase(BaseModel):
    name: str

class Skill(SkillBase):
    id: int
  
    class Config:
        from_attributes = True

class PortfolioBase(BaseModel):
    title: str
    description: str | None = None
    url: str | None = None

    @validator("url")
    def validate_url(cls, v):
        if v is None:
            return v
        if not v.startswith(("http://", "https://")):
            v = f"https://{v}"
        try:
            url_adapter = TypeAdapter(AnyUrl)
            url_adapter.validate_python(v)
            return v
        except PydanticCustomError:
            raise ValueError("Invalid URL format")

class Portfolio(PortfolioBase):
    id: int

    class Config:
        from_attributes = True

class ProfileBase(BaseModel):
    bio: str | None = None
    rating: float | None = None
    avatar_url: str | None = None
    total_spent: float = 0.0
    total_earned: float = 0.0

class Profile(ProfileBase):
    user_id: int
    portfolio: List[Portfolio] = []

    class Config:
        from_attributes = True

class SkillCreate(BaseModel):
    name: str

class PortfolioCreate(BaseModel):
    title: str
    description: str | None = None
    url: str | None = None

class ProfileUpdate(BaseModel):
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    patronymic: str | None = None
    email: str | None = None
    bio: str | None = None
    skills: List[SkillCreate] | None = None
    portfolio: List[PortfolioCreate] | None = None

    @validator("username")
    def validate_username(cls, v):
        if v and not re.match(r"^[a-zA-Z0-9_]{3,50}$", v):
            raise ValueError(
                "Username должен содержать только латинские буквы, цифры и подчёркивания, "
                "без пробелов, длиной от 3 до 50 символов"
            )
        return v

    @validator("email", pre=True)
    def validate_email(cls, v):
        if v and "@" not in v:
            raise ValueError("Invalid email format")
        return v

    @validator("bio")
    def validate_bio(cls, v):
        if v and len(v) > 500:
            raise ValueError("Bio must not exceed 500 characters")
        return v
