"""
Pydantic schemas used to validate request bodies and shape API responses.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ---------- Auth ----------
class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    avatar: Optional[str] = None
    course: Optional[str] = None
    college: Optional[str] = None
    study_interests: Optional[str] = None
    theme_preference: str = "light"
    ai_response_preference: str = "balanced"
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Profile ----------
class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    course: Optional[str] = None
    college: Optional[str] = None
    study_interests: Optional[str] = None
    avatar: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6, max_length=100)


class SettingsUpdate(BaseModel):
    theme_preference: Optional[str] = None
    ai_response_preference: Optional[str] = None


# ---------- Chat ----------
class ChatSessionOut(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatSendRequest(BaseModel):
    session_id: Optional[int] = None
    message: str
    material_id: Optional[int] = None  # optional: ground answer in a specific document


class ChatRenameRequest(BaseModel):
    title: str


# ---------- AI ----------
class SummarizeRequest(BaseModel):
    text: Optional[str] = None
    material_id: Optional[int] = None
    length: str = "medium"  # short / medium / detailed / bullet / exam


class QuestionGenRequest(BaseModel):
    topic: Optional[str] = None
    material_id: Optional[int] = None
    difficulty: str = "medium"  # easy / medium / hard
    num_questions: int = 5
    question_type: str = "mcq"  # mcq / short / long / truefalse / mixed


class QuizGenRequest(BaseModel):
    topic: Optional[str] = None
    material_id: Optional[int] = None
    difficulty: str = "medium"
    num_questions: int = 5


# ---------- Materials ----------
class MaterialOut(BaseModel):
    id: int
    filename: str
    file_type: str
    file_size: int
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Notes ----------
class NoteCreate(BaseModel):
    title: str
    subject: str = "General"
    content: str
    is_pinned: bool = False


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    content: Optional[str] = None
    is_pinned: Optional[bool] = None


class NoteOut(BaseModel):
    id: int
    title: str
    subject: str
    content: str
    is_pinned: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------- Quiz ----------
class QuizAnswerSubmit(BaseModel):
    question_id: int
    user_answer: Optional[str] = None


class QuizSubmitRequest(BaseModel):
    quiz_id: int
    answers: List[QuizAnswerSubmit]
    time_taken_seconds: int = 0


class QuizQuestionOut(BaseModel):
    id: int
    question: str
    options: Optional[str] = None
    correct_answer: str
    explanation: Optional[str] = None
    user_answer: Optional[str] = None
    is_correct: Optional[bool] = None

    class Config:
        from_attributes = True


class QuizOut(BaseModel):
    id: int
    topic: str
    difficulty: str
    total_questions: int
    score: int
    percentage: float
    time_taken_seconds: int
    created_at: datetime

    class Config:
        from_attributes = True
