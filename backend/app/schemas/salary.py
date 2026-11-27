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
    recovery: float = 0.0
    yearlySalary: float = 0.0
    accountType: str = "Academy"
    paymentMode: str = "NEFT"
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
    recovery: Optional[float] = None
    yearlySalary: Optional[float] = None
    accountType: Optional[str] = None
    paymentMode: Optional[str] = None
    workingHours: Optional[float] = None

class SalaryDisburseRequest(BaseModel):
    amount: Optional[float] = None
    paymentMode: Optional[str] = "NEFT"
    accountType: Optional[str] = None
