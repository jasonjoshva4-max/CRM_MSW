import os

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from sqlalchemy import inspect, text

from app.database import Base, engine
from app.models import User, Customer, Lead, FollowUp, Interaction, Task, Notification
from app.dependencies import get_current_user, require_roles

from app.routes.auth import router as auth_router
from app.routes.admin import router as admin_router
from app.routes.employees import router as employees_router
from app.routes.profile import router as profile_router
from app.routes.customers import router as customers_router
from app.routes.leads import router as leads_router
from app.routes.workspace import router as workspace_router


app = FastAPI(
    title="Multi-User CRM API",
    description="Backend API for our CRM application",
    version="1.0.0"
)


# Allow communication with Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create database tables
@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)
    # create_all does not add columns to an existing SQLite table.
    inspector = inspect(engine)
    lead_columns = {column["name"] for column in inspector.get_columns("leads")}
    customer_columns = {column["name"] for column in inspector.get_columns("customers")}
    with engine.begin() as connection:
        if "stage" not in lead_columns:
            connection.execute(text("ALTER TABLE leads ADD COLUMN stage VARCHAR(30) NOT NULL DEFAULT 'New'"))
        if "priority" not in lead_columns:
            connection.execute(text("ALTER TABLE leads ADD COLUMN priority VARCHAR(20) NOT NULL DEFAULT 'Medium'"))
        if "created_at" not in lead_columns:
            connection.execute(text("ALTER TABLE leads ADD COLUMN created_at DATETIME"))
        if "created_at" not in customer_columns:
            connection.execute(text("ALTER TABLE customers ADD COLUMN created_at DATETIME"))


# Serve uploaded profile pictures
app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)


# Register API routers
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(employees_router)
app.include_router(profile_router)
app.include_router(customers_router)
app.include_router(leads_router)
app.include_router(workspace_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to Multi-User CRM API!",
        "status": "Running"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/access/me")
def my_account(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role
    }


@app.get("/access/admin-only")
def admin_only(
    current_user: User = Depends(require_roles("Admin"))
):
    return {"message": "Welcome, Admin!"}


@app.get("/access/manager-only")
def manager_only(
    current_user: User = Depends(require_roles("Manager"))
):
    return {"message": "Welcome, Manager!"}


@app.get("/access/employee-only")
def employee_only(
    current_user: User = Depends(require_roles("Employee"))
):
    return {"message": "Welcome, Employee!"}
