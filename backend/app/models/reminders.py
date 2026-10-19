from beanie import Document, Indexed, Link
from datetime import datetime
from typing import Optional, Annotated
from app.models.student import Student

class ReminderSettings(Document):
    academy: Annotated[str, Indexed(unique=True)] = "Default"
    enabled: bool = True
    remind_days_before: int = 3
    remind_on_due_date: bool = True
    remind_days_after: int = 1
    retry_limit: int = 3
    message_template: str = "Dear {parent_name}, a fee amount of Rs {pending_fees} is due on {due_date} for {student_id}. Please ignore if already paid."

    class Settings:
        name = "reminder_settings"

class ReminderHistory(Document):
    idempotency_key: Annotated[str, Indexed(unique=True)]
    academy: str
    student: Optional[Link[Student]] = None
    fee_installment_ref: Optional[str] = None
    scheduled_time: datetime
    amount_outstanding: float
    delivery_status: str = "Queued" # Queued, Sent, Delivered, Failed, Skipped
    provider_response: Optional[str] = None
    retry_count: int = 0
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    class Settings:
        name = "reminder_history"
