"""
AI Study Assistant - FastAPI backend entry point.

Run with:
    uvicorn app.main:app --reload
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database.db import Base, engine
from app.config import settings

# Import all routers
from app.routes import auth, ai, materials, notes, quiz, questions, progress, profile

# Create all database tables on startup (SQLite dev-friendly; use Alembic
# migrations if/when you move to PostgreSQL in production)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Study Assistant API",
    description="Backend API for the AI Study Assistant platform (Gemini-powered).",
    version="1.0.0",
)

# CORS - allow the frontend dev server (and any configured production origin)
origins = [o.strip() for o in settings.FRONTEND_ORIGIN.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    # Keep error responses clean and consistent for the frontend
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.get("/")
def root():
    return {"message": "AI Study Assistant API is running.", "docs": "/docs"}


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


# Register all feature routers
app.include_router(auth.router)
app.include_router(ai.router)
app.include_router(materials.router)
app.include_router(notes.router)
app.include_router(quiz.router)
app.include_router(questions.router)
app.include_router(progress.router)
app.include_router(profile.router)
