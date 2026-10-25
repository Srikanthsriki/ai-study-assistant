import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Any

from app.database.db import get_db
from app.models.models import User, GeneratedQuestionSet
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/question-sets", tags=["Question Sets"])


class QuestionSetSave(BaseModel):
    topic: str
    difficulty: str
    question_type: str
    questions: Any


@router.post("", status_code=201)
def save_question_set(payload: QuestionSetSave, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    qset = GeneratedQuestionSet(
        user_id=current_user.id,
        topic=payload.topic or "General",
        difficulty=payload.difficulty,
        question_type=payload.question_type,
        content_json=json.dumps(payload.questions),
    )
    db.add(qset)
    db.commit()
    db.refresh(qset)
    return {"id": qset.id, "detail": "Question set saved."}


@router.get("")
def list_question_sets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(GeneratedQuestionSet)
        .filter(GeneratedQuestionSet.user_id == current_user.id)
        .order_by(GeneratedQuestionSet.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "topic": r.topic,
            "difficulty": r.difficulty,
            "question_type": r.question_type,
            "questions": json.loads(r.content_json),
            "created_at": r.created_at,
        }
        for r in rows
    ]


@router.delete("/{set_id}")
def delete_question_set(set_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = (
        db.query(GeneratedQuestionSet)
        .filter(GeneratedQuestionSet.id == set_id, GeneratedQuestionSet.user_id == current_user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Question set not found.")
    db.delete(row)
    db.commit()
    return {"detail": "Deleted."}
