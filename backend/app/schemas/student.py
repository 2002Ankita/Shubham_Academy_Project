from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List

class StudentBase(BaseModel):
    student_id: Optional[str] = None
    full_name: str
    email: Optional[EmailStr] = None
    mobile_number: str = Field(..., pattern=r"^\d{10}$", json_schema_extra={"description": "10 digit mobile number"})
    date_of_birth: datetime
    gender: str
    address: str
    parent_name: str
    parent_mobile: str = Field(..., pattern=r"^\d{10}$", json_schema_extra={"description": "10 digit mobile number"})
    standard: str
    batch: str
    branch: str
    academic_year: str
    rfid_tag: Optional[str] = None
    total_fees: float = 0.0
    admission_date: Optional[datetime] = None
    original_fees: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    discount_reason: Optional[str] = None
    discount_status: Optional[str] = "NONE"
    discount_offered_by: Optional[str] = None
    discount_recommended_by: Optional[str] = None
    discount_offered_at: Optional[datetime] = None
    discount_approved_by: Optional[str] = None
    discount_approved_at: Optional[datetime] = None
    discount_rejection_reason: Optional[str] = None

class StudentCreate(StudentBase):
    password: str
    superadmin_auth_code: Optional[str] = None

class StudentResponse(StudentBase):
    id: str
    student_id: str
    rfid_tag: Optional[str] = None
    admission_date: datetime

class DiscountOfferRequest(BaseModel):
    discount_amount: float
    discount_reason: str
    original_fees: Optional[float] = None
    recommended_by: Optional[str] = None

class DiscountRejectRequest(BaseModel):
    reason: Optional[str] = "Rejected by Superadmin"

class DiscountApprovalResponse(BaseModel):
    id: str
    student_id: str
    student_name: str
    roll_number: str
    standard: str
    original_fees: float
    discount_amount: float
    final_fees: float
    discount_reason: str
    status: str
    offered_by: str
    recommended_by: Optional[str] = None
    offered_by_email: Optional[str] = None
    offered_at: datetime
    approved_by: Optional[str] = None
    approved_by_email: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
