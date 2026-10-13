from beanie import Document, Indexed, Link
from typing import Optional, Annotated
from datetime import datetime
from pydantic import EmailStr
from app.models.user import User

class Student(Document):
    user: Link[User]
    student_id: Annotated[str, Indexed(unique=True)]
    mobile_number: Annotated[str, Indexed(unique=True)]
    date_of_birth: datetime
    gender: str
    address: str
    parent_name: str
    parent_mobile: str
    standard: str = "12th Science"
    batch: str = "11th pcm tarabai park"
    branch: str = "Tarabai Park"
    academic_year: str
    rfid_tag: Optional[str] = None
    total_fees: float = 0.0
    fee_due_date: Optional[datetime] = None
    admission_date: datetime = datetime.utcnow()

    # Student Discount & Approval Details
    original_fees: float = 0.0
    discount_amount: float = 0.0
    discount_reason: Optional[str] = None
    discount_status: str = "NONE"  # "NONE", "PENDING", "APPROVED", "REJECTED"
    discount_offered_by: Optional[str] = None
    discount_recommended_by: Optional[str] = None
    discount_offered_at: Optional[datetime] = None
    discount_approved_by: Optional[str] = None
    discount_approved_at: Optional[datetime] = None
    discount_rejection_reason: Optional[str] = None

    class Settings:
        name = "students"
