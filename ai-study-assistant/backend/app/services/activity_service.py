"""
Helper to log user study activity, used to power the Progress dashboard.
"""
import json
from sqlalchemy.orm import Session
from app.models.models import StudyActivity


def log_activity(db: Session, user_id: int, activity_type: str, metadata: dict = None):
    activity = StudyActivity(
        user_id=user_id,
        activity_type=activity_type,
        activity_metadata=json.dumps(metadata or {}),
    )
    db.add(activity)
    db.commit()
