import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.db import get_db
from app.models.models import User, Quiz, QuizQuestion
from app.schemas.schemas import QuizSubmitRequest, QuizOut, QuizQuestionOut
from app.auth.dependencies import get_current_user
from app.services.activity_service import log_activity

router = APIRouter(prefix="/api/quiz", tags=["Quiz"])


class QuizQuestionIn(BaseModel):
    question: str
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: Optional[str] = None


class QuizCreateRequest(BaseModel):
    topic: str
    difficulty: str
    questions: List[QuizQuestionIn]


@router.post("/start", response_model=QuizOut, status_code=201)
def start_quiz(payload: QuizCreateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Persists an AI-generated quiz so the student can attempt it and results can be tracked."""
    if not payload.questions:
        raise HTTPException(status_code=400, detail="No quiz questions were provided.")

    quiz = Quiz(
        user_id=current_user.id,
        topic=payload.topic or "General",
        difficulty=payload.difficulty,
        total_questions=len(payload.questions),
        score=0,
        percentage=0.0,
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    for q in payload.questions:
        db.add(QuizQuestion(
            quiz_id=quiz.id,
            question=q.question,
            options=json.dumps(q.options) if q.options else None,
            correct_answer=q.correct_answer,
            explanation=q.explanation,
        ))
    db.commit()
    db.refresh(quiz)
    return quiz


@router.get("/{quiz_id}/questions", response_model=list[QuizQuestionOut])
def get_quiz_questions(quiz_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")
    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).all()
    # Hide correct_answer while quiz is in progress would require more state;
    # for simplicity we return full data — frontend reveals it only after submit.
    return questions


@router.post("/submit", response_model=QuizOut)
def submit_quiz(payload: QuizSubmitRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == payload.quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    questions = {q.id: q for q in db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).all()}
    correct_count = 0

    for ans in payload.answers:
        q = questions.get(ans.question_id)
        if not q:
            continue
        q.user_answer = ans.user_answer
        is_correct = (
            ans.user_answer is not None
            and ans.user_answer.strip().lower() == (q.correct_answer or "").strip().lower()
        )
        q.is_correct = is_correct
        if is_correct:
            correct_count += 1

    quiz.score = correct_count
    quiz.percentage = round((correct_count / quiz.total_questions) * 100, 1) if quiz.total_questions else 0
    quiz.time_taken_seconds = payload.time_taken_seconds
    db.commit()
    db.refresh(quiz)

    log_activity(db, current_user.id, "quiz", {"quiz_id": quiz.id, "score": quiz.score, "percentage": quiz.percentage})
    return quiz


@router.get("", response_model=list[QuizOut])
def list_quizzes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Quiz)
        .filter(Quiz.user_id == current_user.id)
        .order_by(Quiz.created_at.desc())
        .all()
    )


@router.get("/{quiz_id}/review")
def review_quiz(quiz_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")
    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).all()
    return {
        "quiz": QuizOut.model_validate(quiz),
        "questions": [QuizQuestionOut.model_validate(q) for q in questions],
    }
