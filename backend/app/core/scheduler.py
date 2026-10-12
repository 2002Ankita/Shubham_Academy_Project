from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def send_fee_reminders():
    logger.info("Running daily fee reminder check...")
    from app.services.reminder_service import process_reminders
    try:
        await process_reminders()
    except Exception as e:
        logger.error(f"Error in fee reminder job: {e}")

def start_scheduler():
    scheduler.add_job(
        send_fee_reminders,
        trigger=CronTrigger(hour=9, minute=0),
        id="fee_reminder_job",
        replace_existing=True
    )
    scheduler.start()
    logger.info("Fee reminder scheduler started.")

def shutdown_scheduler():
    scheduler.shutdown()
    logger.info("Fee reminder scheduler shutdown.")
