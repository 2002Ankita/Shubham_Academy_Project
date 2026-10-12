from app.models.reminders import ReminderSettings, ReminderHistory
from app.schemas.reminders import ReminderSettingsUpdate
from app.services.fee_service import get_pending_fees
from app.models.student import Student
from app.services.notification_provider import NotificationProvider
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

async def get_or_create_settings(academy: str = "Default") -> ReminderSettings:
    settings = await ReminderSettings.find_one(ReminderSettings.academy == academy)
    if not settings:
        settings = ReminderSettings(academy=academy)
        await settings.insert()
    return settings

async def update_settings(academy: str, update: ReminderSettingsUpdate) -> ReminderSettings:
    settings = await get_or_create_settings(academy)
    update_data = update.dict(exclude_unset=True)
    if update_data:
        await settings.set(update_data)
    return settings

async def get_reminder_history(student_id: str = None, skip: int = 0, limit: int = 50):
    query = {}
    if student_id:
        student = await Student.get(student_id)
        if student:
            query = {"student.$id": student.id}
    
    records = await ReminderHistory.find(query).skip(skip).limit(limit).to_list()
    return records

async def process_reminders():
    settings = await get_or_create_settings("Default")
    if not settings.enabled:
        return

    today = datetime.utcnow().date()
    pending_list = await get_pending_fees()
    provider = NotificationProvider()

    for pending in pending_list:
        student = await Student.get(pending.student_id)
        if not student or not student.fee_due_date:
            continue
            
        due_date = student.fee_due_date.date()
        days_diff = (today - due_date).days
        
        should_remind = False
        if days_diff == 0 and settings.remind_on_due_date:
            should_remind = True
        elif days_diff == -settings.remind_days_before:
            should_remind = True
        elif days_diff == settings.remind_days_after:
            should_remind = True
            
        if not should_remind:
            continue

        idempotency_key = f"{student.id}_{today.isoformat()}"
        existing = await ReminderHistory.find_one(ReminderHistory.idempotency_key == idempotency_key)
        
        if existing and existing.delivery_status in ["Sent", "Delivered", "Skipped"]:
            continue

        if pending.pending_fees <= 0:
            if existing:
                existing.delivery_status = "Skipped"
                existing.provider_response = "Fully paid before send"
                await existing.save()
            continue
            
        message = settings.message_template.format(
            parent_name=student.parent_name,
            pending_fees=pending.pending_fees,
            due_date=due_date.strftime("%d-%m-%Y"),
            student_id=student.student_id
        )

        history = existing
        if not history:
            history = ReminderHistory(
                idempotency_key=idempotency_key,
                academy="Default",
                student=student,
                scheduled_time=datetime.utcnow(),
                amount_outstanding=pending.pending_fees
            )
            await history.insert()
            
        res = await provider.send_sms(f"+91{student.parent_mobile}", message)
        history.delivery_status = res["status"]
        history.provider_response = res["response"]
        history.retry_count += 1
        history.updated_at = datetime.utcnow()
        await history.save()

async def trigger_manual_reminder(student_id: str):
    student = await Student.get(student_id)
    if not student:
        raise ValueError("Student not found")
        
    pending_list = await get_pending_fees()
    pending = next((p for p in pending_list if p.student_id == student_id), None)
    
    if not pending or pending.pending_fees <= 0:
        raise ValueError("No pending fees for this student")

    settings = await get_or_create_settings("Default")
    provider = NotificationProvider()
    
    due_date_str = student.fee_due_date.strftime("%d-%m-%Y") if student.fee_due_date else "N/A"
    message = settings.message_template.format(
        parent_name=student.parent_name,
        pending_fees=pending.pending_fees,
        due_date=due_date_str,
        student_id=student.student_id
    )
    
    idempotency_key = f"manual_{student.id}_{datetime.utcnow().isoformat()}"
    history = ReminderHistory(
        idempotency_key=idempotency_key,
        academy="Default",
        student=student,
        scheduled_time=datetime.utcnow(),
        amount_outstanding=pending.pending_fees
    )
    await history.insert()
    
    res = await provider.send_sms(f"+91{student.parent_mobile}", message)
    history.delivery_status = res["status"]
    history.provider_response = res["response"]
    history.updated_at = datetime.utcnow()
    await history.save()
    
    return history
