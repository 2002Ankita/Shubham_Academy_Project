from fastapi import APIRouter, Depends
from typing import List
from app.schemas.marks import (
    BulkMarkCreate,
    MarkCreate,
    MarkResponse,
    SendMarksNotificationRequest,
    SendMarksNotificationResponse
)
from app.services.mark_service import (
    enter_bulk_marks,
    enter_marks,
    get_student_results,
    send_marks_notifications,
    get_notification_logs
)
from app.services.auth_service import get_current_user
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/marks", tags=["Marks"])

@router.post("", response_model=MarkResponse)
async def add_marks(mark_in: MarkCreate, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await enter_marks(mark_in)

@router.post("/bulk", response_model=List[MarkResponse])
async def add_bulk_marks(marks_in: BulkMarkCreate, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await enter_bulk_marks(marks_in)

@router.post("/send-notifications", response_model=SendMarksNotificationResponse)
async def dispatch_marks_notifications(req: SendMarksNotificationRequest, token: str = Depends(oauth2_scheme)):
    user = await get_current_user(token)
    return await send_marks_notifications(user, req)

@router.get("/notification-logs")
async def list_notification_logs(limit: int = 50, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_notification_logs(limit)

@router.get("", response_model=List[MarkResponse])
async def list_all_marks(token: str = Depends(oauth2_scheme)):
    from app.services.mark_service import get_all_marks
    await get_current_user(token)
    return await get_all_marks()

@router.get("/{student_id}", response_model=List[MarkResponse])
async def list_student_marks(student_id: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_student_results(student_id)

