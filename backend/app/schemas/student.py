from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List

class StudentBase(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    mobile_number: str = Field(..., pattern=r"^\d{10}$", json_schema_extra={"description": "10 digit mobile number"})
    date_of_birth: datetime
    gender: str
    address: str
    parent_name: str
    parent_mobile: str = Field(..., pattern=r"^\d{10}$", json_schema_extra={"description": "10 digit mobile number"})
    standard: str
    batch: str
    branch: str
    academic_year: str
    total_fees: float = 0.0

class StudentCreate(StudentBase):
    password: str

class StudentResponse(StudentBase):
    id: str
    student_id: str
    rfid_tag: Optional[str] = None
    admission_date: datetime
