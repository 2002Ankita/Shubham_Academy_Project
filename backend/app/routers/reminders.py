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

from datetime import timezone
from app.models.student import Student

@router.get("/history", response_model=List[ReminderHistoryResponse])
async def list_history(student_id: Optional[str] = None, skip: int = 0, limit: int = 50, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    records = await get_reminder_history(student_id, skip, limit)

    # Collect student IDs that need resolving from Student collection
    student_ids_to_fetch = set()
    for r in records:
        if r.student:
            s_id = r.student.id if hasattr(r.student, "id") else getattr(r.student.ref, "id", None)
            if s_id:
                student_ids_to_fetch.add(s_id)
                
    student_map = {}
    if student_ids_to_fetch:
        found_students = await Student.find({"_id": {"$in": list(student_ids_to_fetch)}}).to_list()
        for s in found_students:
            student_map[str(s.id)] = s

    res = []
    for r in records:
        student_id_str = ""
        s_id = None
        if r.student:
            if hasattr(r.student, "id"):
                s_id = r.student.id
                student_id_str = str(r.student.id)
            else:
                s_id = getattr(r.student.ref, "id", None)
                student_id_str = str(s_id) if s_id else ""
                
        stu = student_map.get(str(s_id)) if s_id else None

        # Resolve student name
        s_name = getattr(r, "student_name", None)
        if not s_name or s_name == "Student":
            if stu:
                s_name = getattr(stu, "full_name", None) or getattr(stu, "student_id", None) or "Student"
            else:
                s_name = "Student"

        # Resolve roll number
        r_num = getattr(r, "roll_number", None)
        if not r_num or r_num == "N/A":
            if stu:
                r_num = getattr(stu, "student_id", None) or "N/A"
            else:
                r_num = getattr(r, "student_id_str", None) or "N/A"

        # Resolve contact mobile
        p_mob = getattr(r, "parent_mobile", None)
        if not p_mob:
            if stu:
                p_mob = getattr(stu, "parent_mobile", None) or getattr(stu, "mobile_number", None) or ""
            else:
                p_mob = ""
        if p_mob:
            p_mob = str(p_mob).replace("+91", "").replace("-", "").replace(" ", "").strip()

        # Resolve channel
        chn = getattr(r, "channel", None)
        if not chn:
            if r.provider_response and "sms" in r.provider_response.lower():
                chn = "SMS"
            elif r.provider_response and "whatsapp" in r.provider_response.lower():
                chn = "WhatsApp"
            else:
                chn = "WhatsApp"

        # Resolve reminder stage
        stage = getattr(r, "reminder_stage", None)
        if not stage:
            if r.idempotency_key and "manual" in r.idempotency_key:
                stage = "Manual Alert"
            else:
                stage = "Automated Alert"

        # Ensure scheduled_time has UTC timezone info so ISO string ends with +00:00 or Z
        sched_time = r.scheduled_time
        if sched_time and sched_time.tzinfo is None:
            sched_time = sched_time.replace(tzinfo=timezone.utc)

        res.append({
            "id": str(r.id),
            "idempotency_key": r.idempotency_key,
            "student_id": student_id_str,
            "student_name": s_name,
            "roll_number": r_num,
            "parent_mobile": p_mob,
            "channel": chn,
            "reminder_stage": stage,
            "amount_outstanding": r.amount_outstanding,
            "delivery_status": r.delivery_status,
            "scheduled_time": sched_time,
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
