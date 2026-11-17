from getpass import getpass

from app.database import SessionLocal
from app.models.user import User
from app.routes.auth import hash_password


db = SessionLocal()

try:
    email = input("Manager email: ").strip().lower()
    name = input("Manager name: ").strip()
    phone = input("Manager phone: ").strip()
    password = getpass("Manager password (minimum 8 characters): ")

    if len(password) < 8:
        raise ValueError("Password must contain at least 8 characters.")

    existing = db.query(User).filter(User.email == email).first()

    if existing:
        print("This email is already registered.")
    else:
        manager = User(
            name=name,
            email=email,
            phone=phone,
            hashed_password=hash_password(password),
            role="Manager",
            is_active=True,
        )

        db.add(manager)
        db.commit()

        print("Manager account created successfully!")

finally:
    db.close()