
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, Numeric, Text
from app.database import Base


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)

    # Lead contact information
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(20), nullable=False)

    # Company and lead details
    company = Column(String(150), nullable=True)
    source = Column(String(100), nullable=False)
    expected_deal_value = Column(Numeric(12, 2), nullable=False)
    description = Column(Text, nullable=True)
    stage = Column(String(30), nullable=False, default="New")
    priority = Column(String(20), nullable=False, default="Medium")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Employee assignment and ownership
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
