from app.database import SessionLocal
from app.models.user import User

db = SessionLocal()

try:
    admin = db.query(User).filter(
        User.role == "Admin",
        User.email == "admin@embercrm.local"
    ).first()

    if admin:
        admin.email = "ember.admin@example.com"
        db.commit()
        print("Admin email updated successfully!")
    else:
        print("Admin account not found.")

finally:
    db.close()
    db.close()