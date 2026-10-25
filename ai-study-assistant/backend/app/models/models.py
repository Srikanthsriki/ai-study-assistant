"""
All SQLAlchemy ORM models (database tables) for AI Study Assistant.
Kept in a single file for simplicity — easy for beginners to read.
"""
from sqlalchemy import (
    Column, Integer, String, Text, ForeignKey, DateTime, Float, Boolean
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    avatar = Column(String(255), nullable=True)
    course = Column(String(120), nullable=True)
    college = Column(String(200), nullable=True)
    study_interests = Column(String(300), nullable=True)
    theme_preference = Column(String(10), default="light")
    ai_response_preference = Column(String(20), default="balanced")  # concise / balanced / detailed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    materials = relationship("StudyMaterial", back_populates="user", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="user", cascade="all, delete-orphan")
    activities = relationship("StudyActivity", back_populates="user", cascade="all, delete-orphan")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), default="New Chat")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("ChatSession", back_populates="messages")


class StudyMaterial(Base):
    __tablename__ = "study_materials"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)  # bytes
    extracted_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="materials")


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    subject = Column(String(120), default="General")
    content = Column(Text, nullable=False)
    is_pinned = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="notes")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    topic = Column(String(200), nullable=False)
    difficulty = Column(String(20), nullable=False)
    total_questions = Column(Integer, default=0)
    score = Column(Integer, default=0)
    percentage = Column(Float, default=0.0)
    time_taken_seconds = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False, index=True)
    question = Column(Text, nullable=False)
    options = Column(Text, nullable=True)  # JSON-encoded list of options (for MCQ)
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    user_answer = Column(Text, nullable=True)
    is_correct = Column(Boolean, nullable=True)

    quiz = relationship("Quiz", back_populates="questions")


class StudyActivity(Base):
    """Generic activity log used to power the Progress dashboard."""
    __tablename__ = "study_activity"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    activity_type = Column(String(50), nullable=False)
    # e.g. "chat", "summarize", "generate_questions", "quiz", "upload_material"
    activity_metadata = Column(Text, nullable=True)  # JSON-encoded extra info
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="activities")


class GeneratedQuestionSet(Base):
    """Saved question sets from the Question Generator feature."""
    __tablename__ = "generated_question_sets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    topic = Column(String(200), nullable=False)
    difficulty = Column(String(20), nullable=False)
    question_type = Column(String(20), nullable=False)
    content_json = Column(Text, nullable=False)  # JSON-encoded questions
    created_at = Column(DateTime(timezone=True), server_default=func.now())
