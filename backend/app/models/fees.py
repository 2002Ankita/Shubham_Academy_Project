from beanie import Document, Link
from datetime import datetime
from app.models.student import Student

class FeeStructure(Document):
    standard: str
    batch: str
    branch: str
    academic_year: str
    total_fee: float
    installment_amount: float
    number_of_installments: int
    due_date: datetime
    late_fee: float = 0.0

    class Settings:
        name = "fee_structures"

from pydantic import Field
from typing import Optional

class FeePayment(Document):
    student: Link[Student]
    amount_paid: float
    payment_date: datetime = Field(default_factory=datetime.utcnow)
    payment_method: str
    transaction_reference: str
    remarks: str

    class Settings:
        name = "fee_payments"

class BranchUpiScanner(Document):
    branch: str # e.g. "Tarabai Park", "Mangalvar Peth"
    upi_id: str
    account_name: str
    bank_name: Optional[str] = "HDFC Bank"
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    qr_image_url: Optional[str] = None
    instructions: Optional[str] = "Scan and pay using any UPI app (GPay, PhonePe, Paytm, BHIM). Enter UTR ref to complete payment."
    is_active: bool = True
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: Optional[str] = None

    class Settings:
        name = "branch_upi_scanners"

class OfflineFeeRequest(Document):
    student_id: str
    student_name: str
    roll_number: str
    branch: str
    batch: Optional[str] = None
    standard: Optional[str] = None
    amount: float
    payment_mode: str # "Cash" or "Cheque"
    cheque_number: Optional[str] = None
    bank_name: Optional[str] = None
    cheque_date: Optional[str] = None
    depositor_name: Optional[str] = None
    notes: Optional[str] = None
    status: str = "PENDING" # "PENDING", "APPROVED", "REJECTED"
    receipt_no: Optional[str] = None
    admin_remarks: Optional[str] = None
    collected_by_faculty: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None

    class Settings:
        name = "offline_fee_requests"

