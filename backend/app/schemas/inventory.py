from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InventoryItemCreate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = "Theory"  # "Theory" or "CET"
    subject: Optional[str] = "Physics"  # "Physics", "Chemistry", "Biology", "Maths"
    standard: Optional[str] = "11th & 12th Science"
    in_stock: int
    reorder_level: int
    unit_cost: float

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
    standard: str
    in_stock: int
    reorder_level: int
    unit_cost: float
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
    status: Optional[str] = "Delivered"  # "Delivered" or "Pending Pickup"
    date: Optional[datetime] = None
    handed_over_by: Optional[str] = None
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
    status: str
    date: str
    raw_date: Optional[str] = None
    handed_over_by: Optional[str] = "--"
    verified_by: Optional[str] = "--"
    remarks: Optional[str] = ""
