import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.attendance import Attendance
from app.models.batch import Batch
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.user import User
from app.models.leave_request import LeaveRequest
from app.services.attendance_service import get_teacher_attendance

async def main():
    client = AsyncIOMotorClient("mongodb://127.0.0.1:27017")
    await init_beanie(database=client.academy_management, document_models=[Attendance, Batch, Student, Teacher, User, LeaveRequest])
    
    records = await get_teacher_attendance("6acdd1fbfefd525f88f7600e")
    print(f"Total Teacher Attendance records: {len(records)}")
    for r in records:
        print(f"Date: {str(r['date'])[:10]} | Check In: {r['check_in_time']} | Check Out: {r['check_out_time']} | Hours: {r['total_hours']} | Status: {r['status']} | Remarks: {r.get('remarks')}")

if __name__ == "__main__":
    asyncio.run(main())
