from app.models.teacher import Teacher
from app.schemas.teacher import TeacherCreate
from app.models.user import User
from app.core.security import get_password_hash
from bson import ObjectId
import uuid

async def _format_teacher(teacher: Teacher) -> dict:
    user_obj = None
    if isinstance(teacher.user, User):
        user_obj = teacher.user
    elif teacher.user:
        user_obj = await User.get(teacher.user.ref.id)
        teacher.user = user_obj
    
    return {
        "id": str(teacher.id),
        "employee_id": teacher.employee_id,
        "full_name": user_obj.full_name if user_obj else "",
        "email": user_obj.email if user_obj else "",
        "mobile_number": teacher.mobile_number,
        "subjects": teacher.subjects,
        "assigned_batches": teacher.assigned_batches,
        "hourly_rate": teacher.hourly_rate,
        "joining_date": teacher.joining_date,
        "status": teacher.status
    }

async def create_teacher(teacher_in: TeacherCreate) -> dict:
    employee_id = f"EMP-{uuid.uuid4().hex[:6].upper()}"
    
    from pymongo.errors import DuplicateKeyError
    from fastapi import HTTPException

    user = User(
        email=teacher_in.email,
        hashed_password=get_password_hash(teacher_in.password),
        full_name=teacher_in.full_name,
        role="TEACHER"
    )
    try:
        await user.insert()
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Email already registered")

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

async def resolve_teacher(id_str: str) -> Teacher:
    from bson.errors import InvalidId
    from bson import ObjectId
    teacher = None
    try:
        teacher = await Teacher.get(ObjectId(id_str))
    except InvalidId:
        pass
    if not teacher:
        try:
            user_obj_id = ObjectId(id_str)
            teacher = await Teacher.find_one({"user.$id": user_obj_id})
        except InvalidId:
            pass
    if not teacher:
        teacher = await Teacher.find_one(Teacher.employee_id == id_str)
    return teacher

async def get_teacher_by_id(id: str) -> dict:
    teacher = await resolve_teacher(id)
    if not teacher:
        return None
    return await _format_teacher(teacher)

async def update_teacher(id: str, teacher_in: dict) -> dict:
    teacher = await resolve_teacher(id)
        
    if not teacher:
        raise Exception("Teacher not found")
        
    if "full_name" in teacher_in or "email" in teacher_in:
        from pymongo.errors import DuplicateKeyError
        from fastapi import HTTPException
        if not isinstance(teacher.user, User):
            user_obj = await User.get(teacher.user.ref.id)
            teacher.user = user_obj
        if "full_name" in teacher_in:
            teacher.user.full_name = teacher_in["full_name"]
            del teacher_in["full_name"]
        if "email" in teacher_in:
            teacher.user.email = teacher_in["email"]
            del teacher_in["email"]
        try:
            await teacher.user.save()
        except DuplicateKeyError:
            raise HTTPException(status_code=400, detail="Email already in use")
        
    if teacher_in:
        await teacher.set(teacher_in)
    
    return await _format_teacher(teacher)

async def delete_teacher(id: str):
    teacher = await resolve_teacher(id)
    if not teacher:
        raise Exception("Teacher not found")
        
    if teacher:
        if not isinstance(teacher.user, User):
            user_obj = await User.get(teacher.user.ref.id)
            teacher.user = user_obj
        if teacher.user:
            teacher.user.is_active = False
            await teacher.user.save()
        
        teacher.status = "Inactive"
        await teacher.save()
