from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class LeaveRequestCreate(BaseModel):
    teacher_id: str
    leave_type: str
    from_date: datetime
    to_date: datetime
    reason: Optional[str] = None

class LeaveRequestResponse(BaseModel):
    id: str
    teacher_id: str
    teacher_name: str
    leave_type: str
    from_date: datetime
    to_date: datetime
    number_of_days: int
    reason: Optional[str]
    status: str
    admin_comment: Optional[str]
    created_at: datetime
