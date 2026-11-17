from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_roles
from app.models.customer import Customer
from app.models.lead import Lead
from app.models.user import User
from app.models.work_items import FollowUp, Interaction, Notification, Task
from app.routes.leads import team_ids
from app.schemas import FollowUpCreate, FollowUpUpdate, InteractionCreate, TaskCreate, TaskUpdate

router = APIRouter(tags=["CRM Workspace"])
ROLES = ("Admin", "Manager", "Employee")


def accessible_ids(db: Session, user: User) -> list[int]:
    return team_ids(db, user)


def scoped_query(db: Session, model, user: User):
    query = db.query(model)
    if user.role != "Admin":
        query = query.filter(model.assigned_to.in_(accessible_ids(db, user)))
    return query


def assert_target(db: Session, user: User, lead_id: int | None, customer_id: int | None):
    if bool(lead_id) == bool(customer_id):
        raise HTTPException(422, "Provide exactly one lead_id or customer_id")
    if lead_id and not scoped_query(db, Lead, user).filter(Lead.id == lead_id).first():
        raise HTTPException(404, "Lead not found or access denied")
    if customer_id and not scoped_query(db, Customer, user).filter(Customer.id == customer_id).first():
        raise HTTPException(404, "Customer not found or access denied")


def work_item_query(db: Session, model, user: User):
    return scoped_query(db, model, user)


@router.post("/follow-ups")
def create_follow_up(data: FollowUpCreate, db: Session = Depends(get_db),
                     user: User = Depends(require_roles(*ROLES))):
    assert_target(db, user, data.lead_id, data.customer_id)
    assigned_to = data.assigned_to or user.id
    if assigned_to not in accessible_ids(db, user):
        raise HTTPException(403, "You can schedule follow-ups only for your team")
    item = FollowUp(**data.model_dump(exclude={"assigned_to"}), assigned_to=assigned_to)
    db.add(item)
    db.commit()
    db.refresh(item)
    db.add(Notification(user_id=assigned_to, kind="follow-up", message=f"Follow-up scheduled for {item.scheduled_at:%Y-%m-%d %H:%M}"))
    db.commit()
    return {"id": item.id, "scheduled_at": item.scheduled_at, "status": item.status}


@router.get("/follow-ups")
def list_follow_ups(date: datetime | None = Query(default=None), db: Session = Depends(get_db),
                    user: User = Depends(require_roles(*ROLES))):
    query = work_item_query(db, FollowUp, user)
    if date:
        query = query.filter(FollowUp.scheduled_at >= date, FollowUp.scheduled_at < date + timedelta(days=1))
    items = query.order_by(FollowUp.scheduled_at).all()
    return {"follow_ups": [{"id": x.id, "lead_id": x.lead_id, "customer_id": x.customer_id, "assigned_to": x.assigned_to,
                            "scheduled_at": x.scheduled_at, "status": x.status, "notes": x.notes} for x in items]}


@router.patch("/follow-ups/{item_id}")
def update_follow_up(item_id: int, data: FollowUpUpdate, db: Session = Depends(get_db),
                     user: User = Depends(require_roles(*ROLES))):
    item = work_item_query(db, FollowUp, user).filter(FollowUp.id == item_id).first()
    if not item:
        raise HTTPException(404, "Follow-up not found or access denied")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    return {"message": "Follow-up updated successfully"}


@router.post("/interactions")
def create_interaction(data: InteractionCreate, db: Session = Depends(get_db),
                       user: User = Depends(require_roles(*ROLES))):
    assert_target(db, user, data.lead_id, data.customer_id)
    item = Interaction(**data.model_dump(exclude={"occurred_at"}), created_by=user.id,
                       occurred_at=data.occurred_at or datetime.utcnow())
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": item.id, "interaction_type": item.interaction_type, "occurred_at": item.occurred_at}


@router.get("/interactions")
def list_interactions(lead_id: int | None = None, customer_id: int | None = None,
                      db: Session = Depends(get_db), user: User = Depends(require_roles(*ROLES))):
    query = db.query(Interaction).filter(Interaction.created_by.in_(accessible_ids(db, user)))
    if lead_id:
        query = query.filter(Interaction.lead_id == lead_id)
    if customer_id:
        query = query.filter(Interaction.customer_id == customer_id)
    return {"interactions": [{"id": x.id, "lead_id": x.lead_id, "customer_id": x.customer_id,
                              "interaction_type": x.interaction_type, "occurred_at": x.occurred_at,
                              "notes": x.notes, "created_by": x.created_by} for x in query.order_by(Interaction.occurred_at.desc()).all()]}


@router.post("/tasks")
def create_task(data: TaskCreate, db: Session = Depends(get_db),
                user: User = Depends(require_roles(*ROLES))):
    assert_target(db, user, data.lead_id, data.customer_id) if data.lead_id or data.customer_id else None
    assigned_to = data.assigned_to or user.id
    if assigned_to not in accessible_ids(db, user):
        raise HTTPException(403, "You can create tasks only for your team")
    item = Task(**data.model_dump(exclude={"assigned_to"}), assigned_to=assigned_to, created_by=user.id)
    db.add(item)
    db.commit()
    db.refresh(item)
    db.add(Notification(user_id=assigned_to, kind="task", message=f"Task deadline: {item.title}"))
    db.commit()
    return {"id": item.id, "title": item.title, "status": item.status, "due_at": item.due_at}


@router.get("/tasks")
def list_tasks(status: str | None = None, db: Session = Depends(get_db),
               user: User = Depends(require_roles(*ROLES))):
    query = work_item_query(db, Task, user)
    if status:
        query = query.filter(Task.status == status)
    return {"tasks": [{"id": x.id, "title": x.title, "description": x.description, "assigned_to": x.assigned_to,
                       "due_at": x.due_at, "status": x.status, "priority": x.priority,
                       "lead_id": x.lead_id, "customer_id": x.customer_id} for x in query.order_by(Task.due_at).all()]}


@router.patch("/tasks/{task_id}")
def update_task(task_id: int, data: TaskUpdate, db: Session = Depends(get_db),
                user: User = Depends(require_roles(*ROLES))):
    item = work_item_query(db, Task, user).filter(Task.id == task_id).first()
    if not item:
        raise HTTPException(404, "Task not found or access denied")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    return {"message": "Task updated successfully"}


@router.get("/notifications")
def list_notifications(db: Session = Depends(get_db), user: User = Depends(require_roles(*ROLES))):
    items = db.query(Notification).filter(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(50).all()
    return {"notifications": [{"id": x.id, "message": x.message, "kind": x.kind, "read": x.read_at is not None, "created_at": x.created_at} for x in items]}


@router.patch("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db),
                           user: User = Depends(require_roles(*ROLES))):
    item = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user.id).first()
    if not item:
        raise HTTPException(404, "Notification not found")
    item.read_at = datetime.utcnow()
    db.commit()
    return {"message": "Notification marked as read"}


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), user: User = Depends(require_roles(*ROLES))):
    lead_query = scoped_query(db, Lead, user)
    task_query = scoped_query(db, Task, user)
    follow_up_query = scoped_query(db, FollowUp, user)
    customer_query = scoped_query(db, Customer, user)
    active_leads = lead_query.filter(Lead.stage.notin_(["Converted", "Lost"])).count()
    completed_tasks = task_query.filter(Task.status == "Completed").count()
    upcoming = follow_up_query.filter(FollowUp.status == "Pending", FollowUp.scheduled_at >= datetime.utcnow()).count()
    pending_tasks = task_query.filter(Task.status.in_(["Pending", "In Progress"])).count()
    conversions = lead_query.filter(Lead.stage == "Converted").count()
    return {"role": user.role, "assigned_customers": customer_query.count(),
            "active_leads": active_leads, "completed_tasks": completed_tasks, "upcoming_followups": upcoming,
            "pending_tasks": pending_tasks, "lead_conversions": conversions}


@router.get("/reports")
def reports(db: Session = Depends(get_db), user: User = Depends(require_roles(*ROLES))):
    ids = accessible_ids(db, user)
    lead_query = scoped_query(db, Lead, user)
    employees = db.query(User).filter(User.id.in_(ids), User.role != "Admin").all()
    customer_query = scoped_query(db, Customer, user)
    return {"total_leads": lead_query.count(),
            "lead_conversions": lead_query.filter(Lead.stage == "Converted").count(),
            "lost_leads": lead_query.filter(Lead.stage == "Lost").count(),
            "customer_growth": customer_query.count(),
            "employee_performance": [{"employee_id": e.id, "name": e.name,
                                      "leads": lead_query.filter(Lead.assigned_to == e.id).count(),
                                      "conversions": lead_query.filter(Lead.assigned_to == e.id, Lead.stage == "Converted").count(),
                                      "completed_tasks": scoped_query(db, Task, user).filter(Task.assigned_to == e.id, Task.status == "Completed").count()} for e in employees]}


@router.get("/search")
def global_search(
    q: str = Query(..., min_length=1, max_length=100),
    employee_id: int | None = Query(default=None, gt=0),
    stage: str | None = Query(default=None),
    priority: str | None = Query(default=None),
    date: datetime | None = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ROLES))
):
    term = f"%{q}%"
    if employee_id is not None:
        if user.role == "Employee" and employee_id != user.id:
            raise HTTPException(403, "Employees can search only their own records")
        if employee_id not in accessible_ids(db, user):
            raise HTTPException(403, "You can search only your team")
    customer_query = scoped_query(db, Customer, user)
    lead_query = scoped_query(db, Lead, user)
    if employee_id is not None:
        customer_query = customer_query.filter(Customer.assigned_to == employee_id)
        lead_query = lead_query.filter(Lead.assigned_to == employee_id)
    if stage:
        lead_query = lead_query.filter(Lead.stage == stage)
    if priority:
        lead_query = lead_query.filter(Lead.priority == priority)
    if date:
        customer_query = customer_query.filter(
            Customer.created_at >= date,
            Customer.created_at < date + timedelta(days=1)
        )
        lead_query = lead_query.filter(
            Lead.created_at >= date,
            Lead.created_at < date + timedelta(days=1)
        )
    customers = customer_query.filter(
        or_(Customer.name.ilike(term), Customer.email.ilike(term), Customer.company.ilike(term))).limit(20).all()
    leads = lead_query.filter(
        or_(Lead.name.ilike(term), Lead.email.ilike(term), Lead.company.ilike(term))).limit(20).all()
    return {"customers": [{"id": x.id, "name": x.name, "email": x.email} for x in customers],
            "leads": [{"id": x.id, "name": x.name, "email": x.email, "stage": x.stage} for x in leads]}
