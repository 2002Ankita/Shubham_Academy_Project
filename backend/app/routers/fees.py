from fastapi import APIRouter, Depends
from typing import List
from app.schemas.fees import FeePaymentCreate, FeePaymentResponse, FeeDetailsResponse, FeeStructureCreate, FeeStructureResponse, PendingFeeResponse
from app.services.fee_service import add_fee_payment, get_fee_details, create_fee_structure, get_fee_structures, get_all_fee_payments, get_pending_fees
from app.services.auth_service import get_current_user
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/fees", tags=["Fees"])

@router.post("/structures", response_model=FeeStructureResponse)
async def add_fee_structure(structure_in: FeeStructureCreate, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await create_fee_structure(structure_in)

@router.get("/structures", response_model=List[FeeStructureResponse])
async def list_fee_structures(token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_fee_structures()

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
