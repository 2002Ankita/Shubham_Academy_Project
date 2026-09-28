from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime
from app.models.leave_request import LeaveRequest
from app.schemas.leave_request import LeaveRequestCreate, LeaveRequestResponse
from app.services.auth_service import get_current_user
from app.services.teacher_service import resolve_teacher
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/leave-requests", tags=["Leave Requests"])

@router.post("", response_model=LeaveRequestResponse)
async def create_leave_request(
    request_in: LeaveRequestCreate,
    token: str = Depends(oauth2_scheme)
):
    user = await get_current_user(token)
    teacher = await resolve_teacher(request_in.teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    delta = request_in.to_date - request_in.from_date
    days = delta.days + 1
    if days < 1:
        raise HTTPException(status_code=400, detail="Invalid date range")

    leave_req = LeaveRequest(
        teacher=teacher,
        teacher_name=user.full_name,
        leave_type=request_in.leave_type,
        from_date=request_in.from_date,
        to_date=request_in.to_date,
        number_of_days=days,
        reason=request_in.reason,
        status="Pending",
        created_at=datetime.utcnow()
    )
    await leave_req.insert()
    
    return LeaveRequestResponse(
        id=str(leave_req.id),
        teacher_id=str(teacher.id),
        teacher_name=leave_req.teacher_name,
        leave_type=leave_req.leave_type,
        from_date=leave_req.from_date,
        to_date=leave_req.to_date,
        number_of_days=leave_req.number_of_days,
        reason=leave_req.reason,
        status=leave_req.status,
        admin_comment=leave_req.admin_comment,
        created_at=leave_req.created_at
    )

@router.get("/teacher/{teacher_id}", response_model=List[LeaveRequestResponse])
async def get_teacher_leave_requests(teacher_id: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    teacher = await resolve_teacher(teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
        
    requests = await LeaveRequest.find(LeaveRequest.teacher.id == teacher.id).sort("-created_at").to_list()
    return [
        LeaveRequestResponse(
            id=str(r.id),
            teacher_id=str(teacher.id),
            teacher_name=r.teacher_name,
            leave_type=r.leave_type,
            from_date=r.from_date,
            to_date=r.to_date,
            number_of_days=r.number_of_days,
            reason=r.reason,
            status=r.status,
            admin_comment=r.admin_comment,
            created_at=r.created_at
        ) for r in requests
    ]

@router.get("", response_model=List[LeaveRequestResponse])
async def get_all_leave_requests(token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    requests = await LeaveRequest.find_all().sort("-created_at").to_list()
    return [
        LeaveRequestResponse(
            id=str(r.id),
            teacher_id=str(r.teacher.ref.id),
            teacher_name=r.teacher_name,
            leave_type=r.leave_type,
            from_date=r.from_date,
            to_date=r.to_date,
            number_of_days=r.number_of_days,
            reason=r.reason,
            status=r.status,
            admin_comment=r.admin_comment,
            created_at=r.created_at
        ) for r in requests
    ]

@router.put("/{request_id}/status")
async def update_leave_status(request_id: str, status: str, admin_comment: str = None, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    from bson import ObjectId
    req = await LeaveRequest.get(ObjectId(request_id))
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found")
    req.status = status
    if admin_comment is not None:
        req.admin_comment = admin_comment
    await req.save()
    return {"message": "Leave request updated successfully"}
