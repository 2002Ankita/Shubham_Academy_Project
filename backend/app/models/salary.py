from beanie import Document, Link
from datetime import datetime
from app.models.teacher import Teacher
from typing import Optional

class SalaryPayment(Document):
    teacher: Link[Teacher]
    month_name: str
    base_salary: float
    allowances: float = 0.0
    deductions: float = 0.0
    net_payable: float = 0.0
    status: str = "Processing"
    transaction_ref: str = "--"
    disbursed_date: Optional[datetime] = None

    class Settings:
        name = "salary_payments"
