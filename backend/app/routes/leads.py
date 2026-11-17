from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_roles
from app.models.lead import Lead
from app.models.user import User
from app.models.work_items import Notification
from app.schemas import LeadCreate, LeadUpdate

router = APIRouter(prefix="/leads", tags=["Lead Management"])

STAGES = ("New", "Contacted", "Interested", "Negotiation", "Converted", "Lost")


def team_ids(db: Session, current_user: User) -> list[int]:
    if current_user.role == "Admin":
        return [row[0] for row in db.query(User.id).all()]
    if current_user.role == "Manager":
        ids = [row[0] for row in db.query(User.id).filter(User.manager_id == current_user.id).all()]
        ids.append(current_user.id)
        return ids
    return [current_user.id]


def get_lead_query(db: Session, current_user: User):
    return db.query(Lead).filter(Lead.assigned_to.in_(team_ids(db, current_user)))


def serialize(lead: Lead) -> dict:
    return {
        "id": lead.id, "name": lead.name, "email": lead.email, "phone": lead.phone,
        "company": lead.company, "source": lead.source,
        "expected_deal_value": lead.expected_deal_value, "description": lead.description,
        "stage": lead.stage, "priority": lead.priority, "assigned_to": lead.assigned_to,
        "created_by": lead.created_by, "created_at": lead.created_at,
    }


@router.post("/")
def create_lead(data: LeadCreate, db: Session = Depends(get_db),
                current_user: User = Depends(require_roles("Admin", "Manager", "Employee"))):
    values = data.model_dump()
    values["email"] = str(data.email).lower()
    lead = Lead(**values, assigned_to=current_user.id, created_by=current_user.id)
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return {"message": "Lead created successfully", "lead": serialize(lead)}


@router.get("/")
def list_leads(
    stage: str | None = Query(default=None),
    priority: str | None = Query(default=None),
    search: str | None = Query(default=None, max_length=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Manager", "Employee")),
):
    query = get_lead_query(db, current_user)
    if stage:
        query = query.filter(Lead.stage == stage)
    if priority:
        query = query.filter(Lead.priority == priority)
    if search:
        term = f"%{search}%"
        query = query.filter((Lead.name.ilike(term)) | (Lead.email.ilike(term)) | (Lead.company.ilike(term)))
    leads = query.order_by(Lead.id.desc()).all()
    return {"total": len(leads), "stages": STAGES, "leads": [serialize(lead) for lead in leads]}


@router.get("/{lead_id}")
def get_lead(lead_id: int, db: Session = Depends(get_db),
             current_user: User = Depends(require_roles("Admin", "Manager", "Employee"))):
    lead = get_lead_query(db, current_user).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(404, "Lead not found or access denied")
    return serialize(lead)


@router.put("/{lead_id}")
def update_lead(lead_id: int, data: LeadUpdate, db: Session = Depends(get_db),
                current_user: User = Depends(require_roles("Admin", "Manager", "Employee"))):
    lead = get_lead_query(db, current_user).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(404, "Lead not found or access denied")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(lead, field, str(value).lower() if field == "email" else value)
    db.commit()
    db.refresh(lead)
    return {"message": "Lead updated successfully", "lead": serialize(lead)}


@router.put("/{lead_id}/assign")
def assign_lead(lead_id: int, employee_id: int = Query(..., gt=0),
                db: Session = Depends(get_db),
                current_user: User = Depends(require_roles("Admin", "Manager"))):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    employee = db.query(User).filter(User.id == employee_id, User.role == "Employee", User.is_active.is_(True)).first()
    if not lead or not employee:
        raise HTTPException(404, "Lead or active employee not found")
    if current_user.role == "Manager" and employee.manager_id != current_user.id:
        raise HTTPException(403, "You can assign leads only to your team")
    if current_user.role == "Manager" and lead.assigned_to not in team_ids(db, current_user):
        raise HTTPException(403, "You cannot assign a lead outside your team")
    lead.assigned_to = employee.id
    db.add(Notification(
        user_id=employee.id,
        kind="assignment",
        message=f"Lead assigned: {lead.name}"
    ))
    db.commit()
    return {"message": "Lead assigned successfully", "lead_id": lead.id, "assigned_to": employee.id}


@router.delete("/{lead_id}")
def delete_lead(lead_id: int, db: Session = Depends(get_db),
                current_user: User = Depends(require_roles("Admin", "Manager", "Employee"))):
    lead = get_lead_query(db, current_user).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(404, "Lead not found or access denied")
    db.delete(lead)
    db.commit()
    return {"message": "Lead deleted successfully", "lead_id": lead_id}
