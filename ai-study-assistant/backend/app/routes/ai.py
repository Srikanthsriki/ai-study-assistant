"""
AI routes. The frontend calls these endpoints; the backend is the only
place that talks to Gemini, so the API key is never exposed to the browser.
"""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.models import User, ChatSession, ChatMessage, StudyMaterial
from app.schemas.schemas import (
    ChatSendRequest, ChatSessionOut, ChatMessageOut, ChatRenameRequest,
    SummarizeRequest, QuestionGenRequest, QuizGenRequest,
)
from app.auth.dependencies import get_current_user
from app.services import gemini_service
from app.services.activity_service import log_activity

router = APIRouter(prefix="/api/ai", tags=["AI"])


def _get_material_text(db: Session, user_id: int, material_id: int) -> str:
    material = (
        db.query(StudyMaterial)
        .filter(StudyMaterial.id == material_id, StudyMaterial.user_id == user_id)
        .first()
    )
    if not material:
        raise HTTPException(status_code=404, detail="Study material not found.")
    if not material.extracted_text:
        raise HTTPException(
            status_code=400,
            detail="No readable text could be extracted from this file.",
        )
    return material.extracted_text


# ---------------- Chat ----------------

@router.get("/chat/sessions", response_model=list[ChatSessionOut])
def list_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )


@router.get("/chat/sessions/{session_id}/messages", response_model=list[ChatMessageOut])
def get_messages(session_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Chat not found.")
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )


@router.post("/chat/sessions/{session_id}/rename", response_model=ChatSessionOut)
def rename_session(session_id: int, payload: ChatRenameRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Chat not found.")
    session.title = payload.title.strip()[:200] or session.title
    db.commit()
    db.refresh(session)
    return session


@router.delete("/chat/sessions/{session_id}")
def delete_session(session_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Chat not found.")
    db.delete(session)
    db.commit()
    return {"detail": "Chat deleted."}


@router.post("/chat")
def send_chat_message(payload: ChatSendRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Please enter a message first.")

    # Get or create session
    session = None
    if payload.session_id:
        session = (
            db.query(ChatSession)
            .filter(ChatSession.id == payload.session_id, ChatSession.user_id == current_user.id)
            .first()
        )
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found.")
    if not session:
        title = payload.message.strip()[:50]
        session = ChatSession(user_id=current_user.id, title=title or "New Chat")
        db.add(session)
        db.commit()
        db.refresh(session)

    # Load recent history for context
    history_rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    history = [{"role": m.role, "content": m.content} for m in history_rows]

    context_text = None
    if payload.material_id:
        context_text = _get_material_text(db, current_user.id, payload.material_id)

    # Save user message
    user_msg = ChatMessage(session_id=session.id, role="user", content=payload.message.strip())
    db.add(user_msg)
    db.commit()

    try:
        reply_text = gemini_service.chat_reply(history, payload.message.strip(), context_text)
    except gemini_service.GeminiServiceError as e:
        raise HTTPException(status_code=503, detail=str(e))

    ai_msg = ChatMessage(session_id=session.id, role="assistant", content=reply_text)
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)

    log_activity(db, current_user.id, "chat", {"session_id": session.id})

    return {
        "session_id": session.id,
        "session_title": session.title,
        "reply": reply_text,
        "message_id": ai_msg.id,
    }


# ---------------- Summarize ----------------

@router.post("/summarize")
def summarize(payload: SummarizeRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    text = payload.text
    if payload.material_id:
        text = _get_material_text(db, current_user.id, payload.material_id)

    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Please enter some study material first.")

    try:
        summary = gemini_service.summarize_text(text, payload.length)
    except gemini_service.GeminiServiceError as e:
        raise HTTPException(status_code=503, detail=str(e))

    log_activity(db, current_user.id, "summarize", {"length": payload.length})
    return {"summary": summary}


# ---------------- Question Generator ----------------

@router.post("/generate-questions")
def generate_questions(payload: QuestionGenRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    source_text = payload.topic
    if payload.material_id:
        source_text = _get_material_text(db, current_user.id, payload.material_id)

    if not source_text or not source_text.strip():
        raise HTTPException(status_code=400, detail="Please enter a topic or select study material first.")

    num_q = max(1, min(payload.num_questions, 20))

    try:
        questions = gemini_service.generate_questions(
            source_text, payload.difficulty, num_q, payload.question_type
        )
    except gemini_service.GeminiServiceError as e:
        raise HTTPException(status_code=503, detail=str(e))

    log_activity(db, current_user.id, "generate_questions", {"topic": payload.topic, "count": num_q})
    return {"questions": questions}


# ---------------- Quiz Generator ----------------

@router.post("/generate-quiz")
def generate_quiz_ai(payload: QuizGenRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    source_text = payload.topic
    if payload.material_id:
        source_text = _get_material_text(db, current_user.id, payload.material_id)

    if not source_text or not source_text.strip():
        raise HTTPException(status_code=400, detail="Please enter a topic or select study material first.")

    num_q = max(1, min(payload.num_questions, 20))

    try:
        questions = gemini_service.generate_quiz(source_text, payload.difficulty, num_q)
    except gemini_service.GeminiServiceError as e:
        raise HTTPException(status_code=503, detail=str(e))

    return {"questions": questions, "topic": payload.topic or "Uploaded Material", "difficulty": payload.difficulty}
