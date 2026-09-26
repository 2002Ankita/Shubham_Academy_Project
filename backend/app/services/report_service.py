from app.models.student import Student
from app.models.teacher import Teacher
from app.models.fees import FeePayment

async def generate_dashboard_report() -> dict:
    total_students = await Student.count()
    total_teachers = await Teacher.count()
    
    # Simple report example
    return {
        "total_students": total_students,
        "total_teachers": total_teachers,
        "status": "Active"
    }
