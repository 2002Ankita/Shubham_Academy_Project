from app.models.student import Student
from app.schemas.student import StudentCreate
from app.models.user import User
from app.core.security import get_password_hash
from bson import ObjectId
import uuid

async def _format_student(student: Student) -> dict:
    if not isinstance(student.user, User):
        await student.fetch_link(Student.user)
    
    return {
        "id": str(student.id),
        "student_id": student.student_id,
        "full_name": student.user.full_name if student.user else "",
        "email": student.user.email if student.user else "",
        "mobile_number": student.mobile_number,
        "date_of_birth": student.date_of_birth,
        "gender": student.gender,
        "address": student.address,
        "parent_name": student.parent_name,
        "parent_mobile": student.parent_mobile,
        "course": student.course,
        "batch": student.batch,
        "academic_year": student.academic_year,
        "rfid_tag": student.rfid_tag,
        "admission_date": student.admission_date,
    }

async def create_student(student_in: StudentCreate) -> dict:
    # 1. Create User account for student
    student_id = f"STU-{uuid.uuid4().hex[:6].upper()}"
    
    user = User(
        email=student_in.email if student_in.email else f"{student_id}@academy.com",
        hashed_password=get_password_hash("password123"), # Default password
        full_name=student_in.full_name,
        role="STUDENT"
    )
    await user.insert()

    # 2. Create Student profile
    student = Student(
        user=user,
        student_id=student_id,
        mobile_number=student_in.mobile_number,
        date_of_birth=student_in.date_of_birth,
        gender=student_in.gender,
        address=student_in.address,
        parent_name=student_in.parent_name,
        parent_mobile=student_in.parent_mobile,
        course=student_in.course,
        batch=student_in.batch,
        academic_year=student_in.academic_year
    )
    await student.insert()
    return await _format_student(student)

async def get_students() -> list[dict]:
    students = await Student.find_all().to_list()
    return [await _format_student(s) for s in students]

async def get_student_by_id(id: str) -> dict:
    from bson.errors import InvalidId
    try:
        student = await Student.get(ObjectId(id))
    except InvalidId:
        return None
    if not student:
        return None
    return await _format_student(student)

async def update_student(id: str, student_in: dict) -> dict:
    student = await Student.get(ObjectId(id))
    if not student:
        raise Exception("Student not found")
        
    # We might need to update user profile as well if full_name or email is passed
    if "full_name" in student_in or "email" in student_in:
        if not isinstance(student.user, User):
            await student.fetch_link(Student.user)
        if "full_name" in student_in:
            student.user.full_name = student_in["full_name"]
            del student_in["full_name"]
        if "email" in student_in:
            student.user.email = student_in["email"]
            del student_in["email"]
        await student.user.save()
        
    if student_in:
        await student.set(student_in)
    
    return await _format_student(student)

async def delete_student(id: str):
    student = await Student.get(ObjectId(id))
    if student:
        if not isinstance(student.user, User):
            await student.fetch_link(Student.user)
        if student.user:
            await student.user.delete()
        await student.delete()

