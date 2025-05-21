from fastapi import APIRouter, Depends, HTTPException, status, Form, UploadFile, File
from sqlalchemy.orm import Session
from ..auth.models import User, UserType
from ..auth.dependencies import get_current_user
from ..auth.routes import ban_user
from ..auth.schemas import UserResponse
from .models import Profile, Skill, Portfolio
from .schemas import SkillCreate, PortfolioCreate, ProfileUpdate
from ..database import get_db
from ..tasks.models import Task, TaskStatus
import os
from pathlib import Path
from sqlalchemy.exc import IntegrityError
from psycopg.errors import UniqueViolation
from sqlalchemy import delete

router = APIRouter()

UPLOAD_DIR = Path("uploads/avatars")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.put("/profile/update", response_model=UserResponse)
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if profile_data.username is not None:
        current_user.username = profile_data.username
    if profile_data.first_name is not None:
        current_user.first_name = profile_data.first_name
    if profile_data.last_name is not None:
        current_user.last_name = profile_data.last_name
    if profile_data.patronymic is not None:
        current_user.patronymic = profile_data.patronymic
    if profile_data.email is not None:
        current_user.email = profile_data.email

    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)
        db.commit()

    if profile_data.bio is not None:
        profile.bio = profile_data.bio

    if profile_data.skills is not None:
        db.execute(delete(Skill).where(Skill.user_id == current_user.id))
        for skill_data in profile_data.skills:
            skill = Skill(user_id=current_user.id, name=skill_data.name)
            db.add(skill)

    if profile_data.portfolio is not None:
        db.execute(delete(Portfolio).where(Portfolio.user_id == current_user.id))
        for portfolio_data in profile_data.portfolio:
            portfolio = Portfolio(
                user_id=current_user.id,
                title=portfolio_data.title,
                description=portfolio_data.description,
                url=portfolio_data.url
            )
            db.add(portfolio)

    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        if isinstance(e.orig, UniqueViolation):
            if "ix_users_username" in str(e.orig):
                raise HTTPException(status_code=400, detail="Данный логин уже используется, попробуйте другой")
            elif "ix_users_email" in str(e.orig):
                raise HTTPException(status_code=400, detail="Данный email уже используется, попробуйте другой")
        raise HTTPException(status_code=500, detail="Произошла ошибка при обновлении профиля")

    db.refresh(current_user)

    if current_user.user_type == UserType.CUSTOMER:
        completed_tasks_count = db.query(Task).filter(
            Task.owner_id == current_user.id,
            Task.status == TaskStatus.CLOSED.value
        ).count()
    else:
        completed_tasks_count = db.query(Task).filter(
            Task.freelancer_id == current_user.id,
            Task.status == TaskStatus.CLOSED.value
        ).count()

    profile_data_response = current_user.profile
    if profile_data_response:
        profile_data_response.portfolio = current_user.portfolio if current_user.portfolio else []

    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        patronymic=current_user.patronymic,
        email=current_user.email,
        user_type=current_user.user_type.value,
        is_banned=current_user.is_banned,
        ban_expires_at=current_user.ban_expires_at.isoformat() if current_user.ban_expires_at else None,
        created_at=current_user.created_at.isoformat() if current_user.created_at else None,
        profile=profile_data_response,
        skills=current_user.skills,
        completed_tasks_count=completed_tasks_count
    )

@router.put("/profile/avatar", response_model=UserResponse)
async def update_avatar(
    avatar: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)
        db.commit()

    if avatar:
        allowed_extensions = {".png", ".jpg", ".jpeg"}
        file_extension = os.path.splitext(avatar.filename)[1].lower()
        if file_extension not in allowed_extensions:
            raise HTTPException(status_code=400, detail="Only PNG, JPG, and JPEG files are allowed")
        
        max_size = 5 * 1024 * 1024
        content = await avatar.read()
        if len(content) > max_size:
            raise HTTPException(status_code=400, detail="File size must not exceed 5 MB")
        
        file_path = UPLOAD_DIR / f"{current_user.id}{file_extension}"
        with open(file_path, "wb") as f:
            f.write(content)
        
        profile.avatar_url = f"/uploads/avatars/{current_user.id}{file_extension}"

    db.commit()
    db.refresh(current_user)

    if current_user.user_type == UserType.CUSTOMER:
        completed_tasks_count = db.query(Task).filter(
            Task.owner_id == current_user.id,
            Task.status == TaskStatus.CLOSED.value
        ).count()
    else:
        completed_tasks_count = db.query(Task).filter(
            Task.freelancer_id == current_user.id,
            Task.status == TaskStatus.CLOSED.value
        ).count()

    profile_data_response = current_user.profile
    if profile_data_response:
        profile_data_response.portfolio = current_user.portfolio if current_user.portfolio else []

    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        patronymic=current_user.patronymic,
        email=current_user.email,
        user_type=current_user.user_type.value,
        is_banned=current_user.is_banned,
        ban_expires_at=current_user.ban_expires_at.isoformat() if current_user.ban_expires_at else None,
        created_at=current_user.created_at.isoformat() if current_user.created_at else None,
        profile=profile_data_response,
        skills=current_user.skills,
        completed_tasks_count=completed_tasks_count
    )

@router.get("/profile/{user_id}", response_model=UserResponse)
async def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if user.user_type == UserType.CUSTOMER:
        completed_tasks_count = db.query(Task).filter(
            Task.owner_id == user.id,
            Task.status == TaskStatus.CLOSED.value
        ).count()
    else:
        completed_tasks_count = db.query(Task).filter(
            Task.freelancer_id == user.id,
            Task.status == TaskStatus.CLOSED.value
        ).count()

    profile_data = user.profile
    if profile_data:
        profile_data.portfolio = user.portfolio if user.portfolio else []

    return UserResponse(
        id=user.id,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        patronymic=user.patronymic,
        email=user.email,
        user_type=user.user_type.value,
        is_banned=user.is_banned,
        ban_expires_at=user.ban_expires_at.isoformat() if user.ban_expires_at else None,
        created_at=user.created_at.isoformat() if user.created_at else None,
        profile=profile_data,
        skills=user.skills,
        completed_tasks_count=completed_tasks_count
    )

