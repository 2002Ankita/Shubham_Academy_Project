from beanie import Document, Indexed, Link
from typing import Optional, Annotated, List
from datetime import datetime
from pydantic import EmailStr
from app.models.user import User
from app.models.admission import AdmissionRecord

class Student(Document):
    user: Link[User]
    student_id: Annotated[str, Indexed(unique=True)]
    full_name: Optional[str] = None
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
    academic_batch: Optional[str] = None
    session: Optional[str] = None
    branch: Optional[str] = "Tarabai Park"
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

    # Student Admission Details
    admission_type: Optional[str] = "11th Standard Only"  # "11th Standard Only", "12th Standard Only", "11th + 12th Standard (Two-Year Admission)"
    admissions: List[AdmissionRecord] = []

    # Student Discount & Concession Details
    original_fees: float = 0.0
    discount_amount: float = 0.0
    discount_requested_amount: float = 0.0
    discount_reason: Optional[str] = None
    discount_status: str = "NONE"  # "NONE", "PENDING", "APPROVED", "REJECTED"
    discount_offered_by: Optional[str] = None
    discount_recommended_by: Optional[str] = None
    discount_offered_at: Optional[datetime] = None
    discount_approved_by: Optional[str] = None
    discount_approved_at: Optional[datetime] = None
    discount_rejection_reason: Optional[str] = None
    concession_type: Optional[str] = "fixed"  # "fixed", "percentage", "custom"
    concession_value: Optional[float] = 0.0
    concession_approved_by: Optional[str] = None
    concession_approved_at: Optional[datetime] = None

    class Settings:
        name = "students"

