
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)

    role = Column(String(20), nullable=False, default="Employee")
    is_active = Column(Boolean, default=True, nullable=False)

    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    profile_picture = Column(String(500), nullable=True)
