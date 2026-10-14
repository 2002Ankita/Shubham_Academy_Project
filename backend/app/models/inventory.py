from beanie import Document, Link
from datetime import datetime
from typing import Optional
from app.models.student import Student
from app.models.user import User

class InventoryItem(Document):
    title: str
    category: str = "Theory"  # "Theory" | "CET"
    subject: str = "Physics"  # "Physics" | "Chemistry" | "Biology" | "Maths"
    standard: str = "11th & 12th Science"
    in_stock: int = 50
    reorder_level: int = 15
    unit_cost: float = 350.0
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "inventory_items"

class InventoryDelivery(Document):
    student: Link[Student]
    inventory_item: Optional[Link[InventoryItem]] = None
    book_title: Optional[str] = None
    category: Optional[str] = "Theory"  # "Theory" | "CET"
    subject: Optional[str] = "Physics"  # "Physics" | "Chemistry" | "Biology" | "Maths"
    status: str = "Pending Pickup"
    date: Optional[datetime] = None
    handed_over_by: Optional[str] = None
    verified_by: Optional[str] = None
    handed_over_to: Optional[str] = None
    student_roll_no: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "inventory_deliveries"
