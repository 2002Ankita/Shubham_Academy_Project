from fastapi import APIRouter, Depends
from typing import List, Optional
from app.schemas.reminders import ReminderSettingsUpdate, ReminderSettingsResponse, ReminderHistoryResponse, ManualReminderRequest
from app.services.reminder_service import get_or_create_settings, update_settings, get_reminder_history, trigger_manual_reminder
from app.services.auth_service import get_current_user
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/reminders", tags=["Reminders"])

@router.get("/settings", response_model=ReminderSettingsResponse)
async def get_settings(academy: str = "Default", token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await get_or_create_settings(academy)

@router.put("/settings", response_model=ReminderSettingsResponse)
async def put_settings(update: ReminderSettingsUpdate, academy: str = "Default", token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await update_settings(academy, update)

@router.get("/history", response_model=List[ReminderHistoryResponse])
async def list_history(student_id: Optional[str] = None, skip: int = 0, limit: int = 50, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    records = await get_reminder_history(student_id, skip, limit)
    res = []
    for r in records:
        student_id_str = ""
        if r.student:
            if hasattr(r.student, "id"):
                student_id_str = str(r.student.id)
            else:
                student_id_str = str(r.student.ref.id)
                
        res.append({
            "id": str(r.id),
            "idempotency_key": r.idempotency_key,
            "student_id": student_id_str,
            "amount_outstanding": r.amount_outstanding,
            "delivery_status": r.delivery_status,
            "scheduled_time": r.scheduled_time,
            "provider_response": r.provider_response
        })
    return res

@router.post("/manual")
async def manual_trigger(request: ManualReminderRequest, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    history = await trigger_manual_reminder(
        student_id=request.student_id,
        parent_mobile=request.parent_mobile,
        channel=request.channel or "WhatsApp",
        custom_message=request.custom_message
    )
    return {"message": "Manual reminder triggered successfully", "status": history.delivery_status}

@router.post("/run-scheduler-now")
async def run_scheduler(token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    from app.services.reminder_service import process_reminders
    await process_reminders()
    return {"message": "Scheduler run triggered explicitly"}
