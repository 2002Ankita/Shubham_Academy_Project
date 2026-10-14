from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Any

class StudentBase(BaseModel):
    student_id: Optional[str] = None
    full_name: Optional[str] = ""
    email: Optional[str] = None
    mobile_number: Optional[str] = ""
    parent_mobile: Optional[str] = ""
    total_fees: Optional[float] = 0.0
    paid_fees: Optional[float] = 0.0
    remaining_fees: Optional[float] = 0.0
    profile_completed: Optional[bool] = False
    date_of_birth: Optional[Any] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    parent_name: Optional[str] = None
    relation: Optional[str] = None
    parent_email: Optional[str] = None
    parent_occupation: Optional[str] = None
    standard: Optional[str] = None
    batch: Optional[str] = None
    branch: Optional[str] = "Kolhapur Main Branch"
    academic_year: Optional[str] = "2025-2026"
    previous_school: Optional[str] = None
    rfid_tag: Optional[str] = None
    admission_date: Optional[Any] = None
    avatar: Optional[str] = None

    class Config:
        extra = "allow"

class StudentCreate(StudentBase):
    password: Optional[str] = "password123"

class StudentAdminCreate(BaseModel):
    full_name: Optional[str] = None
    name: Optional[str] = None
    mobile_number: Optional[str] = None
    phone: Optional[str] = None
    parent_mobile: Optional[str] = None
    parentPhone: Optional[str] = None
    total_fees: Optional[float] = 0.0
    totalFees: Optional[float] = 0.0
    paid_fees: Optional[float] = 0.0
    paidFees: Optional[float] = 0.0
    remaining_fees: Optional[float] = None
    password: Optional[str] = "password123"
    email: Optional[str] = None
    batch: Optional[str] = None
    standard: Optional[str] = None
    admission_date: Optional[Any] = None
    rfid_tag: Optional[str] = None

    class Config:
        extra = "allow"

class StudentResponse(StudentBase):
    id: Optional[str] = None
    student_id: Optional[str] = None
    rfid_tag: Optional[str] = None
    admission_date: Optional[Any] = None

    class Config:
        extra = "allow"

