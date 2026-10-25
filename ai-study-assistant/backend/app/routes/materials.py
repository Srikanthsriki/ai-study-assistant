import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.models import User, StudyMaterial
from app.schemas.schemas import MaterialOut
from app.auth.dependencies import get_current_user
from app.services.file_service import validate_file, save_upload, extract_text
from app.services.activity_service import log_activity

router = APIRouter(prefix="/api/materials", tags=["Study Materials"])


@router.get("", response_model=list[MaterialOut])
def list_materials(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(StudyMaterial)
        .filter(StudyMaterial.user_id == current_user.id)
        .order_by(StudyMaterial.created_at.desc())
        .all()
    )


@router.post("/upload", response_model=MaterialOut, status_code=201)
async def upload_material(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contents = await file.read()
    ext = validate_file(file, len(contents))
    file_path = save_upload(file, contents, current_user.id)
    text = extract_text(file_path, ext)

    material = StudyMaterial(
        user_id=current_user.id,
        filename=file.filename,
        file_type=ext.replace(".", ""),
        file_path=file_path,
        file_size=len(contents),
        extracted_text=text,
    )
    db.add(material)
    db.commit()
    db.refresh(material)

    log_activity(db, current_user.id, "upload_material", {"filename": file.filename})
    return material


@router.get("/{material_id}/content")
def get_material_content(material_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    material = (
        db.query(StudyMaterial)
        .filter(StudyMaterial.id == material_id, StudyMaterial.user_id == current_user.id)
        .first()
    )
    if not material:
        raise HTTPException(status_code=404, detail="Study material not found.")
    return {
        "id": material.id,
        "filename": material.filename,
        "extracted_text": material.extracted_text or "",
    }


@router.delete("/{material_id}")
def delete_material(material_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    material = (
        db.query(StudyMaterial)
        .filter(StudyMaterial.id == material_id, StudyMaterial.user_id == current_user.id)
        .first()
    )
    if not material:
        raise HTTPException(status_code=404, detail="Study material not found.")

    # Remove the file from disk if it exists
    if material.file_path and os.path.exists(material.file_path):
        try:
            os.remove(material.file_path)
        except OSError:
            pass

    db.delete(material)
    db.commit()
    return {"detail": "Material deleted."}
