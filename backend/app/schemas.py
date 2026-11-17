

from decimal import Decimal

from datetime import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr, Field


# Authentication
class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: str = Field(min_length=7, max_length=20)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Employee Management
class EmployeeCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: str = Field(min_length=7, max_length=20)


class EmployeeUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, min_length=7, max_length=20)


class ManagerAssignment(BaseModel):
    manager_id: int | None = Field(default=None, gt=0)


# User Profile
class ProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    phone: str | None = Field(default=None, min_length=7, max_length=20)


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


# Customer Management
class CustomerCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=20)
    company: str | None = None
    address: str | None = None
    description: str | None = None


class CustomerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, min_length=7, max_length=20)
    company: str | None = None
    address: str | None = None
    description: str | None = None


# Lead Management
class LeadCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=20)
    company: str | None = None
    source: str = Field(min_length=2, max_length=100)
    expected_deal_value: Decimal = Field(ge=0)
    description: str | None = None
    stage: Literal["New", "Contacted", "Interested", "Negotiation", "Converted", "Lost"] = "New"
    priority: Literal["Low", "Medium", "High"] = "Medium"


class LeadUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, min_length=7, max_length=20)
    company: str | None = None
    source: str | None = Field(default=None, min_length=2, max_length=100)
    expected_deal_value: Decimal | None = Field(default=None, ge=0)
    description: str | None = None
    stage: Literal["New", "Contacted", "Interested", "Negotiation", "Converted", "Lost"] | None = None
    priority: Literal["Low", "Medium", "High"] | None = None


class FollowUpCreate(BaseModel):
    lead_id: int | None = Field(default=None, gt=0)
    customer_id: int | None = Field(default=None, gt=0)
    assigned_to: int | None = Field(default=None, gt=0)
    scheduled_at: datetime
    notes: str | None = Field(default=None, max_length=2000)


class FollowUpUpdate(BaseModel):
    scheduled_at: datetime | None = None
    status: Literal["Pending", "Completed", "Cancelled"] | None = None
    notes: str | None = Field(default=None, max_length=2000)


class InteractionCreate(BaseModel):
    lead_id: int | None = Field(default=None, gt=0)
    customer_id: int | None = Field(default=None, gt=0)
    interaction_type: Literal["Call", "Email", "Meeting", "Note"]
    occurred_at: datetime | None = None
    notes: str = Field(min_length=1, max_length=4000)


class TaskCreate(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    description: str | None = Field(default=None, max_length=4000)
    assigned_to: int | None = Field(default=None, gt=0)
    due_at: datetime
    priority: Literal["Low", "Medium", "High"] = "Medium"
    lead_id: int | None = Field(default=None, gt=0)
    customer_id: int | None = Field(default=None, gt=0)


class TaskUpdate(BaseModel):
    status: Literal["Pending", "In Progress", "Completed", "Cancelled"] | None = None
    due_at: datetime | None = None
    priority: Literal["Low", "Medium", "High"] | None = None
