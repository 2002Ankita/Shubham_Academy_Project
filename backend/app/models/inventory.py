from beanie import Document, Link
from datetime import datetime
from typing import Optional
from app.models.student import Student
from app.models.user import User

class InventoryItem(Document):
    title: str
    standard: str
    subject: Optional[str] = None
    in_stock: int
    total_stock: Optional[int] = None
    reorder_level: int
    unit_cost: float
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "inventory_items"

class InventoryDelivery(Document):
    student: Optional[Link[Student]] = None
    inventory_item: Link[InventoryItem]
    quantity: int = 1
    handed_over_by: Optional[str] = None
    handed_over_to: Optional[str] = None
    student_roll_no: Optional[str] = None
    standard: Optional[str] = None
    status: str = "Handed Over"
    date: Optional[datetime] = None
    verified_by: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "inventory_deliveries"
