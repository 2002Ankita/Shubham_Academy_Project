from beanie import Document, Link
from datetime import datetime
from typing import Optional
from app.models.student import Student
from app.models.user import User

class InventoryItem(Document):
    title: str
    category: Optional[str] = "Theory"  # "Theory" | "CET"
    subject: Optional[str] = "Physics"  # "Physics" | "Chemistry" | "Biology" | "Maths"
    standard: str = "11th & 12th Science"
    in_stock: int = 50
    total_stock: Optional[int] = None
    reorder_level: int = 15
    unit_cost: float = 350.0
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "inventory_items"

class InventoryDelivery(Document):
    student: Optional[Link[Student]] = None
    inventory_item: Optional[Link[InventoryItem]] = None
    book_title: Optional[str] = None
    category: Optional[str] = "Theory"  # "Theory" | "CET"
    subject: Optional[str] = "Physics"  # "Physics" | "Chemistry" | "Biology" | "Maths"
    recipient_type: Optional[str] = "Student"  # "Student" | "Teacher"
    recipient_name: Optional[str] = None
    recipient_id: Optional[str] = None
    quantity: int = 1
    handed_over_by: Optional[str] = None
    handed_over_to: Optional[str] = None
    student_roll_no: Optional[str] = None
    standard: Optional[str] = None
    status: str = "Pending Pickup"  # "Handed Over" | "Pending Pickup"
    date: Optional[datetime] = None
    verified_by: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "inventory_deliveries"
