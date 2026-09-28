from pydantic import BaseModel
from datetime import datetime

class SalaryPaymentResponse(BaseModel):
    id: str
    teacherId: str
    teacherName: str
    subject: str
    month: str
    baseSalary: float
    allowances: float
    deductions: float
    netPayable: float
    status: str
    disbursedDate: str
    transactionRef: str

class SalaryUpdateRequest(BaseModel):
    allowances: float
    deductions: float
