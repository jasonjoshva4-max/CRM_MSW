
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas import EmployeeCreate, EmployeeUpdate, ManagerAssignment
from app.dependencies import require_roles
from app.routes.auth import hash_password

router = APIRouter(
    prefix="/admin/employees",
    tags=["Employee Management"]
)


# Create employee
@router.post("/")
def create_employee(
    data: EmployeeCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("Admin"))
):
    email = str(data.email).lower()

    existing = db.query(User).filter(User.email == email).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )

    employee = User(
        name=data.name,
        email=email,
        hashed_password=hash_password(data.password),
        phone=data.phone,
        role="Employee",
        is_active=True
    )

    db.add(employee)
    db.commit()
    db.refresh(employee)

    return {
        "message": "Employee created successfully",
        "employee_id": employee.id,
        "name": employee.name,
        "email": employee.email,
        "role": employee.role
    }


# List all employees
@router.get("/")
def list_employees(
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("Admin"))
):
    employees = db.query(User).filter(
        User.role == "Employee"
    ).all()

    return [
        {
            "id": employee.id,
            "name": employee.name,
            "email": employee.email,
            "phone": employee.phone,
            "is_active": employee.is_active,
            "manager_id": employee.manager_id
        }
        for employee in employees
    ]


@router.get("/managers")
def list_managers(
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("Admin"))
):
    return [
        {"id": manager.id, "name": manager.name, "email": manager.email}
        for manager in db.query(User).filter(
            User.role == "Manager",
            User.is_active.is_(True)
        ).order_by(User.name).all()
    ]


@router.put("/{employee_id}/manager")
def assign_manager(
    employee_id: int,
    data: ManagerAssignment,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("Admin"))
):
    employee = db.query(User).filter(
        User.id == employee_id,
        User.role == "Employee"
    ).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    manager = None
    if data.manager_id is not None:
        manager = db.query(User).filter(
            User.id == data.manager_id,
            User.role == "Manager",
            User.is_active.is_(True)
        ).first()
        if not manager:
            raise HTTPException(status_code=404, detail="Active manager not found")
        if manager.id == employee.id:
            raise HTTPException(status_code=422, detail="An employee cannot manage themselves")

    employee.manager_id = manager.id if manager else None
    db.commit()
    return {
        "message": "Manager assignment updated successfully",
        "employee_id": employee.id,
        "manager_id": employee.manager_id
    }


# Edit employee details
@router.put("/{employee_id}")
def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("Admin"))
):
    employee = db.query(User).filter(
        User.id == employee_id,
        User.role == "Employee"
    ).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    updates = data.model_dump(exclude_unset=True)

    if "email" in updates and updates["email"] is not None:
        email = str(updates["email"]).lower()

        existing = db.query(User).filter(
            User.email == email,
            User.id != employee_id
        ).first()

        if existing:
            raise HTTPException(
                status_code=409,
                detail="Email already registered"
            )

        updates["email"] = email

    for field, value in updates.items():
        setattr(employee, field, value)

    db.commit()
    db.refresh(employee)

    return {
        "message": "Employee updated successfully",
        "employee_id": employee.id
    }


# Activate employee
@router.patch("/{employee_id}/activate")
def activate_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("Admin"))
):
    employee = db.query(User).filter(
        User.id == employee_id,
        User.role == "Employee"
    ).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    employee.is_active = True
    db.commit()

    return {"message": "Employee activated successfully"}


# Deactivate employee
@router.patch("/{employee_id}/deactivate")
def deactivate_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("Admin"))
):
    employee = db.query(User).filter(
        User.id == employee_id,
        User.role == "Employee"
    ).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    employee.is_active = False
    db.commit()

    return {"message": "Employee deactivated successfully"}


# Delete employee
@router.delete("/{employee_id}")
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("Admin"))
):
    employee = db.query(User).filter(
        User.id == employee_id,
        User.role == "Employee"
    ).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    db.delete(employee)
    db.commit()

    return {"message": "Employee deleted successfully"}