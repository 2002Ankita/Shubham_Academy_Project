from beanie import Document, Link
from datetime import datetime
from app.models.teacher import Teacher
from typing import Optional, List
from pydantic import BaseModel

class Installment(BaseModel):
    amount: float
    date: datetime
    transaction_ref: str

class SalaryPayment(Document):
    teacher: Link[Teacher]
    month_name: str
    base_salary: float
    allowances: float = 0.0
    deductions: float = 0.0
    net_payable: float = 0.0
    amount_paid: float = 0.0
    amount_pending: float = 0.0
    working_hours: float = 0.0
    status: str = "Processing"
    transaction_ref: str = "--"
    disbursed_date: Optional[datetime] = None
    installments: List[Installment] = []

    class Settings:
        name = "salary_payments"
