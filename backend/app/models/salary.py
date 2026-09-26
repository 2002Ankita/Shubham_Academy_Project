from beanie import Document, Link
from datetime import datetime
from app.models.teacher import Teacher

class SalaryPayment(Document):
    teacher: Link[Teacher]
    month: int
    year: int
    total_hours: float
    hourly_rate: float
    amount_paid: float
    payment_date: datetime = datetime.utcnow()
    remarks: str = ""

    class Settings:
        name = "salary_payments"
