from getpass import getpass

from app.database import SessionLocal
from app.models.user import User
from app.routes.auth import hash_password


db = SessionLocal()

try:
    email = input("Admin email: ").strip().lower()
    name = input("Admin name: ").strip()
    phone = input("Admin phone: ").strip()
    password = getpass("Admin password (minimum 8 characters): ")

    if len(password) < 8:
        raise ValueError("Password must contain at least 8 characters.")

    existing = db.query(User).filter(User.email == email).first()

    if existing:
        print("This email is already registered.")
    else:
        admin = User(
            name=name,
            email=email,
            phone=phone,
            hashed_password=hash_password(password),
            role="Admin",
            is_active=True,
        )

        db.add(admin)
        db.commit()

        print("Admin account created successfully!")

finally:
    db.close()
