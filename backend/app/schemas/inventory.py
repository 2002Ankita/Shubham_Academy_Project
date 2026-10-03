from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InventoryItemCreate(BaseModel):
    title: str
    standard: str
    in_stock: int
    reorder_level: int
    unit_cost: float

class InventoryItemResponse(InventoryItemCreate):
    id: str

class InventoryDeliveryCreate(BaseModel):
    student_id: str
    inventory_item_id: str

class InventoryDeliveryUpdate(BaseModel):
    status: str
    verified_by: Optional[str] = None

class InventoryDeliveryResponse(BaseModel):
    id: str
    student_name: str
    roll_number: str
    book_title: str
    status: str
    date: str
    verified_by: str
