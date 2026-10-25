"""
Central configuration for the app.
Reads values from environment variables / the .env file.
"""
import os
from dotenv import load_dotenv

# Load variables from backend/.env into the process environment
load_dotenv()


class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./study_assistant.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "insecure_dev_secret_change_me")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", "10"))
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")


settings = Settings()
