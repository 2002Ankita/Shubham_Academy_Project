from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InventoryItemCreate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = "Theory"  # "Theory" or "CET"
    subject: Optional[str] = "Physics"  # "Physics", "Chemistry", "Biology", "Maths"
    standard: Optional[str] = "11th & 12th Science"
    in_stock: int = 50
    total_stock: Optional[int] = None
    reorder_level: int = 15
    unit_cost: float = 350.0

class InventoryItemRestock(BaseModel):
    quantity: int

class InventoryItemUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    subject: Optional[str] = None
    standard: Optional[str] = None
    in_stock: Optional[int] = None
    reorder_level: Optional[int] = None
    unit_cost: Optional[float] = None

class InventoryItemResponse(BaseModel):
    id: str
    title: str
    category: Optional[str] = "Theory"
    subject: Optional[str] = "Physics"
    standard: str = "11th & 12th Science"
    in_stock: int = 50
    total_stock: Optional[int] = None
    reorder_level: int = 15
    unit_cost: float = 350.0
    created_at: Optional[datetime] = None

class InventoryDeliveryCreate(BaseModel):
    recipient_type: Optional[str] = "Student"  # "Student" or "Teacher"
    recipient_name: Optional[str] = None
    recipient_id: Optional[str] = None
    student_id: Optional[str] = None
    inventory_item_id: Optional[str] = None
    category: Optional[str] = "Theory"
    subject: Optional[str] = "Physics"
    book_title: Optional[str] = None
    quantity: int = 1
    date: Optional[datetime] = None
    handed_over_by: Optional[str] = None
    handed_over_to: Optional[str] = None
    student_roll_no: Optional[str] = None
    standard: Optional[str] = None
    status: Optional[str] = "Handed Over"  # "Handed Over" or "Pending Pickup"
    verified_by: Optional[str] = None
    remarks: Optional[str] = None

class InventoryDeliveryUpdate(BaseModel):
    recipient_type: Optional[str] = None
    recipient_name: Optional[str] = None
    recipient_id: Optional[str] = None
    student_id: Optional[str] = None
    inventory_item_id: Optional[str] = None
    category: Optional[str] = None
    subject: Optional[str] = None
    book_title: Optional[str] = None
    status: Optional[str] = None
    date: Optional[datetime] = None
    verified_by: Optional[str] = None
    handed_over_by: Optional[str] = None
    remarks: Optional[str] = None

class InventoryDeliveryResponse(BaseModel):
    id: str
    recipient_type: Optional[str] = "Student"
    recipient_name: Optional[str] = ""
    recipient_id: Optional[str] = ""
    student_id: Optional[str] = ""
    student_name: str
    roll_number: str
    book_title: Optional[str] = ""
    category: Optional[str] = "Theory"
    subject: Optional[str] = "Physics"
    item_id: Optional[str] = None
    available_stock: Optional[int] = None
    quantity: int = 1
    handed_over_by: Optional[str] = "--"
    handed_over_to: Optional[str] = "--"
    status: str = "Handed Over"
    date: str = ""
    raw_date: Optional[str] = None
    verified_by: Optional[str] = "--"
    remarks: Optional[str] = ""
