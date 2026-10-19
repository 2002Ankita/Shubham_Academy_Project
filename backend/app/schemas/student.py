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
    original_fees: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    discount_requested_amount: Optional[float] = 0.0
    discount_reason: Optional[str] = None
    discount_status: Optional[str] = "NONE"
    discount_offered_by: Optional[str] = None
    discount_recommended_by: Optional[str] = None
    discount_offered_at: Optional[Any] = None
    discount_approved_by: Optional[str] = None
    discount_approved_at: Optional[Any] = None
    discount_rejection_reason: Optional[str] = None

    class Config:
        extra = "allow"

class StudentCreate(StudentBase):
    password: Optional[str] = None
    superadmin_auth_code: Optional[str] = None

class StudentAdminCreate(BaseModel):
    full_name: Optional[str] = None
    fullName: Optional[str] = None
    name: Optional[str] = None
    mobile_number: Optional[str] = None
    mobileNumber: Optional[str] = None
    phone: Optional[str] = None
    parent_mobile: Optional[str] = None
    parentMobile: Optional[str] = None
    parentPhone: Optional[str] = None
    total_fees: Optional[float] = 0.0
    totalFees: Optional[float] = 0.0
    paid_fees: Optional[float] = 0.0
    paidFees: Optional[float] = 0.0
    remaining_fees: Optional[float] = None
    password: Optional[str] = None
    email: Optional[str] = None
    batch: Optional[str] = None
    standard: Optional[str] = None
    admission_date: Optional[Any] = None
    rfid_tag: Optional[str] = None
    superadmin_auth_code: Optional[str] = None
    original_fees: Optional[float] = None
    originalFees: Optional[float] = None
    discount_amount: Optional[float] = None
    discountAmount: Optional[float] = None
    discount_reason: Optional[str] = None
    discountReason: Optional[str] = None
    discount_requested_amount: Optional[float] = None
    discountRequestedAmount: Optional[float] = None
    discount_recommended_by: Optional[str] = None
    discountRecommendedBy: Optional[str] = None
    discount_offered_by: Optional[str] = None
    discountOfferedBy: Optional[str] = None

    class Config:
        extra = "allow"

class StudentResponse(StudentBase):
    id: Optional[str] = None
    student_id: Optional[str] = None
    rfid_tag: Optional[str] = None
    admission_date: Optional[Any] = None

    class Config:
        extra = "allow"

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
    offered_at: Optional[Any] = None
    approved_by: Optional[str] = None
    approved_by_email: Optional[str] = None
    approved_at: Optional[Any] = None
    rejection_reason: Optional[str] = None
