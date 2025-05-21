from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from .auth.routes import router as auth_router
from .users.routes import router as users_router
from .tasks.routes import router as tasks_router
from .reviews.routes import router as reviews_router
from .chat.routes import router as chat_router
from app.notifications.routes import router as notifications_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Freelance Marketplace")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(users_router, prefix="/users", tags=["Users"])
app.include_router(tasks_router, prefix="/tasks", tags=["Tasks"])
app.include_router(reviews_router, prefix="/reviews", tags=["Reviews"])
app.include_router(chat_router, prefix="/chat", tags=["Chat"])
app.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
async def root():
    return {"message": "Welcome to Freelance Marketplace"}  