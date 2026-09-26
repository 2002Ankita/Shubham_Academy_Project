from app.models.teacher import Teacher
from app.schemas.teacher import TeacherCreate
from app.models.user import User
from app.core.security import get_password_hash
from bson import ObjectId
import uuid

async def _format_teacher(teacher: Teacher) -> dict:
    if not isinstance(teacher.user, User):
        await teacher.fetch_link(Teacher.user)
    
    return {
        "id": str(teacher.id),
        "employee_id": teacher.employee_id,
        "full_name": teacher.user.full_name if teacher.user else "",
        "email": teacher.user.email if teacher.user else "",
        "mobile_number": teacher.mobile_number,
        "subjects": teacher.subjects,
        "assigned_batches": teacher.assigned_batches,
        "hourly_rate": teacher.hourly_rate,
        "joining_date": teacher.joining_date,
        "status": teacher.status
    }

async def create_teacher(teacher_in: TeacherCreate) -> dict:
    employee_id = f"EMP-{uuid.uuid4().hex[:6].upper()}"
    
    user = User(
        email=teacher_in.email,
        hashed_password=get_password_hash("password123"), # Default password
        full_name=teacher_in.full_name,
        role="TEACHER"
    )
    await user.insert()

    teacher = Teacher(
        user=user,
        employee_id=employee_id,
        mobile_number=teacher_in.mobile_number,
        subjects=teacher_in.subjects,
        assigned_batches=teacher_in.assigned_batches,
        hourly_rate=teacher_in.hourly_rate
    )
    await teacher.insert()
    return await _format_teacher(teacher)

async def get_teachers() -> list[dict]:
    teachers = await Teacher.find_all().to_list()
    return [await _format_teacher(t) for t in teachers]

async def get_teacher_by_id(id: str) -> dict:
    from bson.errors import InvalidId
    try:
        teacher = await Teacher.get(ObjectId(id))
    except InvalidId:
        return None
    if not teacher:
        return None
    return await _format_teacher(teacher)

async def update_teacher(id: str, teacher_in: dict) -> dict:
    from bson.errors import InvalidId
    try:
        teacher = await Teacher.get(ObjectId(id))
    except InvalidId:
        raise Exception("Teacher not found")
        
    if not teacher:
        raise Exception("Teacher not found")
        
    if "full_name" in teacher_in or "email" in teacher_in:
        if not isinstance(teacher.user, User):
            await teacher.fetch_link(Teacher.user)
        if "full_name" in teacher_in:
            teacher.user.full_name = teacher_in["full_name"]
            del teacher_in["full_name"]
        if "email" in teacher_in:
            teacher.user.email = teacher_in["email"]
            del teacher_in["email"]
        await teacher.user.save()
        
    if teacher_in:
        await teacher.set(teacher_in)
    
    return await _format_teacher(teacher)

async def delete_teacher(id: str):
    from bson.errors import InvalidId
    try:
        teacher = await Teacher.get(ObjectId(id))
    except InvalidId:
        raise Exception("Teacher not found")
        
    if teacher:
        if not isinstance(teacher.user, User):
            await teacher.fetch_link(Teacher.user)
        if teacher.user:
            teacher.user.is_active = False
            await teacher.user.save()
        
        teacher.status = "Inactive"
        await teacher.save()
