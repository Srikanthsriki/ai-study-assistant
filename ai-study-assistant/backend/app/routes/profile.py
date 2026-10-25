from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.models import User
from app.schemas.schemas import ProfileUpdate, PasswordChange, SettingsUpdate, UserOut
from app.auth.dependencies import get_current_user
from app.auth.security import verify_password, hash_password

router = APIRouter(prefix="/api/profile", tags=["Profile & Settings"])


@router.put("", response_model=UserOut)
def update_profile(payload: ProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.name is not None and payload.name.strip():
        current_user.name = payload.name.strip()
    if payload.course is not None:
        current_user.course = payload.course.strip()
    if payload.college is not None:
        current_user.college = payload.college.strip()
    if payload.study_interests is not None:
        current_user.study_interests = payload.study_interests.strip()
    if payload.avatar is not None:
        current_user.avatar = payload.avatar

    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/password")
def change_password(payload: PasswordChange, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"detail": "Password updated successfully."}


@router.put("/settings", response_model=UserOut)
def update_settings(payload: SettingsUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.theme_preference is not None:
        current_user.theme_preference = payload.theme_preference
    if payload.ai_response_preference is not None:
        current_user.ai_response_preference = payload.ai_response_preference
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/account")
def delete_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(current_user)
    db.commit()
    return {"detail": "Account deleted."}
