from beanie import Document, Indexed, Link
from typing import Optional, Annotated
from datetime import datetime
from pydantic import EmailStr
from app.models.user import User

class Student(Document):
    user: Link[User]
    student_id: Annotated[str, Indexed(unique=True)]
    mobile_number: Annotated[str, Indexed(unique=True)]
    parent_mobile: Optional[str] = None
    email: Optional[str] = None
    date_of_birth: Optional[datetime] = None
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
    total_fees: float = 0.0
    paid_fees: float = 0.0
    remaining_fees: float = 0.0
    profile_completed: bool = False
    avatar: Optional[str] = None
    fee_due_date: Optional[datetime] = None
    admission_date: datetime = datetime.utcnow()

    class Settings:
        name = "students"

