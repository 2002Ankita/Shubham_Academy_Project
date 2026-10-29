from fastapi import APIRouter, Depends
from typing import List, Optional
from app.schemas.fees import (
    FeePaymentCreate,
    FeePaymentResponse,
    FeeDetailsResponse,
    FeeStructureCreate,
    FeeStructureResponse,
    FeeStructureUpdate,
    PendingFeeResponse,
    BranchUpiScannerCreate,
    BranchUpiScannerResponse,
    OfflineFeeRequestCreate,
    OfflineFeeRequestResponse,
    OfflineFeeRequestVerify,
    OfflineFeeRequestReject
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
    get_pending_fees,
    get_branch_upi_scanner,
    save_branch_upi_scanner,
    create_offline_fee_request,
    get_offline_fee_requests,
    verify_offline_fee_request,
    reject_offline_fee_request
)
from app.services.auth_service import get_current_user
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/fees", tags=["Fees"])

@router.get("/upi-scanner", response_model=BranchUpiScannerResponse)
async def get_upi_scanner(branch: Optional[str] = None, token: str = Depends(oauth2_scheme)):
    current_user = await get_current_user(token)
    user_branch = getattr(current_user, "branch", None)
    selected_branch = branch or user_branch or "Tarabai Park"
    return await get_branch_upi_scanner(branch=selected_branch)

@router.post("/upi-scanner", response_model=BranchUpiScannerResponse)
async def update_upi_scanner(scanner_in: BranchUpiScannerCreate, token: str = Depends(oauth2_scheme)):
    current_user = await get_current_user(token)
    user_name = getattr(current_user, "full_name", "Academic Admin")
    return await save_branch_upi_scanner(scanner_in, user_name=user_name)

@router.post("/offline-requests", response_model=OfflineFeeRequestResponse)
async def submit_offline_fee_request(req_in: OfflineFeeRequestCreate, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await create_offline_fee_request(req_in)

@router.get("/offline-requests", response_model=List[OfflineFeeRequestResponse])
async def list_offline_fee_requests(
    branch: Optional[str] = None,
    status: Optional[str] = None,
    token: str = Depends(oauth2_scheme)
):
    current_user = await get_current_user(token)
    user_role = getattr(current_user, "role", "").upper().replace("-", "_")
    user_branch = getattr(current_user, "branch", None)
    if user_role == "ADMIN" and user_branch and (not branch or branch == "ALL"):
        branch = user_branch
    return await get_offline_fee_requests(branch=branch, status=status)

@router.post("/offline-requests/{request_id}/verify", response_model=OfflineFeeRequestResponse)
async def verify_request(
    request_id: str,
    verify_in: OfflineFeeRequestVerify,
    token: str = Depends(oauth2_scheme)
):
    current_user = await get_current_user(token)
    verifier_name = getattr(current_user, "full_name", "Academic Admin")
    return await verify_offline_fee_request(
        request_id=request_id,
        verifier_name=verifier_name,
        remarks=verify_in.remarks,
        verified_amount=verify_in.verified_amount,
        collected_by_faculty=verify_in.collected_by_faculty
    )

@router.post("/offline-requests/{request_id}/reject", response_model=OfflineFeeRequestResponse)
async def reject_request(
    request_id: str,
    reject_in: OfflineFeeRequestReject,
    token: str = Depends(oauth2_scheme)
):
    current_user = await get_current_user(token)
    verifier_name = getattr(current_user, "full_name", "Academic Admin")
    return await reject_offline_fee_request(
        request_id=request_id,
        verifier_name=verifier_name,
        rejection_reason=reject_in.rejection_reason
    )

@router.post("/structures", response_model=FeeStructureResponse)
async def add_fee_structure(structure_in: FeeStructureCreate, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await create_fee_structure(structure_in)

@router.get("/structures", response_model=List[FeeStructureResponse])
async def list_fee_structures(branch: Optional[str] = None, token: str = Depends(oauth2_scheme)):
    current_user = await get_current_user(token)
    user_role = getattr(current_user, "role", "").upper().replace("-", "_")
    user_branch = getattr(current_user, "branch", None)
    if user_role == "ADMIN" and user_branch:
        branch = user_branch
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
async def list_all_fees(
    student_id: Optional[str] = None,
    branch: Optional[str] = None,
    standard: Optional[str] = None,
    token: str = Depends(oauth2_scheme)
):
    current_user = await get_current_user(token)
    user_role = getattr(current_user, "role", "").upper().replace("-", "_")
    user_branch = getattr(current_user, "branch", None)
    if user_role == "ADMIN" and user_branch:
        branch = user_branch
    return await get_all_fee_payments(student_id=student_id, branch=branch, standard=standard)

@router.get("/pending", response_model=List[PendingFeeResponse])
async def list_pending_fees(branch: Optional[str] = None, token: str = Depends(oauth2_scheme)):
    current_user = await get_current_user(token)
    user_role = getattr(current_user, "role", "").upper().replace("-", "_")
    user_branch = getattr(current_user, "branch", None)
    if user_role == "ADMIN" and user_branch:
        branch = user_branch
    return await get_pending_fees(branch=branch)

@router.get("/{student_id}", response_model=FeeDetailsResponse)
async def fee_details(
    student_id: str,
    branch: Optional[str] = None,
    standard: Optional[str] = None,
    token: str = Depends(oauth2_scheme)
):
    current_user = await get_current_user(token)
    user_role = getattr(current_user, "role", "").upper().replace("-", "_")
    user_branch = getattr(current_user, "branch", None)
    if user_role == "ADMIN" and user_branch:
        branch = user_branch
    return await get_fee_details(student_id, branch=branch, standard=standard)

