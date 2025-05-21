from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.models import User
from ..tasks.models import Task, TaskStatus
from .models import Review
from .schemas import ReviewCreate, ReviewResponse
from ..auth.dependencies import get_current_user
from ..notifications.utils import send_notification


router = APIRouter()

@router.post("/{task_id}/review", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    task_id: int,
    review_data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    if task.status != TaskStatus.CLOSED:
        raise HTTPException(status_code=400, detail="Задача должна быть закрыта для отзыва")

    if current_user.id not in [task.owner_id, task.freelancer_id]:
        raise HTTPException(status_code=403, detail="Вы не участвовали в этой задаче")

    if current_user.id == task.owner_id:
        reviewer_id = task.freelancer_id
    else:
        reviewer_id = task.owner_id

    existing_review = db.query(Review).filter(
        Review.user_id == current_user.id,
        Review.reviewer_id == reviewer_id,
        Review.task_id == task_id
    ).first()

    if existing_review:
        raise HTTPException(status_code=400, detail="Вы уже оставили отзыв по этой задаче")

    new_review = Review(
        user_id=current_user.id,
        reviewer_id=reviewer_id,
        task_id=task_id,
        comment=review_data.comment,
        score=review_data.score
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    reviews = db.query(Review).filter(Review.reviewer_id == reviewer_id).all()
    total_score = sum(review.score for review in reviews)
    average_rating = round(total_score / len(reviews), 1) if reviews else 0.0

    reviewer = db.query(User).get(reviewer_id)
    if not reviewer:
        raise HTTPException(status_code=404, detail="Пользователь для отзыва не найден")

    reviewer.rating = average_rating
    if reviewer.profile:
        reviewer.profile.rating = average_rating
    db.commit()
    
    await send_notification(
        db=db,
        user_id=reviewer_id,
        type="review_received",
        message=f"Вы получили новый отзыв по задаче '{task.title}'",
        task_id=task.id
    )
    
    return new_review

@router.get("/user/{user_id}", response_model=list[ReviewResponse])
async def get_reviews_by_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    reviews = db.query(Review).filter(Review.reviewer_id == user_id).all()
    return reviews