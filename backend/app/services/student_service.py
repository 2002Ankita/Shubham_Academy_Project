from app.models.student import Student
from app.schemas.student import StudentCreate
from app.models.user import User
from app.core.security import get_password_hash
from bson import ObjectId
import uuid

async def _format_student(student: Student) -> dict:
    user_obj = None
    if isinstance(student.user, User):
        user_obj = student.user
    elif student.user:
        user_obj = await User.get(student.user.ref.id)
        student.user = user_obj
    
    return {
        "id": str(student.id),
        "student_id": student.student_id,
        "full_name": user_obj.full_name if user_obj else "",
        "email": user_obj.email if user_obj else "",
        "mobile_number": student.mobile_number,
        "date_of_birth": student.date_of_birth,
        "gender": student.gender,
        "address": student.address,
        "parent_name": student.parent_name,
        "parent_mobile": student.parent_mobile,
        "standard": student.standard,
        "batch": student.batch,
        "branch": student.branch,
        "academic_year": student.academic_year,
        "rfid_tag": student.rfid_tag,
        "admission_date": student.admission_date,
    }

async def create_student(student_in: StudentCreate) -> dict:
    # 1. Create User account for student
    student_id = f"STU-{uuid.uuid4().hex[:6].upper()}"
    
    from pymongo.errors import DuplicateKeyError
    from fastapi import HTTPException
    
    user = User(
        email=student_in.email if student_in.email else f"{student_id}@academy.com",
        hashed_password=get_password_hash(student_in.password),
        full_name=student_in.full_name,
        role="STUDENT"
    )
    try:
        await user.insert()
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Email already registered")

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
        standard=student_in.standard,
        batch=student_in.batch,
        branch=student_in.branch,
        academic_year=student_in.academic_year
    )
    await student.insert()
    return await _format_student(student)

async def get_students() -> list[dict]:
    students = await Student.find_all().to_list()
    return [await _format_student(s) for s in students]

async def resolve_student(id_str: str) -> Student:
    from bson.errors import InvalidId
    from bson import ObjectId
    student = None
    try:
        student = await Student.get(ObjectId(id_str))
    except InvalidId:
        pass
    if not student:
        try:
            user_obj_id = ObjectId(id_str)
            student = await Student.find_one({"user.$id": user_obj_id})
        except InvalidId:
            pass
    if not student:
        student = await Student.find_one(Student.student_id == id_str)
    return student

async def get_student_by_id(id: str) -> dict:
    student = await resolve_student(id)
    if not student:
        return None
    return await _format_student(student)

async def update_student(id: str, student_in: dict) -> dict:
    student = await resolve_student(id)
    if not student:
        raise Exception("Student not found")
        
    # We might need to update user profile as well if full_name or email is passed
    if "full_name" in student_in or "email" in student_in:
        from pymongo.errors import DuplicateKeyError
        from fastapi import HTTPException
        if not isinstance(student.user, User):
            user_obj = await User.get(student.user.ref.id)
            student.user = user_obj
        if "full_name" in student_in:
            student.user.full_name = student_in["full_name"]
            del student_in["full_name"]
        if "email" in student_in:
            student.user.email = student_in["email"]
            del student_in["email"]
        try:
            await student.user.save()
        except DuplicateKeyError:
            raise HTTPException(status_code=400, detail="Email already in use")
        
    if student_in:
        await student.set(student_in)
    
    return await _format_student(student)

async def delete_student(id: str):
    student = await resolve_student(id)
    if student:
        if not isinstance(student.user, User):
            user_obj = await User.get(student.user.ref.id)
            student.user = user_obj
        if student.user:
            await student.user.delete()
        await student.delete()

