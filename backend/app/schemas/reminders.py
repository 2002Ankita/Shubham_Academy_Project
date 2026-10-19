from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ReminderSettingsUpdate(BaseModel):
    enabled: Optional[bool] = None
    remind_days_before: Optional[int] = None
    remind_on_due_date: Optional[bool] = None
    remind_days_after: Optional[int] = None
    retry_limit: Optional[int] = None
    message_template: Optional[str] = None

class ReminderSettingsResponse(BaseModel):
    academy: str
    enabled: bool
    remind_days_before: int
    remind_on_due_date: bool
    remind_days_after: int
    retry_limit: int
    message_template: str

class ReminderHistoryResponse(BaseModel):
    id: str
    idempotency_key: str
    student_id: Optional[str] = ""
    amount_outstanding: float
    delivery_status: str
    scheduled_time: datetime
    provider_response: Optional[str]

class ManualReminderRequest(BaseModel):
    student_id: Optional[str] = None
    parent_mobile: Optional[str] = None
    channel: Optional[str] = "WhatsApp"
    custom_message: Optional[str] = None
