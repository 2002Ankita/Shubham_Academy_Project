from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InventoryItemCreate(BaseModel):
    title: str
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
    student_id: str
    inventory_item_id: Optional[str] = None
    category: Optional[str] = "Theory"
    subject: Optional[str] = "Physics"
    book_title: Optional[str] = None
    status: Optional[str] = "Delivered"  # "Delivered" or "Pending Pickup"
    handed_over_by: Optional[str] = None
    verified_by: Optional[str] = None
    remarks: Optional[str] = None

class InventoryDeliveryUpdate(BaseModel):
    status: str
    verified_by: Optional[str] = None
    handed_over_by: Optional[str] = None
    remarks: Optional[str] = None

class InventoryDeliveryResponse(BaseModel):
    id: str
    student_id: Optional[str] = ""
    student_name: str
    roll_number: str
    book_title: str
    category: Optional[str] = "Theory"
    subject: Optional[str] = "Physics"
    status: str
    date: str
    handed_over_by: Optional[str] = "--"
    verified_by: Optional[str] = "--"
    remarks: Optional[str] = ""
