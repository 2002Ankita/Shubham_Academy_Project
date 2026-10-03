from fastapi import APIRouter, Depends
from typing import List
from app.schemas.inventory import (
    InventoryItemCreate, InventoryItemResponse,
    InventoryDeliveryCreate, InventoryDeliveryResponse, InventoryDeliveryUpdate
)
from app.services.inventory_service import (
    add_inventory_item, get_inventory_items,
    add_delivery, update_delivery, get_deliveries
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

@router.post("/deliveries", response_model=InventoryDeliveryResponse)
async def create_delivery(delivery_in: InventoryDeliveryCreate, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await add_delivery(delivery_in)

@router.get("/deliveries", response_model=List[InventoryDeliveryResponse])
async def list_deliveries(token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_deliveries()

@router.put("/deliveries/{delivery_id}", response_model=InventoryDeliveryResponse)
async def mark_delivery_status(delivery_id: str, update_in: InventoryDeliveryUpdate, token: str = Depends(oauth2_scheme)):
    user = await get_current_user(token)
    if not update_in.verified_by:
        update_in.verified_by = user.full_name
    return await update_delivery(delivery_id, update_in)
