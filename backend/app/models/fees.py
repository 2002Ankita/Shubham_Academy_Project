from beanie import Document, Link
from datetime import datetime
from app.models.student import Student

class FeeStructure(Document):
    course: str
    batch: str
    academic_year: str
    total_fee: float
    installment_amount: float
    number_of_installments: int
    due_date: datetime
    late_fee: float = 0.0

    class Settings:
        name = "fee_structures"

class FeePayment(Document):
    student: Link[Student]
    amount_paid: float
    payment_date: datetime = datetime.utcnow()
    payment_method: str
    transaction_reference: str
    remarks: str

    class Settings:
        name = "fee_payments"
