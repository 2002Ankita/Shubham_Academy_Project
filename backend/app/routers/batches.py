from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from app.schemas.batch import BatchCreate, BatchResponse
from app.services.auth_service import get_current_user
from app.routers.auth import oauth2_scheme
from app.services.batch_service import (
    get_all_batches,
    get_teacher_batches,
    get_batch_by_id,
    create_batch as service_create_batch,
    update_batch as service_update_batch,
    delete_batch as service_delete_batch,
    get_batch_students,
    import_timetable_slots_service,
    delete_timetable_slot_service
)

router = APIRouter(prefix="/batches", tags=["Batches"])

@router.get("/my-classes", response_model=List[BatchResponse])
async def get_my_classes(token: str = Depends(oauth2_scheme)):
    """Teacher specific endpoint: returns classes assigned to current teacher."""
    current_user = await get_current_user(token)
    return await get_teacher_batches(str(current_user.id))

@router.get("/{id}/students")
async def get_students_for_batch(id: str, token: str = Depends(oauth2_scheme)):
    """Get all enrolled students for a specific batch / class."""
    await get_current_user(token)
    return await get_batch_students(id)

@router.get("/{id}", response_model=BatchResponse)
async def get_batch(id: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_batch_by_id(id)

@router.get("", response_model=List[BatchResponse])
async def get_batches(
    teacher_id: Optional[str] = Query(None, description="Filter by teacher ID"),
    standard: Optional[str] = Query(None, description="Filter by standard"),
    token: str = Depends(oauth2_scheme)
):
    current_user = await get_current_user(token)
    user_role = getattr(current_user, "role", "").upper().replace("-", "_")
    
    # If a teacher requests batches without specific filter, pass their id
    if user_role == "TEACHER" and not teacher_id:
        teacher_id = str(current_user.id)

    return await get_all_batches(teacher_id=teacher_id, standard=standard)

@router.post("", response_model=BatchResponse)
async def create_batch(batch_in: BatchCreate, token: str = Depends(oauth2_scheme)):
    current_user = await get_current_user(token)
    user_role = getattr(current_user, "role", "").upper().replace("-", "_")
    if user_role not in ["ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized to create class batches")
    return await service_create_batch(batch_in.dict())

@router.put("/{id}", response_model=BatchResponse)
async def update_batch(id: str, batch_in: BatchCreate, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await service_update_batch(id, batch_in.dict(exclude_unset=True))

@router.post("/timetable/import")
async def import_timetable(
    items: List[Dict[str, Any]],
    token: str = Depends(oauth2_scheme)
):
    """Import and synchronize timetable slots across batches and assigned teachers."""
    current_user = await get_current_user(token)
    user_role = getattr(current_user, "role", "").upper().replace("-", "_")
    if user_role not in ["ADMIN", "SUPER_ADMIN", "TEACHER"]:
        raise HTTPException(status_code=403, detail="Not authorized to import timetable")
    return await import_timetable_slots_service(items)

@router.post("/timetable/delete-slot")
async def delete_timetable_slot(
    slot_data: Dict[str, Any],
    token: str = Depends(oauth2_scheme)
):
    """Delete a timetable slot from a batch."""
    current_user = await get_current_user(token)
    user_role = getattr(current_user, "role", "").upper().replace("-", "_")
    if user_role not in ["ADMIN", "SUPER_ADMIN", "TEACHER"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete timetable slots")
    return await delete_timetable_slot_service(slot_data)

@router.delete("/{id}")
async def delete_batch(id: str, token: str = Depends(oauth2_scheme)):
    current_user = await get_current_user(token)
    user_role = getattr(current_user, "role", "").upper().replace("-", "_")
    if user_role not in ["ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete class batches")
    return await service_delete_batch(id)


