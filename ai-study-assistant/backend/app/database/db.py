"""
Database connection setup using SQLAlchemy.
Uses SQLite for development. To migrate to PostgreSQL later,
just change DATABASE_URL in .env to a postgres:// connection string —
the models and queries below do not need to change.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    # Needed only for SQLite when used with FastAPI's threaded requests
    connect_args = {"check_same_thread": False}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that provides a DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
