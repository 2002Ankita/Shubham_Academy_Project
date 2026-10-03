from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models.batch import Batch
from app.schemas.batch import BatchCreate, BatchResponse
from app.services.auth_service import get_current_user
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/batches", tags=["Batches"])

@router.post("", response_model=BatchResponse)
async def create_batch(batch_in: BatchCreate, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    batch = Batch(**batch_in.dict())
    await batch.insert()
    
    # Safely build the response to avoid duplicate 'id' keyword error
    res_data = batch_in.dict()
    res_data["id"] = str(batch.id)
    return BatchResponse(**res_data)

@router.get("", response_model=List[BatchResponse])
async def get_batches(token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    batches = await Batch.find_all().to_list()
    
    result = []
    for b in batches:
        d = b.dict(exclude={"id", "_id"})
        d["id"] = str(b.id)
        result.append(BatchResponse(**d))
    return result

@router.put("/{id}", response_model=BatchResponse)
async def update_batch(id: str, batch_in: BatchCreate, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    from bson import ObjectId
    batch = await Batch.get(ObjectId(id))
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    update_data = batch_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(batch, key, value)
    
    await batch.save()
    
    d = batch.dict(exclude={"id", "_id"})
    d["id"] = str(batch.id)
    return BatchResponse(**d)

@router.delete("/{id}")
async def delete_batch(id: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    from bson import ObjectId
    batch = await Batch.get(ObjectId(id))
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    await batch.delete()
    return {"message": "Batch deleted"}
