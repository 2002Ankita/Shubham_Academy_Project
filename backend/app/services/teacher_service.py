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
    
    assigned_batches = list(teacher.assigned_batches or [])
    subjects = list(teacher.subjects or [])

    if user_obj and user_obj.full_name and (not assigned_batches or not subjects):
        try:
            from app.models.batch import Batch
            batches = await Batch.find(Batch.teacher_name == user_obj.full_name).to_list()
            for b in batches:
                label = f"{b.standard} - {b.batch_name or b.name}"
                if label not in assigned_batches:
                    assigned_batches.append(label)
                if b.subject and b.subject not in subjects:
                    subjects.append(b.subject)
        except Exception:
            pass
    
    return {
        "id": str(teacher.id),
        "employee_id": teacher.employee_id or f"EMP-{str(teacher.id)[:6].upper()}",
        "full_name": user_obj.full_name if user_obj else "",
        "email": user_obj.email if user_obj else "",
        "mobile_number": teacher.mobile_number or "",
        "subjects": subjects,
        "assigned_batches": assigned_batches,
        "hourly_rate": teacher.hourly_rate or 0.0,
        "joining_date": teacher.joining_date,
        "status": teacher.status or "Active"
    }

async def create_teacher(teacher_in: TeacherCreate) -> dict:
    employee_id = f"EMP-{uuid.uuid4().hex[:6].upper()}"
    
    from fastapi import HTTPException
    import re

    # Validation
    if not teacher_in.email:
        raise HTTPException(status_code=400, detail="Email is required")
        
    existing_user = await User.find_one(User.email == teacher_in.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    clean_mobile = re.sub(r'\D', '', teacher_in.mobile_number)
    if len(clean_mobile) < 10:
        raise HTTPException(status_code=400, detail="Invalid mobile number format")
        
    existing_mobile = await Teacher.find_one(Teacher.mobile_number == teacher_in.mobile_number)
    if existing_mobile:
        raise HTTPException(status_code=400, detail="Mobile number already registered")

    from pymongo.errors import DuplicateKeyError

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
    try:
        await teacher.insert()
    except DuplicateKeyError:
        # Rollback user creation
        await user.delete()
        raise HTTPException(status_code=400, detail="Mobile number already registered")
    
    # Auto-add to payroll for current month
    from datetime import datetime
    from app.models.salary import SalaryPayment
    current_month = datetime.now().strftime("%B %Y")
    base = teacher.hourly_rate * 160 if hasattr(teacher, 'hourly_rate') and teacher.hourly_rate else 60000
    if not base or base < 1000:
        base = 60000
    
    new_s = SalaryPayment(
        teacher=teacher,
        month_name=current_month,
        base_salary=base,
        allowances=0,
        deductions=0,
        net_payable=base,
        status="Processing",
        transaction_ref="--"
    )
    await new_s.insert()
    
    return await _format_teacher(teacher)

async def get_teachers() -> list[dict]:
    teachers = await Teacher.find_all().to_list()
    return [await _format_teacher(t) for t in teachers]

async def get_teacher_for_user(user: User) -> dict | None:
    if not user:
        return None
        
    teacher = None
    if getattr(user, "id", None):
        teacher = await Teacher.find_one({"user.$id": user.id})
    if not teacher and getattr(user, "id", None):
        teacher = await Teacher.find_one(Teacher.user.id == user.id)
    if not teacher and getattr(user, "id", None):
        teacher = await Teacher.find_one(Teacher.employee_id == f"EMP-SEED-{str(user.id)}")
    if not teacher and getattr(user, "id", None):
        teacher = await resolve_teacher(str(user.id))
    if not teacher and getattr(user, "id", None):
        teacher = await Teacher.find_one({"user": user.id})
        
    if not teacher:
        role = getattr(user, "role", "").upper().replace("-", "_")
        if role == "TEACHER":
            employee_id = f"EMP-{uuid.uuid4().hex[:6].upper()}"
            phone = getattr(user, "mobile_number", "") or getattr(user, "phone", "") or ""
            teacher = Teacher(
                user=user,
                employee_id=employee_id,
                mobile_number=phone if phone else f"999{uuid.uuid4().hex[:7]}",
                subjects=["General"],
                assigned_batches=[],
                hourly_rate=50.0,
                status="Active"
            )
            try:
                await teacher.insert()
            except Exception:
                teacher = await Teacher.find_one({"user.$id": user.id})
                
    if not teacher:
        return None
    return await _format_teacher(teacher)

async def resolve_teacher(id_str: str) -> Teacher:
    from bson.errors import InvalidId
    from bson import ObjectId, DBRef
    teacher = None
    try:
        teacher = await Teacher.get(ObjectId(id_str))
    except InvalidId:
        pass
    if not teacher:
        try:
            user_obj_id = ObjectId(id_str)
            teacher = await Teacher.find_one(Teacher.user.id == user_obj_id)
            if not teacher:
                teacher = await Teacher.find_one({"user": DBRef("users", user_obj_id)})
            if not teacher:
                teacher = await Teacher.find_one({
                    "$or": [
                        {"user.$id": user_obj_id},
                        {"user.id": user_obj_id},
                        {"user": user_obj_id}
                    ]
                })
        except InvalidId:
            pass
    if not teacher:
        teacher = await Teacher.find_one(Teacher.employee_id == id_str)

    # If still not found, check if id_str represents an authenticated User with teacher role
    if not teacher:
        try:
            user_doc = None
            try:
                user_doc = await User.get(ObjectId(id_str))
            except Exception:
                pass
            if not user_doc:
                user_doc = await User.find_one(User.email == id_str)
            if user_doc and (user_doc.role or "").lower() == "teacher":
                teacher = await Teacher.find_one(Teacher.user.id == user_doc.id)
                if not teacher:
                    teacher = await Teacher.find_one({"user": DBRef("users", user_doc.id)})
                if not teacher:
                    import uuid
                    teacher = Teacher(
                        user=user_doc,
                        employee_id=f"TCH-{uuid.uuid4().hex[:6].upper()}",
                        mobile_number="",
                        subjects=["General"],
                        assigned_batches=[],
                        hourly_rate=650.0,
                        status="Active"
                    )
                    await teacher.insert()
        except Exception:
            pass

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
        try:
            await teacher.set(teacher_in)
        except DuplicateKeyError:
            raise HTTPException(status_code=400, detail="Mobile number already in use")
    
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
            await teacher.user.delete()
        
        await teacher.delete()
