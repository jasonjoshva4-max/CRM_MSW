
import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.dependencies import get_current_user
from app.schemas import ProfileUpdate, PasswordChange
from app.routes.auth import hash_password, verify_password


router = APIRouter(
    prefix="/profile",
    tags=["User Profile"]
)


# Profile picture storage
UPLOAD_DIR = Path("uploads/profiles")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 2 * 1024 * 1024


# View own profile
@router.get("/me")
def get_profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "manager_id": current_user.manager_id,
        "profile_picture": current_user.profile_picture
    }


# Update own profile
@router.put("/me")
def update_profile(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    updates = data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        if value is not None:
            setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Profile updated successfully",
        "name": current_user.name,
        "phone": current_user.phone
    }


# Change own password
@router.put("/change-password")
def change_password(
    data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(
        data.current_password,
        current_user.hashed_password
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

    current_user.hashed_password = hash_password(data.new_password)
    db.commit()

    return {"message": "Password changed successfully"}


# Upload profile picture
@router.post("/upload-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    extension = Path(file.filename or "").suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, JPEG and PNG images are allowed"
        )

    if file.content_type not in {
        "image/jpeg",
        "image/png"
    }:
        raise HTTPException(
            status_code=400,
            detail="Invalid image content type"
        )

    contents = await file.read(MAX_FILE_SIZE + 1)

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty"
        )

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Image size must not exceed 2 MB"
        )

    # Generate a unique filename
    filename = f"user_{current_user.id}_{uuid.uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / filename

    # Save image
    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    # Delete previous profile picture
    if current_user.profile_picture:
        old_path = Path(current_user.profile_picture)

        if old_path.exists():
            old_path.unlink()

    current_user.profile_picture = str(file_path).replace("\\", "/")

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Profile picture uploaded successfully",
        "profile_picture": current_user.profile_picture
    }

