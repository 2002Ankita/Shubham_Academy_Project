from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class InventoryItemCreate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = "Theory"  # "Theory" or "CET"
    subject: Optional[str] = "Physics"  # "Physics", "Chemistry", "Biology", "Maths"
    standard: Optional[str] = "11th & 12th Science"
    branch: Optional[str] = "Tarabai Park"
    in_stock: int = Field(default=50, ge=0)
    total_stock: Optional[int] = Field(default=None, ge=0)
    reorder_level: int = Field(default=15, ge=0)
    unit_cost: float = Field(default=350.0, ge=0.0)

class InventoryItemRestock(BaseModel):
    quantity: int = Field(..., gt=0)
    remarks: Optional[str] = None

class InventorySummaryResponse(BaseModel):
    total_available_stock: int
    total_disbursed_copies: int
    active_titles_count: int
    low_stock_count: int

class InventoryItemUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    subject: Optional[str] = None
    standard: Optional[str] = None
    branch: Optional[str] = None
    in_stock: Optional[int] = None
    reorder_level: Optional[int] = None
    unit_cost: Optional[float] = None

class InventoryItemResponse(BaseModel):
    id: str
    title: str
    category: Optional[str] = "Theory"
    subject: Optional[str] = "Physics"
    standard: str = "11th & 12th Science"
    branch: Optional[str] = "Tarabai Park"
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
    quantity: int = Field(default=1, gt=0)
    date: Optional[datetime] = None
    handed_over_by: Optional[str] = None
    handed_over_to: Optional[str] = None
    student_roll_no: Optional[str] = None
    standard: Optional[str] = None
    branch: Optional[str] = None
    academic_batch: Optional[str] = None
    session: Optional[str] = None
    batch: Optional[str] = None
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
    branch: Optional[str] = None
    academic_batch: Optional[str] = None
    session: Optional[str] = None
    batch: Optional[str] = None
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
    branch: Optional[str] = None
    academic_batch: Optional[str] = None
    academicBatch: Optional[str] = None
    session: Optional[str] = None
    batch: Optional[str] = None
    standard: Optional[str] = None
    remarks: Optional[str] = ""
