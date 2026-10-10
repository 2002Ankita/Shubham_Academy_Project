from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import List, Optional

class TeacherBase(BaseModel):
    full_name: str
    email: EmailStr
    mobile_number: str = Field(..., pattern=r"^\d{10}$", json_schema_extra={"description": "10 digit mobile number"})
    subjects: List[str]
    assigned_batches: List[str]
    hourly_rate: float

class TeacherCreate(TeacherBase):
    password: str

class TeacherResponse(BaseModel):
    id: str
    employee_id: str
    full_name: str
    email: EmailStr
    mobile_number: Optional[str] = ""
    subjects: List[str] = []
    assigned_batches: List[str] = []
    hourly_rate: float = 0.0
    joining_date: datetime
    status: str

