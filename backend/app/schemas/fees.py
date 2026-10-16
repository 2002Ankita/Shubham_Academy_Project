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
    original_fees: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    discount_status: Optional[str] = "NONE"
    discount_approved_by: Optional[str] = None
    cumulative_paid: Optional[float] = None
    current_pending_fees: Optional[float] = None

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

class FeeStructureUpdate(BaseModel):
    standard: Optional[str] = None
    batch: Optional[str] = None
    branch: Optional[str] = None
    academic_year: Optional[str] = None
    total_fee: Optional[float] = None
    installment_amount: Optional[float] = None
    number_of_installments: Optional[int] = None
    due_date: Optional[datetime] = None
    late_fee: Optional[float] = None

class PendingFeeResponse(BaseModel):
    student_id: str
    student_name: str
    standard: str
    batch: str
    branch: str
    total_fees: float
    amount_paid: float
    pending_fees: float
