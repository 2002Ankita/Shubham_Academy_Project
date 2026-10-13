from app.models.student import Student
from app.schemas.student import StudentCreate
from app.models.user import User
from app.core.security import get_password_hash
from bson import ObjectId
import uuid

from app.models.discount import DiscountApproval
from datetime import datetime

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
        "total_fees": student.total_fees,
        "admission_date": student.admission_date,
        "original_fees": getattr(student, "original_fees", student.total_fees) or student.total_fees,
        "discount_amount": getattr(student, "discount_amount", 0.0) or 0.0,
        "discount_reason": getattr(student, "discount_reason", None),
        "discount_status": getattr(student, "discount_status", "NONE") or "NONE",
        "discount_offered_by": getattr(student, "discount_offered_by", None),
        "discount_recommended_by": getattr(student, "discount_recommended_by", None) or getattr(student, "discount_offered_by", None),
        "discount_offered_at": getattr(student, "discount_offered_at", None),
        "discount_approved_by": getattr(student, "discount_approved_by", None),
        "discount_approved_at": getattr(student, "discount_approved_at", None),
        "discount_rejection_reason": getattr(student, "discount_rejection_reason", None),
    }

def is_superadmin_user(user: User) -> bool:
    if not user:
        return False
    role_clean = (user.role or "").lower().replace("-", "_").strip()
    return role_clean in ["super_admin", "superadmin"]

async def create_student(student_in: StudentCreate, current_user: User = None) -> dict:
    # 1. Create User account for student
    student_id = student_in.student_id if student_in.student_id else f"STU-{uuid.uuid4().hex[:6].upper()}"
    from fastapi import HTTPException
    from pymongo.errors import DuplicateKeyError
    import re

    # Validation
    if not student_in.email:
        raise HTTPException(status_code=400, detail="Email is required")
        
    existing_user = await User.find_one(User.email == student_in.email)
    
    if student_in.mobile_number == student_in.parent_mobile:
        raise HTTPException(status_code=400, detail="Student and parent mobile numbers must be different")
        
    clean_mobile = re.sub(r'\D', '', student_in.mobile_number)
    if len(clean_mobile) < 10:
        raise HTTPException(status_code=400, detail="Invalid mobile number format")
        
    existing_mobile = await Student.find_one(Student.mobile_number == student_in.mobile_number)

    # Determine fees & discount status
    orig_fees = student_in.original_fees if (student_in.original_fees and student_in.original_fees > 0) else (student_in.total_fees + (student_in.discount_amount or 0.0))
    disc_amount = float(student_in.discount_amount or 0.0)
    disc_reason = student_in.discount_reason or ("Scholarship Concession" if disc_amount > 0 else None)
    
    is_super = is_superadmin_user(current_user)
    disc_status = "NONE"
    disc_offered_by = None
    disc_recommended_by = None
    disc_offered_at = None
    disc_approved_by = None
    disc_approved_at = None
    
    if disc_amount > 0:
        disc_offered_at = datetime.utcnow()
        # Recommended by: staff or counselor recommends the discount during onboarding
        recommender = (
            (student_in.discount_recommended_by and student_in.discount_recommended_by.strip())
            or (student_in.discount_offered_by and student_in.discount_offered_by.strip())
            or (student_in.discount_approved_by and student_in.discount_approved_by.strip() and "PENDING" not in student_in.discount_approved_by.upper() and student_in.discount_approved_by.strip())
            or (current_user.full_name if current_user else "Miss Shilpa")
        )
        disc_recommended_by = recommender
        disc_offered_by = recommender
        
        # During onboarding, discounts are ONLY recommended, NEVER directly approved.
        # They are submitted as PENDING so that the Superadmin has sole authority to Approve or Reject on the Super Admin Dashboard.
        disc_status = "PENDING"
        disc_approved_by = None
        disc_approved_at = None
        final_total_fees = orig_fees
    else:
        final_total_fees = orig_fees
    
    # UPSERT LOGIC
    # If the student exists by email or mobile, we update them instead of rejecting
    existing_student = None
    if existing_user:
        existing_student = await Student.find_one(Student.user.id == existing_user.id)
    elif existing_mobile:
        existing_student = existing_mobile

    if existing_student:
        # Update user fields
        if existing_user:
            existing_user.full_name = student_in.full_name
            await existing_user.save()
            
        # Update student fields
        existing_student.mobile_number = student_in.mobile_number
        existing_student.date_of_birth = student_in.date_of_birth
        existing_student.gender = student_in.gender
        existing_student.address = student_in.address
        existing_student.parent_name = student_in.parent_name
        existing_student.parent_mobile = student_in.parent_mobile
        existing_student.standard = student_in.standard
        existing_student.batch = student_in.batch
        existing_student.branch = student_in.branch
        existing_student.academic_year = student_in.academic_year
        if hasattr(student_in, 'rfid_tag'):
            existing_student.rfid_tag = student_in.rfid_tag
        if getattr(student_in, "admission_date", None):
            existing_student.admission_date = student_in.admission_date
        existing_student.total_fees = final_total_fees
        existing_student.original_fees = orig_fees
        if disc_amount > 0:
            existing_student.discount_amount = disc_amount
            existing_student.discount_reason = disc_reason
            existing_student.discount_status = disc_status
            existing_student.discount_offered_by = disc_offered_by
            existing_student.discount_recommended_by = disc_recommended_by
            existing_student.discount_offered_at = disc_offered_at
            existing_student.discount_approved_by = disc_approved_by
            existing_student.discount_approved_at = disc_approved_at
        await existing_student.save()
        
        return await _format_student(existing_student)

    user = User(
        email=student_in.email,
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
        academic_year=student_in.academic_year,
        rfid_tag=student_in.rfid_tag,
        total_fees=final_total_fees,
        original_fees=orig_fees,
        discount_amount=disc_amount,
        discount_reason=disc_reason,
        discount_status=disc_status,
        discount_offered_by=disc_offered_by,
        discount_recommended_by=disc_recommended_by,
        discount_offered_at=disc_offered_at,
        discount_approved_by=disc_approved_by,
        discount_approved_at=disc_approved_at
    )
    if getattr(student_in, "admission_date", None):
        student.admission_date = student_in.admission_date
    await student.insert()

    if disc_amount > 0:
        approval_record = DiscountApproval(
            student_id=str(student.id),
            student_name=user.full_name,
            roll_number=student.student_id,
            standard=student.standard,
            original_fees=orig_fees,
            discount_amount=disc_amount,
            final_fees=max(0.0, orig_fees - disc_amount),
            discount_reason=disc_reason or "Fee Concession",
            status=disc_status,
            offered_by=disc_offered_by or "Admin",
            recommended_by=disc_recommended_by or disc_offered_by or "Miss Shilpa",
            offered_by_email=current_user.email if current_user else None,
            offered_at=disc_offered_at or datetime.utcnow(),
            approved_by=disc_approved_by,
            approved_by_email=None,
            approved_at=disc_approved_at
        )
        await approval_record.insert()

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
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Student not found")
        
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
        new_mobile = student_in.get("mobile_number", student.mobile_number)
        new_parent_mobile = student_in.get("parent_mobile", student.parent_mobile)
        if new_mobile == new_parent_mobile:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="Student and parent mobile numbers must be different")
            
        try:
            await student.set(student_in)
        except DuplicateKeyError:
            raise HTTPException(status_code=400, detail="Mobile number already in use")
    
    return await _format_student(student)

async def delete_student(id: str):
    from fastapi import HTTPException
    student = await resolve_student(id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    if not isinstance(student.user, User):
        user_obj = await User.get(student.user.ref.id)
        if user_obj:
            await user_obj.delete()
    elif student.user:
        await student.user.delete()
        
    await student.delete()

async def offer_student_discount(id: str, offer_in: dict, current_user: User) -> dict:
    from fastapi import HTTPException
    student = await resolve_student(id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    disc_amount = float(offer_in.get("discount_amount") or 0.0)
    if disc_amount <= 0:
        raise HTTPException(status_code=400, detail="Discount amount must be greater than zero")

    disc_reason = offer_in.get("discount_reason") or "Fee Concession"
    curr_total = getattr(student, "total_fees", 0.0)
    curr_orig = getattr(student, "original_fees", 0.0)
    
    # If student already has an original_fees recorded and > 0, keep it; else compute
    if curr_orig > 0:
        orig_fees = curr_orig
    else:
        orig_fees = offer_in.get("original_fees") or curr_total
        if orig_fees <= 0:
            orig_fees = curr_total

    is_super = is_superadmin_user(current_user)
    offered_at = datetime.utcnow()
    offered_by = f"{current_user.full_name} ({current_user.role})"

    if is_super:
        disc_status = "APPROVED"
        approved_by = f"{current_user.full_name} (Superadmin)"
        approved_at = datetime.utcnow()
        final_total = max(0.0, orig_fees - disc_amount)
    else:
        disc_status = "PENDING"
        approved_by = None
        approved_at = None
        final_total = orig_fees # remains original fee pending approval

    student.original_fees = orig_fees
    student.discount_amount = disc_amount
    student.discount_reason = disc_reason
    student.discount_status = disc_status
    student.discount_offered_by = offered_by
    student.discount_offered_at = offered_at
    student.discount_approved_by = approved_by
    student.discount_approved_at = approved_at
    student.discount_rejection_reason = None
    if is_super:
        student.total_fees = final_total
    await student.save()

    # Get student name
    student_name = ""
    if isinstance(student.user, User):
        student_name = student.user.full_name
    elif student.user:
        user_obj = await User.get(student.user.ref.id)
        if user_obj:
            student_name = user_obj.full_name

    approval = DiscountApproval(
        student_id=str(student.id),
        student_name=student_name,
        roll_number=student.student_id,
        standard=student.standard,
        original_fees=orig_fees,
        discount_amount=disc_amount,
        final_fees=max(0.0, orig_fees - disc_amount),
        discount_reason=disc_reason,
        status=disc_status,
        offered_by=offered_by,
        offered_by_email=current_user.email,
        offered_at=offered_at,
        approved_by=approved_by,
        approved_by_email=current_user.email if is_super else None,
        approved_at=approved_at
    )
    await approval.insert()

    return await _format_student(student)

async def approve_student_discount(id: str, current_user: User) -> dict:
    from fastapi import HTTPException
    # Strict role enforcement: Only Superadmin can approve discount
    if not is_superadmin_user(current_user):
        raise HTTPException(
            status_code=403, 
            detail="Forbidden: Final approval for student discount must be given by the Superadmin."
        )

    student = await resolve_student(id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    disc_amount = getattr(student, "discount_amount", 0.0)
    if disc_amount <= 0:
        raise HTTPException(status_code=400, detail="No active discount offer to approve")

    orig_fees = getattr(student, "original_fees", 0.0) or student.total_fees
    student.original_fees = orig_fees
    student.discount_status = "APPROVED"
    student.discount_approved_by = f"{current_user.full_name} (Superadmin)"
    student.discount_approved_at = datetime.utcnow()
    student.discount_rejection_reason = None
    student.total_fees = max(0.0, orig_fees - disc_amount)
    await student.save()

    # Update or create DiscountApproval record
    existing_approval = await DiscountApproval.find_one(
        DiscountApproval.student_id == str(student.id),
        DiscountApproval.status == "PENDING"
    )
    if existing_approval:
        existing_approval.status = "APPROVED"
        existing_approval.approved_by = f"{current_user.full_name} (Superadmin)"
        existing_approval.approved_by_email = current_user.email
        existing_approval.approved_at = datetime.utcnow()
        await existing_approval.save()
    else:
        student_name = ""
        if isinstance(student.user, User):
            student_name = student.user.full_name
        elif student.user:
            u_obj = await User.get(student.user.ref.id)
            if u_obj:
                student_name = u_obj.full_name
        approval = DiscountApproval(
            student_id=str(student.id),
            student_name=student_name,
            roll_number=student.student_id,
            standard=student.standard,
            original_fees=orig_fees,
            discount_amount=disc_amount,
            final_fees=max(0.0, orig_fees - disc_amount),
            discount_reason=student.discount_reason or "Fee Concession",
            status="APPROVED",
            offered_by=student.discount_offered_by or "Admin",
            offered_at=student.discount_offered_at or datetime.utcnow(),
            approved_by=f"{current_user.full_name} (Superadmin)",
            approved_by_email=current_user.email,
            approved_at=datetime.utcnow()
        )
        await approval.insert()

    return await _format_student(student)

async def reject_student_discount(id: str, reason: str, current_user: User) -> dict:
    from fastapi import HTTPException
    # Strict role enforcement: Only Superadmin can reject
    if not is_superadmin_user(current_user):
        raise HTTPException(
            status_code=403, 
            detail="Forbidden: Only Superadmin can reject student discounts."
        )

    student = await resolve_student(id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student.discount_status = "REJECTED"
    student.discount_rejection_reason = reason or "Rejected by Superadmin"
    if getattr(student, "original_fees", 0.0) > 0:
        student.total_fees = student.original_fees
    await student.save()

    existing_approval = await DiscountApproval.find_one(
        DiscountApproval.student_id == str(student.id),
        DiscountApproval.status == "PENDING"
    )
    if existing_approval:
        existing_approval.status = "REJECTED"
        existing_approval.rejection_reason = reason or "Rejected by Superadmin"
        await existing_approval.save()

    return await _format_student(student)

async def get_discount_approvals(status: str = None) -> list[dict]:
    query = {}
    if status and status.upper() != "ALL":
        query = {"status": status.upper()}
    
    approvals = await DiscountApproval.find(query).sort("-offered_at").to_list()
    res = []
    for a in approvals:
        res.append({
            "id": str(a.id),
            "student_id": a.student_id,
            "student_name": a.student_name,
            "roll_number": a.roll_number,
            "standard": a.standard,
            "original_fees": a.original_fees,
            "discount_amount": a.discount_amount,
            "final_fees": a.final_fees,
            "discount_reason": a.discount_reason,
            "status": a.status,
            "offered_by": a.offered_by,
            "recommended_by": getattr(a, "recommended_by", None) or a.offered_by,
            "offered_by_email": a.offered_by_email,
            "offered_at": a.offered_at.isoformat() if a.offered_at else None,
            "approved_by": a.approved_by,
            "approved_by_email": a.approved_by_email,
            "approved_at": a.approved_at.isoformat() if a.approved_at else None,
            "rejection_reason": a.rejection_reason
        })
    return res

