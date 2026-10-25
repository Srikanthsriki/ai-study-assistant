"""
Progress / dashboard statistics routes.
All numbers are calculated from real user activity in the database.
"""
from collections import defaultdict
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.db import get_db
from app.models.models import User, ChatSession, ChatMessage, StudyMaterial, Quiz, StudyActivity
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/progress", tags=["Progress"])


@router.get("/stats")
def get_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    uid = current_user.id

    study_sessions = db.query(func.count(ChatSession.id)).filter(ChatSession.user_id == uid).scalar() or 0
    questions_asked = (
        db.query(func.count(ChatMessage.id))
        .join(ChatSession, ChatMessage.session_id == ChatSession.id)
        .filter(ChatSession.user_id == uid, ChatMessage.role == "user")
        .scalar() or 0
    )
    materials_uploaded = db.query(func.count(StudyMaterial.id)).filter(StudyMaterial.user_id == uid).scalar() or 0

    quizzes = db.query(Quiz).filter(Quiz.user_id == uid).all()
    quizzes_completed = len([q for q in quizzes if q.total_questions and q.time_taken_seconds is not None and q.score is not None])
    avg_score = round(sum(q.percentage for q in quizzes) / len(quizzes), 1) if quizzes else 0
    best_score = max((q.percentage for q in quizzes), default=0)

    # Study streak: consecutive days (including today) with at least one activity
    activities = (
        db.query(StudyActivity.created_at)
        .filter(StudyActivity.user_id == uid)
        .order_by(StudyActivity.created_at.desc())
        .all()
    )
    activity_days = sorted({a.created_at.date() for a in activities}, reverse=True)
    streak = 0
    today = datetime.utcnow().date()
    expected = today
    for day in activity_days:
        if day == expected:
            streak += 1
            expected = expected - timedelta(days=1)
        elif day < expected:
            break

    return {
        "study_sessions": study_sessions,
        "quizzes_completed": len(quizzes),
        "average_quiz_score": avg_score,
        "best_score": best_score,
        "materials_uploaded": materials_uploaded,
        "questions_asked": questions_asked,
        "study_streak": streak,
    }


@router.get("/weekly-activity")
def weekly_activity(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns activity counts for the last 7 days (Mon-Sun style)."""
    uid = current_user.id
    since = datetime.utcnow() - timedelta(days=6)
    rows = (
        db.query(StudyActivity)
        .filter(StudyActivity.user_id == uid, StudyActivity.created_at >= since)
        .all()
    )
    counts = defaultdict(int)
    for r in rows:
        counts[r.created_at.date()] += 1

    days = []
    for i in range(6, -1, -1):
        d = (datetime.utcnow() - timedelta(days=i)).date()
        days.append({"date": d.isoformat(), "label": d.strftime("%a"), "count": counts.get(d, 0)})
    return days


@router.get("/quiz-scores")
def quiz_scores(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    quizzes = (
        db.query(Quiz)
        .filter(Quiz.user_id == current_user.id)
        .order_by(Quiz.created_at.asc())
        .all()
    )
    return [
        {"date": q.created_at.strftime("%b %d"), "topic": q.topic, "percentage": q.percentage}
        for q in quizzes
    ]


@router.get("/subject-performance")
def subject_performance(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    quizzes = db.query(Quiz).filter(Quiz.user_id == current_user.id).all()
    by_topic = defaultdict(list)
    for q in quizzes:
        by_topic[q.topic].append(q.percentage)

    performance = [
        {"topic": topic, "average": round(sum(scores) / len(scores), 1), "attempts": len(scores)}
        for topic, scores in by_topic.items()
    ]
    performance.sort(key=lambda x: x["average"], reverse=True)

    strongest = performance[0]["topic"] if performance else None
    needs_practice = performance[-1]["topic"] if len(performance) > 1 else None

    return {
        "subjects": performance,
        "strongest_subject": strongest,
        "needs_more_practice": needs_practice,
    }


@router.get("/recent-activity")
def recent_activity(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(StudyActivity)
        .filter(StudyActivity.user_id == current_user.id)
        .order_by(StudyActivity.created_at.desc())
        .limit(10)
        .all()
    )
    return [
        {"id": r.id, "type": r.activity_type, "created_at": r.created_at}
        for r in rows
    ]
