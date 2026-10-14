from beanie import Document
from datetime import datetime
from typing import Optional

class DiscountApproval(Document):
    student_id: str
    student_name: str
    roll_number: str
    standard: str
    original_fees: float
    discount_amount: float
    discount_requested_amount: float = 0.0
    final_fees: float
    discount_reason: str
    status: str = "PENDING"  # "PENDING", "APPROVED", "REJECTED"
    offered_by: str
    recommended_by: Optional[str] = None
    offered_by_email: Optional[str] = None
    offered_at: datetime = datetime.utcnow()
    approved_by: Optional[str] = None
    approved_by_email: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None

    class Settings:
        name = "discount_approvals"
