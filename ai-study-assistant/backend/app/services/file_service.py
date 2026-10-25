"""
File handling: validation, safe saving, and text extraction from
uploaded study materials (PDF, TXT, DOCX).
"""
import os
import uuid
from fastapi import UploadFile, HTTPException
from app.config import settings

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx"}
MAX_UPLOAD_BYTES = settings.MAX_UPLOAD_MB * 1024 * 1024


def validate_file(file: UploadFile, size_bytes: int):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Only PDF, TXT and DOCX files are allowed.",
        )
    if size_bytes > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum allowed size is {settings.MAX_UPLOAD_MB} MB.",
        )
    return ext


def save_upload(file: UploadFile, contents: bytes, user_id: int) -> str:
    """Saves the file to disk with a unique, safe filename. Returns the path."""
    ext = os.path.splitext(file.filename)[1].lower()
    safe_name = f"{user_id}_{uuid.uuid4().hex}{ext}"
    user_dir = os.path.join(settings.UPLOAD_DIR, str(user_id))
    os.makedirs(user_dir, exist_ok=True)
    file_path = os.path.join(user_dir, safe_name)
    with open(file_path, "wb") as f:
        f.write(contents)
    return file_path


def extract_text(file_path: str, ext: str) -> str:
    """Extracts plain text from a PDF, TXT or DOCX file."""
    try:
        if ext == ".txt":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()

        if ext == ".pdf":
            from pypdf import PdfReader
            reader = PdfReader(file_path)
            text_parts = []
            for page in reader.pages:
                page_text = page.extract_text() or ""
                text_parts.append(page_text)
            return "\n".join(text_parts)

        if ext == ".docx":
            import docx
            document = docx.Document(file_path)
            return "\n".join(p.text for p in document.paragraphs)

    except Exception:
        # Extraction failure shouldn't crash the upload — just return empty text
        return ""

    return ""
