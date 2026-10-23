from fastapi import APIRouter, Depends, Query, Body, HTTPException, status
from typing import List, Optional
from app.schemas.inventory import (
    InventoryItemCreate, InventoryItemResponse, InventoryItemUpdate, InventoryItemRestock,
    InventoryDeliveryCreate, InventoryDeliveryResponse, InventoryDeliveryUpdate,
    InventorySummaryResponse
)
from app.services.inventory_service import (
    add_inventory_item, get_inventory_items, update_inventory_item, adjust_inventory_stock,
    delete_inventory_item,
    restock_inventory_item,
    add_delivery, update_delivery, delete_delivery, get_deliveries,
    get_student_book_delivery_status,
    get_inventory_summary, get_low_stock_items
)
from app.services.auth_service import get_current_user
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/inventory", tags=["Inventory"])

def check_admin_role(user):
    role = (getattr(user, "role", "") or "").upper().replace("-", "_")
    if role not in ["ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Admin privileges required.")

@router.get("/summary", response_model=InventorySummaryResponse)
async def inventory_summary(token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_inventory_summary()

@router.get("/low-stock", response_model=List[InventoryItemResponse])
async def list_low_stock_items(token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_low_stock_items()

@router.post("/items", response_model=InventoryItemResponse)
async def create_item(item_in: InventoryItemCreate, token: str = Depends(oauth2_scheme)):
    user = await get_current_user(token)
    check_admin_role(user)
    return await add_inventory_item(item_in)

@router.get("/items", response_model=List[InventoryItemResponse])
async def list_items(token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_inventory_items()

@router.post("/items/{item_id}/restock", response_model=InventoryItemResponse)
async def restock_item(item_id: str, restock_in: InventoryItemRestock, token: str = Depends(oauth2_scheme)):
    user = await get_current_user(token)
    check_admin_role(user)
    return await restock_inventory_item(item_id, restock_in)

@router.put("/items/{item_id}", response_model=InventoryItemResponse)
async def edit_item(item_id: str, update_in: InventoryItemUpdate, token: str = Depends(oauth2_scheme)):
    user = await get_current_user(token)
    check_admin_role(user)
    return await update_inventory_item(item_id, update_in)

@router.delete("/items/{item_id}")
async def remove_item(item_id: str, token: str = Depends(oauth2_scheme)):
    user = await get_current_user(token)
    check_admin_role(user)
    return await delete_inventory_item(item_id)

@router.post("/items/{item_id}/adjust-stock", response_model=InventoryItemResponse)
async def adjust_stock(item_id: str, delta: int = Body(..., embed=True), token: str = Depends(oauth2_scheme)):
    user = await get_current_user(token)
    check_admin_role(user)
    return await adjust_inventory_stock(item_id, delta)

@router.post("/deliveries", response_model=InventoryDeliveryResponse)
async def create_delivery(delivery_in: InventoryDeliveryCreate, token: str = Depends(oauth2_scheme)):
    user = await get_current_user(token)
    return await add_delivery(delivery_in, current_user_name=user.full_name)

@router.get("/deliveries", response_model=List[InventoryDeliveryResponse])
async def list_deliveries(
    student_id: Optional[str] = Query(None),
    branch: Optional[str] = Query(None),
    academic_batch: Optional[str] = Query(None),
    batch: Optional[str] = Query(None),
    session: Optional[str] = Query(None),
    token: str = Depends(oauth2_scheme)
):
    await get_current_user(token)
    return await get_deliveries(
        student_id=student_id,
        branch=branch,
        academic_batch=academic_batch or batch,
        session=session
    )

@router.put("/deliveries/{delivery_id}", response_model=InventoryDeliveryResponse)
async def mark_delivery_status(delivery_id: str, update_in: InventoryDeliveryUpdate, token: str = Depends(oauth2_scheme)):
    user = await get_current_user(token)
    if not update_in.verified_by:
        update_in.verified_by = user.full_name
    if not update_in.handed_over_by:
        update_in.handed_over_by = user.full_name
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
