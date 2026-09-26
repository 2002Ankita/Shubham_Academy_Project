from pydantic import BaseModel
from datetime import datetime

class SalaryPaymentResponse(BaseModel):
    id: str
    teacher_id: str
    month: int
    year: int
    total_hours: float
    hourly_rate: float
    amount_paid: float
    payment_date: datetime
    remarks: str
