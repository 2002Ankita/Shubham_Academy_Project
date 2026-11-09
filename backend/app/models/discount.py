from beanie import Document
from datetime import datetime
from typing import Optional, List, Any

class DiscountApproval(Document):
    student_id: str
    student_name: str
    roll_number: str
    admission_type: Optional[str] = "11th Standard Only"
    standard: Optional[str] = "General"
    batch: Optional[str] = None
    branch: Optional[str] = None
    original_fees: float = 0.0
    discount_amount: float = 0.0
    discount_requested_amount: float = 0.0
    final_fees: float = 0.0
    concession_type: Optional[str] = "fixed"  # "fixed", "percentage", "custom"
    concession_value: Optional[float] = 0.0
    year_wise_breakdown: Optional[List[Any]] = None
    discount_reason: Optional[str] = "Fee Concession"
    status: str = "PENDING"  # "PENDING", "APPROVED", "REJECTED"
    offered_by: Optional[str] = "Admin"
    recommended_by: Optional[str] = None
    offered_by_email: Optional[str] = None
    offered_at: datetime = datetime.utcnow()
    approved_by: Optional[str] = None
    approved_by_email: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None

    class Settings:
        name = "discount_approvals"
