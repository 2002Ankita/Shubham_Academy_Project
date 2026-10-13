from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InventoryItemCreate(BaseModel):
    title: str
    standard: str
    subject: Optional[str] = None
    in_stock: int
    total_stock: Optional[int] = None
    reorder_level: int
    unit_cost: float

class InventoryItemRestock(BaseModel):
    quantity: int

class InventoryItemResponse(InventoryItemCreate):
    id: str

class InventoryDeliveryCreate(BaseModel):
    student_id: Optional[str] = None
    inventory_item_id: str
    quantity: int = 1
    handed_over_by: Optional[str] = None
    handed_over_to: Optional[str] = None
    student_roll_no: Optional[str] = None
    standard: Optional[str] = None
    status: Optional[str] = "Handed Over"
    remarks: Optional[str] = None

class InventoryDeliveryUpdate(BaseModel):
    status: str
    verified_by: Optional[str] = None
    handed_over_by: Optional[str] = None
    remarks: Optional[str] = None

class InventoryDeliveryResponse(BaseModel):
    id: str
    student_name: str
    roll_number: str
    book_title: str
    item_id: Optional[str] = None
    available_stock: Optional[int] = None
    quantity: int = 1
    handed_over_by: str
    handed_over_to: str
    status: str
    date: str
    verified_by: str
    remarks: Optional[str] = None
