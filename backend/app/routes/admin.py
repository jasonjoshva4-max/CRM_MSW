from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.customer import Customer
from app.models.lead import Lead
from app.models.work_items import FollowUp, Task
from app.dependencies import require_roles

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])


@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin"))
):
    total_employees = db.query(User).filter(
        User.role == "Employee"
    ).count()

    return {
        "total_employees": total_employees,
        "total_customers": db.query(Customer).count(),
        "total_leads": db.query(Lead).count(),
        "pending_followups": db.query(FollowUp).filter(FollowUp.status == "Pending").count(),
        "pending_tasks": db.query(Task).filter(Task.status.in_(["Pending", "In Progress"])).count(),
        "converted_leads": db.query(Lead).filter(Lead.stage == "Converted").count(),
        "lost_leads": db.query(Lead).filter(Lead.stage == "Lost").count(),
    }