from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.db import get_db
from app.models.models import User, Note
from app.schemas.schemas import NoteCreate, NoteUpdate, NoteOut
from app.auth.dependencies import get_current_user
from app.services.activity_service import log_activity

router = APIRouter(prefix="/api/notes", tags=["Notes"])


@router.get("", response_model=list[NoteOut])
def list_notes(
    search: str = None,
    subject: str = None,
    sort: str = "newest",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Note).filter(Note.user_id == current_user.id)
    if search:
        like = f"%{search}%"
        query = query.filter(or_(Note.title.ilike(like), Note.content.ilike(like)))
    if subject:
        query = query.filter(Note.subject == subject)

    query = query.order_by(Note.is_pinned.desc())
    if sort == "oldest":
        query = query.order_by(Note.created_at.asc())
    else:
        query = query.order_by(Note.created_at.desc())

    return query.all()


@router.post("", response_model=NoteOut, status_code=201)
def create_note(payload: NoteCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not payload.title.strip() or not payload.content.strip():
        raise HTTPException(status_code=400, detail="Please enter a title and content for the note.")

    note = Note(
        user_id=current_user.id,
        title=payload.title.strip(),
        subject=payload.subject.strip() or "General",
        content=payload.content,
        is_pinned=payload.is_pinned,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    log_activity(db, current_user.id, "note_create", {"note_id": note.id})
    return note


@router.put("/{note_id}", response_model=NoteOut)
def update_note(note_id: int, payload: NoteUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found.")

    if payload.title is not None:
        note.title = payload.title.strip()
    if payload.subject is not None:
        note.subject = payload.subject.strip() or "General"
    if payload.content is not None:
        note.content = payload.content
    if payload.is_pinned is not None:
        note.is_pinned = payload.is_pinned

    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}")
def delete_note(note_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found.")
    db.delete(note)
    db.commit()
    return {"detail": "Note deleted."}
