from beanie import Document, Link
from datetime import datetime
from typing import Optional
from app.models.student import Student
from app.models.user import User

class InventoryItem(Document):
    title: str
    standard: str
    in_stock: int
    reorder_level: int
    unit_cost: float
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "inventory_items"

class InventoryDelivery(Document):
    student: Link[Student]
    inventory_item: Link[InventoryItem]
    status: str = "Pending Pickup"
    date: Optional[datetime] = None
    verified_by: Optional[str] = None
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "inventory_deliveries"
