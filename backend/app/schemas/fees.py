from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class FeePaymentCreate(BaseModel):
    student_id: str
    amount_paid: float
    payment_method: str
    transaction_reference: str
    remarks: str
    total_course_fees_override: Optional[float] = None

class FeePaymentResponse(FeePaymentCreate):
    id: str
    payment_date: datetime
    student_name: str
    roll_number: str
    total_fees: float
    pending_fees: float
    discount_amount: Optional[float] = 0.0
    discount_status: Optional[str] = "NONE"
    discount_approved_by: Optional[str] = None

class FeeDetailsResponse(BaseModel):
    student_id: str
    total_fees: float
    amount_paid: float
    pending_fees: float
    original_fees: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    discount_reason: Optional[str] = None
    discount_status: Optional[str] = "NONE"
    discount_offered_by: Optional[str] = None
    discount_approved_by: Optional[str] = None
    discount_approved_at: Optional[datetime] = None

class FeeStructureCreate(BaseModel):
    standard: str
    batch: str
    branch: str
    academic_year: str
    total_fee: float
    installment_amount: float
    number_of_installments: int
    due_date: datetime
    late_fee: float = 0.0

class FeeStructureResponse(FeeStructureCreate):
    id: str

class PendingFeeResponse(BaseModel):
    student_id: str
    student_name: str
    standard: str
    batch: str
    branch: str
    total_fees: float
    amount_paid: float
    pending_fees: float
