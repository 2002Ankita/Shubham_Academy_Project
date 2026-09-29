from pydantic import BaseModel
from datetime import datetime

class FeePaymentCreate(BaseModel):
    student_id: str
    amount_paid: float
    payment_method: str
    transaction_reference: str
    remarks: str

class FeePaymentResponse(FeePaymentCreate):
    id: str
    payment_date: datetime

class FeeDetailsResponse(BaseModel):
    student_id: str
    total_fees: float
    amount_paid: float
    pending_fees: float

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
