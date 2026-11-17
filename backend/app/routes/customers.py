


from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.customer import Customer
from app.models.user import User
from app.models.work_items import Notification
from app.schemas import CustomerCreate, CustomerUpdate
from app.dependencies import require_roles


router = APIRouter(
    prefix="/customers",
    tags=["Customer Management"]
)


# Get customers accessible to the current user
def get_customer_query(db: Session, current_user: User):
    query = db.query(Customer)

    if current_user.role == "Admin":
        return query

    elif current_user.role == "Manager":
        team_members = db.query(User.id).filter(
            User.manager_id == current_user.id,
            User.role == "Employee"
        ).all()

        team_ids = [member.id for member in team_members]
        team_ids.append(current_user.id)

        return query.filter(Customer.assigned_to.in_(team_ids))

    elif current_user.role == "Employee":
        return query.filter(
            Customer.assigned_to == current_user.id
        )

    return query.filter(Customer.id == -1)


# Add a new customer
@router.post("/")
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Manager", "Employee")
    )
):
    customer = Customer(
        name=data.name,
        email=str(data.email).lower(),
        phone=data.phone,
        company=data.company,
        address=data.address,
        description=data.description,
        created_by=current_user.id,
        assigned_to=current_user.id
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return {
        "message": "Customer created successfully",
        "customer_id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "created_by": current_user.id
    }


# List customers with pagination
@router.get("/")
def list_customers(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Manager", "Employee")
    )
):
    query = get_customer_query(db, current_user)

    total = query.count()

    customers = query.order_by(
        Customer.id.desc()
    ).offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "customers": [
            {
                "id": customer.id,
                "name": customer.name,
                "email": customer.email,
                "phone": customer.phone,
                "company": customer.company,
                "address": customer.address,
                "description": customer.description,
                "assigned_to": customer.assigned_to,
                "created_by": customer.created_by
            }
            for customer in customers
        ]
    }


# Get an individual customer profile
@router.get("/{customer_id}")
def get_customer_profile(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Manager", "Employee")
    )
):
    customer = get_customer_query(
        db, current_user
    ).filter(Customer.id == customer_id).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found or access denied"
        )

    return {
        "id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
        "company": customer.company,
        "address": customer.address,
        "description": customer.description,
        "assigned_to": customer.assigned_to,
        "created_by": customer.created_by
    }


# Update customer details
@router.put("/{customer_id}")
def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Manager", "Employee")
    )
):
    customer = get_customer_query(
        db, current_user
    ).filter(Customer.id == customer_id).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found or access denied"
        )

    update_data = data.dict(exclude_unset=True)

    if update_data.get("email") is not None:
        update_data["email"] = str(update_data["email"]).lower()

    for field, value in update_data.items():
        setattr(customer, field, value)

    db.commit()
    db.refresh(customer)

    return {
        "message": "Customer updated successfully",
        "customer_id": customer.id,
        "name": customer.name,
        "email": customer.email
    }


# Delete a customer
@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Manager", "Employee")
    )
):
    customer = get_customer_query(
        db, current_user
    ).filter(Customer.id == customer_id).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found or access denied"
        )

    db.delete(customer)
    db.commit()

    return {
        "message": "Customer deleted successfully",
        "customer_id": customer_id
    }


# Assign a customer to an employee
@router.put("/{customer_id}/assign")
def assign_customer(
    customer_id: int,
    employee_id: int = Query(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Manager")
    )
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    employee = db.query(User).filter(
        User.id == employee_id,
        User.role == "Employee",
        User.is_active == True
    ).first()

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Active employee not found"
        )

    # Managers can assign customers only to their own team
    if current_user.role == "Manager":
        if employee.manager_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can assign customers only to employees in your team"
            )

        # Managers can assign only customers they created
        # or customers already assigned to their team
        team_ids = db.query(User.id).filter(
            User.manager_id == current_user.id,
            User.role == "Employee"
        ).all()

        team_ids = [member.id for member in team_ids]
        team_ids.append(current_user.id)

        if (
            customer.created_by != current_user.id
            and customer.assigned_to not in team_ids
        ):
            raise HTTPException(
                status_code=403,
                detail="You cannot assign this customer"
            )

    customer.assigned_to = employee.id
    db.add(Notification(
        user_id=employee.id,
        kind="assignment",
        message=f"Customer assigned: {customer.name}"
    ))

    db.commit()
    db.refresh(customer)

    return {
        "message": "Customer assigned successfully",
        "customer_id": customer.id,
        "customer_name": customer.name,
        "assigned_employee_id": employee.id,
        "assigned_employee_name": employee.name
    }
