from app.models.student import Student
from app.models.user import User
from app.models.fees import FeePayment
from app.core.security import get_password_hash
from bson import ObjectId
from fastapi import HTTPException
from pymongo.errors import DuplicateKeyError
import uuid
import re
from typing import Optional, Any
from datetime import datetime

from app.models.discount import DiscountApproval

async def _format_student(student: Student) -> dict:
    user_obj = None
    if isinstance(student.user, User):
        user_obj = student.user
    elif student.user:
        user_obj = await User.get(student.user.ref.id)
        student.user = user_obj

    # Calculate actual paid fees from FeePayment entries or stored field
    payments = await FeePayment.find({"student.$id": student.id}).to_list()
    actual_paid = sum(p.amount_paid for p in payments) if payments else float(getattr(student, "paid_fees", 0.0) or 0.0)
    total_fees = float(getattr(student, "total_fees", 0.0) or 0.0)
    remaining_fees = max(0.0, total_fees - actual_paid)

    return {
        "id": str(student.id),
        "student_id": student.student_id,
        "full_name": user_obj.full_name if user_obj else "",
        "email": user_obj.email if user_obj else "",
        "mobile_number": getattr(student, "mobile_number", "") or "",
        "parent_mobile": getattr(student, "parent_mobile", "") or "",
        "date_of_birth": student.date_of_birth,
        "gender": student.gender or "",
        "address": student.address or "",
        "city": getattr(student, "city", None) or "",
        "state": getattr(student, "state", None) or "",
        "pincode": getattr(student, "pincode", None) or "",
        "parent_name": student.parent_name or "",
        "relation": getattr(student, "relation", None) or "Father",
        "parent_email": getattr(student, "parent_email", None) or "",
        "parent_occupation": getattr(student, "parent_occupation", None) or "",
        "standard": student.standard or "",
        "batch": student.batch or "",
        "branch": student.branch or "Kolhapur Main Branch",
        "academic_year": student.academic_year or "2025-2026",
        "previous_school": getattr(student, "previous_school", None) or "",
        "rfid_tag": student.rfid_tag or "",
        "total_fees": total_fees,
        "paid_fees": actual_paid,
        "remaining_fees": remaining_fees,
        "profile_completed": bool(getattr(student, "profile_completed", False)),
        "avatar": getattr(student, "avatar", None) or "",
        "admission_date": student.admission_date,
        "original_fees": getattr(student, "original_fees", student.total_fees) or student.total_fees,
        "discount_amount": getattr(student, "discount_amount", 0.0) or 0.0,
        "discount_requested_amount": getattr(student, "discount_requested_amount", getattr(student, "discount_amount", 0.0)) or getattr(student, "discount_amount", 0.0),
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

async def create_student(student_in: Any, current_user: Optional[User] = None) -> dict:
    if hasattr(student_in, "dict"):
        data = student_in.dict()
    elif isinstance(student_in, dict):
        data = student_in.copy()
    else:
        data = vars(student_in)

    full_name = (data.get("full_name") or data.get("name") or "").strip()
    raw_mobile = str(data.get("mobile_number") or data.get("phone") or "").strip()
    raw_parent_mobile = str(data.get("parent_mobile") or data.get("parentPhone") or "").strip()

    if not full_name:
        raise HTTPException(status_code=400, detail="Student full name is required")

    clean_mobile = re.sub(r'\D', '', raw_mobile)
    clean_parent_mobile = re.sub(r'\D', '', raw_parent_mobile)

    if len(clean_mobile) < 10:
        raise HTTPException(status_code=400, detail="Student mobile number must be at least 10 digits")
    if len(clean_parent_mobile) < 10:
        raise HTTPException(status_code=400, detail="Parent mobile number must be at least 10 digits")
    if clean_mobile == clean_parent_mobile:
        raise HTTPException(status_code=400, detail="Student and parent mobile numbers must be different")

    student_id = data.get("student_id") or data.get("rollNumber") or f"STU-{uuid.uuid4().hex[:6].upper()}"

    # Fees and Discount parsing
    orig_fees = float(data.get("original_fees") or data.get("originalFees") or data.get("total_fees") or data.get("totalFees") or 0.0)
    disc_amount = float(data.get("discount_amount") or data.get("discountAmount") or data.get("discount_requested_amount") or data.get("discountRequestedAmount") or 0.0)
    disc_reason = data.get("discount_reason") or data.get("discountReason") or ("Scholarship Concession" if disc_amount > 0 else None)
    
    disc_status = "NONE"
    disc_offered_by = None
    disc_recommended_by = None
    disc_offered_at = None
    disc_approved_by = None
    disc_approved_at = None

    if disc_amount > 0:
        disc_offered_at = datetime.utcnow()
        recommender = (
            (data.get("discount_recommended_by") and str(data["discount_recommended_by"]).strip())
            or (data.get("discountRecommendedBy") and str(data["discountRecommendedBy"]).strip())
            or (data.get("discount_offered_by") and str(data["discount_offered_by"]).strip())
            or (data.get("discountOfferedBy") and str(data["discountOfferedBy"]).strip())
            or (data.get("discount_approved_by") and str(data["discount_approved_by"]).strip() and "PENDING" not in str(data["discount_approved_by"]).upper() and str(data["discount_approved_by"]).strip())
            or (current_user.full_name if current_user else "Miss Shilpa")
        )
        disc_recommended_by = recommender
        disc_offered_by = recommender
        disc_status = "PENDING"
        final_total_fees = orig_fees
    else:
        final_total_fees = orig_fees

    total_fees = float(data.get("total_fees") or data.get("totalFees") or final_total_fees)
    paid_fees = float(data.get("paid_fees") or data.get("paidFees") or data.get("downPayment") or 0.0)
    remaining_fees = max(0.0, total_fees - paid_fees)

    # Email handling
    email = data.get("email")
    if not email or not str(email).strip():
        email = f"stu_{clean_mobile[-10:]}@shubham.edu"
    email = str(email).strip().lower()

    password = data.get("password") or "password123"

    # UPSERT LOGIC
    existing_user = await User.find_one(User.email == email)
    existing_mobile = await Student.find_one(Student.mobile_number == clean_mobile)

    existing_student = None
    if existing_user:
        existing_student = await Student.find_one(Student.user.id == existing_user.id)
    elif existing_mobile:
        existing_student = existing_mobile

    if existing_student:
        if existing_user:
            existing_user.full_name = full_name
            await existing_user.save()

        existing_student.mobile_number = clean_mobile
        existing_student.parent_mobile = clean_parent_mobile
        existing_student.email = email
        existing_student.total_fees = total_fees
        existing_student.paid_fees = paid_fees
        existing_student.remaining_fees = remaining_fees
        existing_student.original_fees = orig_fees
        if data.get("date_of_birth"):
            existing_student.date_of_birth = data["date_of_birth"]
        if data.get("gender"):
            existing_student.gender = data["gender"]
        if data.get("address"):
            existing_student.address = data["address"]
        if data.get("standard"):
            existing_student.standard = data["standard"]
        if data.get("batch"):
            existing_student.batch = data["batch"]
        if data.get("branch"):
            existing_student.branch = data["branch"]
        if disc_amount > 0:
            existing_student.discount_amount = disc_amount
            existing_student.discount_requested_amount = disc_amount
            existing_student.discount_reason = disc_reason
            existing_student.discount_status = disc_status
            existing_student.discount_offered_by = disc_offered_by
            existing_student.discount_recommended_by = disc_recommended_by
            existing_student.discount_offered_at = disc_offered_at

        await existing_student.save()
        return await _format_student(existing_student)

    # 1. Create User account
    user = User(
        email=email,
        hashed_password=get_password_hash(password),
        full_name=full_name,
        role="STUDENT"
    )
    try:
        await user.insert()
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Account with this email already exists")

    # 2. Create Student record
    admission_date = datetime.utcnow()
    if data.get("admission_date"):
        try:
            if isinstance(data["admission_date"], str):
                admission_date = datetime.fromisoformat(data["admission_date"].replace('Z', '+00:00'))
            else:
                admission_date = data["admission_date"]
        except Exception:
            pass

    student = Student(
        user=user,
        student_id=student_id,
        mobile_number=clean_mobile,
        parent_mobile=clean_parent_mobile,
        email=email,
        total_fees=total_fees,
        paid_fees=paid_fees,
        remaining_fees=remaining_fees,
        profile_completed=False,
        standard=data.get("standard") or None,
        batch=data.get("batch") or None,
        branch=data.get("branch") or "Kolhapur Main Branch",
        academic_year=data.get("academic_year") or "2025-2026",
        admission_date=admission_date,
        rfid_tag=data.get("rfid_tag") or data.get("rfidCard") or None,
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
    if data.get("date_of_birth"):
        student.date_of_birth = data["date_of_birth"]
    if data.get("gender"):
        student.gender = data["gender"]
    if data.get("address"):
        student.address = data["address"]
    if data.get("parent_name"):
        student.parent_name = data["parent_name"]

    await student.insert()

    # Create discount approval record if discount requested
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

    # 3. If paid fees > 0, record initial payment ledger entry
    if paid_fees > 0:
        initial_payment = FeePayment(
            student=student,
            amount_paid=paid_fees,
            payment_method="Cash / Admission Counter",
            transaction_reference=f"ADM-INIT-{student_id}",
            remarks="Initial fee paid at admission",
            payment_date=datetime.utcnow()
        )
        await initial_payment.insert()

    # 4. If batch assigned, update student count on the Batch record
    if student.batch:
        try:
            from app.models.batch import Batch
            batch_obj = await Batch.find_one(Batch.name == student.batch)
            if batch_obj:
                batch_obj.student_count = await Student.find(Student.batch == student.batch).count()
                await batch_obj.save()
        except Exception:
            pass

    return await _format_student(student)

async def get_students() -> list[dict]:
    students = await Student.find_all().to_list()
    return [await _format_student(s) for s in students]

async def resolve_student(id_str: str) -> Optional[Student]:
    from bson.errors import InvalidId
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
    if not student:
        student = await Student.find_one(Student.mobile_number == id_str)
    return student

async def get_student_by_id(id: str) -> Optional[dict]:
    student = await resolve_student(id)
    if not student:
        return None
    return await _format_student(student)

async def update_student(id: str, student_in: dict, current_user: Optional[User] = None) -> dict:
    student = await resolve_student(id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    is_student_role = current_user and getattr(current_user, "role", "").upper() == "STUDENT"

    # Role-Based Access Control for STUDENT role:
    if is_student_role:
        # 1. Authorize: Student can only edit their own profile
        linked_user_id = str(student.user.id if isinstance(student.user, User) else student.user.ref.id)
        if linked_user_id != str(current_user.id):
            raise HTTPException(status_code=403, detail="Forbidden: You can only update your own student profile.")

        # 2. Enforce READ-ONLY for Admin-entered fields:
        admin_locked_fields = [
            "full_name",
            "name",
            "mobile_number",
            "phone",
            "parent_mobile",
            "parentPhone",
            "total_fees",
            "totalFees",
            "paid_fees",
            "paidFees",
            "remaining_fees",
            "remainingFees",
            "rfid_tag",
            "rfidCard",
            "student_id",
            "rollNumber"
        ]
        if getattr(student, "batch", None):
            admin_locked_fields.append("batch")
        if getattr(student, "standard", None):
            admin_locked_fields.append("standard")

        for field in admin_locked_fields:
            student_in.pop(field, None)

        # 3. Allow Student to update their email if requested
        if "email" in student_in and student_in["email"]:
            new_email = student_in["email"].strip().lower()
            if not isinstance(student.user, User):
                student.user = await User.get(student.user.ref.id)
            if student.user and student.user.email != new_email:
                existing_email_user = await User.find_one(User.email == new_email)
                if existing_email_user and str(existing_email_user.id) != str(student.user.id):
                    raise HTTPException(status_code=400, detail="This email address is already in use.")
                student.user.email = new_email
                await student.user.save()
            del student_in["email"]

        # 4. Check profile completeness based on filled data
        check_dob = student_in.get("date_of_birth") or student.date_of_birth
        check_gender = student_in.get("gender") or student.gender
        check_address = student_in.get("address") or student.address
        check_parent_name = student_in.get("parent_name") or student.parent_name
        check_standard = student_in.get("standard") or student.standard
        check_batch = student_in.get("batch") or student.batch

        student_in["profile_completed"] = bool(
            check_dob and check_gender and check_address and check_parent_name and check_standard and check_batch
        )

    else:
        # Admin / Super Admin role: can update all fields including name and fees
        if "full_name" in student_in or "name" in student_in:
            new_name = (student_in.get("full_name") or student_in.get("name") or "").strip()
            if new_name:
                if not isinstance(student.user, User):
                    student.user = await User.get(student.user.ref.id)
                if student.user:
                    student.user.full_name = new_name
                    await student.user.save()
            student_in.pop("full_name", None)
            student_in.pop("name", None)

        if "email" in student_in and student_in["email"]:
            new_email = student_in["email"].strip().lower()
            if not isinstance(student.user, User):
                student.user = await User.get(student.user.ref.id)
            if student.user and student.user.email != new_email:
                existing_email_user = await User.find_one(User.email == new_email)
                if existing_email_user and str(existing_email_user.id) != str(student.user.id):
                    raise HTTPException(status_code=400, detail="Email is already in use.")
                student.user.email = new_email
                await student.user.save()
            del student_in["email"]

        # Recalculate remaining fees if fee fields changed
        if "total_fees" in student_in or "totalFees" in student_in:
            tf = float(student_in.get("total_fees") or student_in.get("totalFees") or 0.0)
            student.total_fees = tf
            student_in["total_fees"] = tf
            student_in.pop("totalFees", None)

        if "paid_fees" in student_in or "paidFees" in student_in:
            pf = float(student_in.get("paid_fees") or student_in.get("paidFees") or 0.0)
            student.paid_fees = pf
            student_in["paid_fees"] = pf
            student_in.pop("paidFees", None)

        student.remaining_fees = max(0.0, student.total_fees - student.paid_fees)
        student_in["remaining_fees"] = student.remaining_fees

    # Apply updates to Student document
    if student_in:
        # Handle date conversions if strings passed
        if "date_of_birth" in student_in and isinstance(student_in["date_of_birth"], str):
            try:
                student_in["date_of_birth"] = datetime.fromisoformat(student_in["date_of_birth"].replace('Z', '+00:00'))
            except Exception:
                pass
        if "admission_date" in student_in and isinstance(student_in["admission_date"], str):
            try:
                student_in["admission_date"] = datetime.fromisoformat(student_in["admission_date"].replace('Z', '+00:00'))
            except Exception:
                pass

        try:
            await student.set(student_in)
        except DuplicateKeyError as e:
            if "mobile_number" in str(e):
                raise HTTPException(status_code=400, detail="Mobile number is already registered to another student.")
            raise HTTPException(status_code=400, detail="Duplicate key error on student update.")

    return await _format_student(student)

async def delete_student(id: str):
    student = await resolve_student(id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if not isinstance(student.user, User):
        user_obj = await User.get(student.user.ref.id)
        if user_obj:
            await user_obj.delete()
    elif student.user:
        await student.user.delete()

    # Also clean up any fee payments
    payments = await FeePayment.find({"student.$id": student.id}).to_list()
    for p in payments:
        await p.delete()

    await student.delete()

async def offer_student_discount(id: str, offer_in: dict, current_user: User) -> dict:
    student = await resolve_student(id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    disc_amount = float(offer_in.get("discount_amount") or 0.0)
    if disc_amount <= 0:
        raise HTTPException(status_code=400, detail="Discount amount must be greater than zero")

    disc_reason = offer_in.get("discount_reason") or "Fee Concession"
    curr_total = getattr(student, "total_fees", 0.0)
    curr_orig = getattr(student, "original_fees", 0.0)
    
    if curr_orig > 0:
        orig_fees = curr_orig
    else:
        orig_fees = offer_in.get("original_fees") or curr_total
        if orig_fees <= 0:
            orig_fees = curr_total

    is_super = is_superadmin_user(current_user)
    offered_at = datetime.utcnow()
    offered_by = f"{current_user.full_name} ({current_user.role})"

    recommender = (
        (offer_in.get("discount_recommended_by") and str(offer_in["discount_recommended_by"]).strip())
        or (offer_in.get("recommended_by") and str(offer_in["recommended_by"]).strip())
        or current_user.full_name
    )

    if is_super:
        disc_status = "APPROVED"
        approved_by = f"{current_user.full_name} (Superadmin)"
        approved_at = offered_at
        final_total = max(0.0, orig_fees - disc_amount)
    else:
        disc_status = "PENDING"
        approved_by = None
        approved_at = None
        final_total = orig_fees

    student.original_fees = orig_fees
    student.discount_amount = disc_amount
    student.discount_requested_amount = disc_amount
    student.discount_reason = disc_reason
    student.discount_status = disc_status
    student.discount_offered_by = offered_by
    student.discount_recommended_by = recommender
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

async def approve_student_discount(id: str, current_user: User, payload: dict = None) -> dict:
    if not is_superadmin_user(current_user):
        raise HTTPException(
            status_code=403, 
            detail="Forbidden: Final approval for student discount must be given by the Superadmin."
        )

    student = await resolve_student(id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    disc_amount = float(getattr(student, "discount_amount", 0.0) or getattr(student, "discount_requested_amount", 0.0) or 0.0)
    if payload:
        if "approved_amount" in payload and payload["approved_amount"] is not None and float(payload["approved_amount"]) > 0:
            disc_amount = float(payload["approved_amount"])
        elif "discount_amount" in payload and payload["discount_amount"] is not None and float(payload["discount_amount"]) > 0:
            disc_amount = float(payload["discount_amount"])
        elif "discountAmount" in payload and payload["discountAmount"] is not None and float(payload["discountAmount"]) > 0:
            disc_amount = float(payload["discountAmount"])
        elif "discount_percentage" in payload and float(payload["discount_percentage"]) > 0:
            orig = getattr(student, "original_fees", 0.0) or student.total_fees
            disc_amount = (orig * float(payload["discount_percentage"])) / 100.0

    # Fallback to DiscountApproval record if disc_amount is still 0
    if disc_amount <= 0:
        approval_rec = await DiscountApproval.find(
            DiscountApproval.student_id == str(student.id)
        ).sort("-offered_at").first_or_none()
        if approval_rec and (approval_rec.discount_amount or 0.0) > 0:
            disc_amount = float(approval_rec.discount_amount)

    # Fallback to difference between original_fees and total_fees if present
    if disc_amount <= 0:
        orig = float(getattr(student, "original_fees", 0.0) or 0.0)
        tot = float(getattr(student, "total_fees", 0.0) or 0.0)
        if orig > tot and (orig - tot) > 0:
            disc_amount = orig - tot

    if disc_amount <= 0:
        raise HTTPException(status_code=400, detail="No active discount offer to approve")

    orig_fees = getattr(student, "original_fees", 0.0) or student.total_fees
    student.original_fees = orig_fees
    student.discount_amount = disc_amount
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
        existing_approval.discount_amount = disc_amount
        existing_approval.final_fees = max(0.0, orig_fees - disc_amount)
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
            discount_requested_amount=getattr(student, "discount_requested_amount", disc_amount) or disc_amount,
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
    else:
        latest_approval = await DiscountApproval.find(
            DiscountApproval.student_id == str(student.id)
        ).sort("-offered_at").first_or_none()
        if latest_approval:
            latest_approval.status = "REJECTED"
            latest_approval.rejection_reason = reason or "Rejected by Superadmin"
            await latest_approval.save()

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
