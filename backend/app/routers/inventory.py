from fastapi import APIRouter, Depends, Query, Body
from typing import List, Optional
from app.schemas.inventory import (
    InventoryItemCreate, InventoryItemResponse, InventoryItemUpdate,
    InventoryDeliveryCreate, InventoryDeliveryResponse, InventoryDeliveryUpdate
)
from app.services.inventory_service import (
    add_inventory_item, get_inventory_items, update_inventory_item, adjust_inventory_stock,
    add_delivery, update_delivery, delete_delivery, get_deliveries,
    get_student_book_delivery_status
)
from app.services.auth_service import get_current_user
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.post("/items", response_model=InventoryItemResponse)
async def create_item(item_in: InventoryItemCreate, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await add_inventory_item(item_in)

@router.get("/items", response_model=List[InventoryItemResponse])
async def list_items(token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_inventory_items()

@router.put("/items/{item_id}", response_model=InventoryItemResponse)
async def edit_item(item_id: str, update_in: InventoryItemUpdate, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await update_inventory_item(item_id, update_in)

@router.post("/items/{item_id}/adjust-stock", response_model=InventoryItemResponse)
async def adjust_stock(item_id: str, delta: int = Body(..., embed=True), token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await adjust_inventory_stock(item_id, delta)

@router.post("/deliveries", response_model=InventoryDeliveryResponse)
async def create_delivery(delivery_in: InventoryDeliveryCreate, token: str = Depends(oauth2_scheme)):
    user = await get_current_user(token)
    return await add_delivery(delivery_in, current_user_name=user.full_name)

@router.get("/deliveries", response_model=List[InventoryDeliveryResponse])
async def list_deliveries(student_id: Optional[str] = Query(None), token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_deliveries(student_id=student_id)

@router.put("/deliveries/{delivery_id}", response_model=InventoryDeliveryResponse)
async def mark_delivery_status(delivery_id: str, update_in: InventoryDeliveryUpdate, token: str = Depends(oauth2_scheme)):
    user = await get_current_user(token)
    return await update_delivery(delivery_id, update_in, current_user_name=user.full_name)

@router.delete("/deliveries/{delivery_id}")
async def remove_delivery(delivery_id: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await delete_delivery(delivery_id)

@router.get("/student/{student_id}/status")
async def get_student_delivery_matrix(student_id: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_student_book_delivery_status(student_id)

@router.get("/my-status")
async def get_my_delivery_matrix(token: str = Depends(oauth2_scheme)):
    user = await get_current_user(token)
    return await get_student_book_delivery_status(str(user.id))
