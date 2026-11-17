
import hashlib
import secrets
import base64
import hmac
import os
from datetime import datetime, timedelta, timezone

from jose import jwt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas import UserRegister, UserLogin


router = APIRouter(prefix="/auth", tags=["Authentication"])

# JWT configuration
SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "development-secret-key-change-before-deployment"
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


# Password hashing
def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)

    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        600000
    )

    return (
        base64.b64encode(salt).decode()
        + "$"
        + base64.b64encode(hashed).decode()
    )


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_text, hash_text = stored_hash.split("$")
        salt = base64.b64decode(salt_text)
        expected_hash = base64.b64decode(hash_text)

        actual_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            600000
        )

        return hmac.compare_digest(actual_hash, expected_hash)

    except (ValueError, TypeError):
        return False


# JWT token generation
def create_access_token(user_id: int):
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "exp": expire
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# User registration
@router.post("/register")
def register(user_data: UserRegister, db: Session = Depends(get_db)):

    email = str(user_data.email).lower()

    existing_user = db.query(User).filter(
        User.email == email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )

    new_user = User(
        name=user_data.name,
        email=email,
        hashed_password=hash_password(user_data.password),
        phone=user_data.phone,
        role="Employee",
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Registration successful",
        "user_id": new_user.id,
        "name": new_user.name,
        "email": new_user.email,
        "role": new_user.role
    }


# User login
@router.post("/login")
def login(user_data: UserLogin, db: Session = Depends(get_db)):

    email = str(user_data.email).lower()

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user or not verify_password(
        user_data.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Account is deactivated"
        )

    access_token = create_access_token(user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
