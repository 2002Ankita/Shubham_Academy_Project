from fastapi import APIRouter, Depends
from typing import List, Optional
from app.schemas.fees import (
    FeePaymentCreate,
    FeePaymentResponse,
    FeeDetailsResponse,
    FeeStructureCreate,
    FeeStructureResponse,
    FeeStructureUpdate,
    PendingFeeResponse
)
from app.services.fee_service import (
    add_fee_payment,
    get_fee_details,
    create_fee_structure,
    get_fee_structures,
    update_fee_structure,
    delete_fee_structure,
    seed_default_fee_structures,
    get_all_fee_payments,
    get_pending_fees
)
from app.services.auth_service import get_current_user
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/fees", tags=["Fees"])

@router.post("/structures", response_model=FeeStructureResponse)
async def add_fee_structure(structure_in: FeeStructureCreate, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await create_fee_structure(structure_in)

@router.get("/structures", response_model=List[FeeStructureResponse])
async def list_fee_structures(branch: Optional[str] = None, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_fee_structures(branch=branch)

@router.put("/structures/{structure_id}", response_model=FeeStructureResponse)
async def edit_fee_structure(structure_id: str, structure_in: FeeStructureUpdate, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await update_fee_structure(structure_id, structure_in)

@router.delete("/structures/{structure_id}")
async def remove_fee_structure(structure_id: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await delete_fee_structure(structure_id)

@router.post("/structures/seed-defaults")
async def seed_fee_structures(token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await seed_default_fee_structures()

@router.post("", response_model=FeePaymentResponse)
async def collect_fee(payment_in: FeePaymentCreate, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await add_fee_payment(payment_in)

@router.get("", response_model=List[FeePaymentResponse])
async def list_all_fees(token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_all_fee_payments()

@router.get("/pending", response_model=List[PendingFeeResponse])
async def list_pending_fees(token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_pending_fees()

@router.get("/{student_id}", response_model=FeeDetailsResponse)
async def fee_details(student_id: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_fee_details(student_id)
