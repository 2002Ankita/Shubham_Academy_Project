from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional

class TeacherCreate(BaseModel):
    full_name: str
    email: EmailStr
    mobile_number: str
    subjects: List[str]
    assigned_batches: List[str]
    hourly_rate: float

class TeacherResponse(TeacherCreate):
    id: str
    employee_id: str
    joining_date: datetime
    status: str
