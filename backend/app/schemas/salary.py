from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class InstallmentResponse(BaseModel):
    amount: float
    date: str
    transactionRef: str

class SalaryPaymentResponse(BaseModel):
    id: str
    teacherId: str
    teacherName: str
    subject: str
    month: str
    baseSalary: float
    workingHours: float
    allowances: float
    deductions: float
    netPayable: float
    amountPaid: float
    amountPending: float
    status: str
    disbursedDate: str
    transactionRef: str
    installments: List[InstallmentResponse] = []

class SalaryUpdateRequest(BaseModel):
    baseSalary: float
    allowances: float
    deductions: float
    netPayable: float

class SalaryDisburseRequest(BaseModel):
    amount: Optional[float] = None
