from app.models.fees import FeePayment, FeeStructure
from app.models.student import Student
from app.schemas.fees import FeePaymentCreate, FeeDetailsResponse, FeeStructureCreate, FeeStructureUpdate, PendingFeeResponse
from fastapi import HTTPException
from bson import ObjectId
from typing import Optional
from datetime import datetime, timedelta

def normalize_branch_name(branch_str: Optional[str], fallback_batch: str = "") -> str:
    combined = f"{branch_str or ''} {fallback_batch or ''}".lower()
    if "tarabai" in combined:
        return "Tarabai Park"
    if "mangal" in combined:
        return "Mangalwar Peth"
    return (branch_str or "Tarabai Park").strip()

async def _format_fee_payment(payment: FeePayment) -> dict:
    student_id_str = ""
    student_name = ""
    roll_number = "N/A"
    if isinstance(payment.student, Student):
        student_obj = payment.student
    elif payment.student:
        student_obj = await Student.get(payment.student.ref.id)
    else:
        student_obj = None

    if student_obj:
        student_id_str = str(student_obj.id)
        roll_number = student_obj.student_id
        if getattr(student_obj, "user", None):
            from app.models.user import User
            user_obj = None
            if isinstance(student_obj.user, User):
                user_obj = student_obj.user
            else:
                user_obj = await User.get(student_obj.user.ref.id)
            if user_obj:
                student_name = user_obj.full_name

    return {
        "id": str(payment.id),
        "student_id": student_id_str,
        "student_name": student_name,
        "roll_number": roll_number,
        "amount_paid": payment.amount_paid,
        "payment_method": payment.payment_method,
        "transaction_reference": payment.transaction_reference,
        "remarks": payment.remarks,
        "payment_date": payment.payment_date,
        "original_fees": getattr(student_obj, "original_fees", 0.0) if student_obj else 0.0,
        "total_fees": getattr(student_obj, "total_fees", 0.0) if student_obj else 0.0,
        "discount_amount": getattr(student_obj, "discount_amount", 0.0) if student_obj else 0.0,
        "discount_status": getattr(student_obj, "discount_status", "NONE") if student_obj else "NONE",
        "discount_approved_by": getattr(student_obj, "discount_approved_by", None) if student_obj else None
    }

DEFAULT_CAMPUS_STRUCTURES = [
    # --- Tarabai Park Campus ---
    {
        "standard": "12th Science",
        "batch": "12th pcm tarabai park",
        "branch": "Tarabai Park",
        "academic_year": "2025-2026",
        "total_fee": 65000.0,
        "installment_amount": 16250.0,
        "number_of_installments": 4,
        "due_date": datetime(2026, 10, 30),
        "late_fee": 500.0
    },
    {
        "standard": "12th Science",
        "batch": "12th pcb tarabai park",
        "branch": "Tarabai Park",
        "academic_year": "2025-2026",
        "total_fee": 65000.0,
        "installment_amount": 16250.0,
        "number_of_installments": 4,
        "due_date": datetime(2026, 10, 30),
        "late_fee": 500.0
    },
    {
        "standard": "12th Science",
        "batch": "12th pcmb tarabai park",
        "branch": "Tarabai Park",
        "academic_year": "2025-2026",
        "total_fee": 72000.0,
        "installment_amount": 18000.0,
        "number_of_installments": 4,
        "due_date": datetime(2026, 10, 30),
        "late_fee": 500.0
    },
    {
        "standard": "11th Science",
        "batch": "11th pcm tarabai park",
        "branch": "Tarabai Park",
        "academic_year": "2025-2026",
        "total_fee": 55000.0,
        "installment_amount": 13750.0,
        "number_of_installments": 4,
        "due_date": datetime(2026, 11, 15),
        "late_fee": 500.0
    },
    {
        "standard": "11th Science",
        "batch": "11th pcb tarabai park",
        "branch": "Tarabai Park",
        "academic_year": "2025-2026",
        "total_fee": 55000.0,
        "installment_amount": 13750.0,
        "number_of_installments": 4,
        "due_date": datetime(2026, 11, 15),
        "late_fee": 500.0
    },
    {
        "standard": "11th Science",
        "batch": "11th pcmb tarabai park",
        "branch": "Tarabai Park",
        "academic_year": "2025-2026",
        "total_fee": 62000.0,
        "installment_amount": 15500.0,
        "number_of_installments": 4,
        "due_date": datetime(2026, 11, 15),
        "late_fee": 500.0
    },
    {
        "standard": "MHT-CET & JEE Target",
        "batch": "Tarabai Park Rankers Batch",
        "branch": "Tarabai Park",
        "academic_year": "2025-2026",
        "total_fee": 45000.0,
        "installment_amount": 15000.0,
        "number_of_installments": 3,
        "due_date": datetime(2026, 11, 1),
        "late_fee": 300.0
    },
    {
        "standard": "NEET Medical Premier",
        "batch": "Tarabai Park Intensive Batch",
        "branch": "Tarabai Park",
        "academic_year": "2025-2026",
        "total_fee": 75000.0,
        "installment_amount": 25000.0,
        "number_of_installments": 3,
        "due_date": datetime(2026, 10, 25),
        "late_fee": 600.0
    },

    # --- Mangalwar Peth Campus ---
    {
        "standard": "12th Science",
        "batch": "12th pcm mangalvar peth",
        "branch": "Mangalwar Peth",
        "academic_year": "2025-2026",
        "total_fee": 60000.0,
        "installment_amount": 15000.0,
        "number_of_installments": 4,
        "due_date": datetime(2026, 10, 30),
        "late_fee": 500.0
    },
    {
        "standard": "12th Science",
        "batch": "12th pcb mangalvar peth",
        "branch": "Mangalwar Peth",
        "academic_year": "2025-2026",
        "total_fee": 60000.0,
        "installment_amount": 15000.0,
        "number_of_installments": 4,
        "due_date": datetime(2026, 10, 30),
        "late_fee": 500.0
    },
    {
        "standard": "12th Science",
        "batch": "12th pcmb mangalvar peth",
        "branch": "Mangalwar Peth",
        "academic_year": "2025-2026",
        "total_fee": 68000.0,
        "installment_amount": 17000.0,
        "number_of_installments": 4,
        "due_date": datetime(2026, 10, 30),
        "late_fee": 500.0
    },
    {
        "standard": "11th Science",
        "batch": "11th pcm mangalvar peth",
        "branch": "Mangalwar Peth",
        "academic_year": "2025-2026",
        "total_fee": 52000.0,
        "installment_amount": 13000.0,
        "number_of_installments": 4,
        "due_date": datetime(2026, 11, 15),
        "late_fee": 500.0
    },
    {
        "standard": "11th Science",
        "batch": "11th pcb mangalvar peth",
        "branch": "Mangalwar Peth",
        "academic_year": "2025-2026",
        "total_fee": 52000.0,
        "installment_amount": 13000.0,
        "number_of_installments": 4,
        "due_date": datetime(2026, 11, 15),
        "late_fee": 500.0
    },
    {
        "standard": "11th Science",
        "batch": "11th pcmb mangalvar peth",
        "branch": "Mangalwar Peth",
        "academic_year": "2025-2026",
        "total_fee": 58000.0,
        "installment_amount": 14500.0,
        "number_of_installments": 4,
        "due_date": datetime(2026, 11, 15),
        "late_fee": 500.0
    },
    {
        "standard": "10th SSC Foundation",
        "batch": "Mangalwar Peth Morning Batch",
        "branch": "Mangalwar Peth",
        "academic_year": "2025-2026",
        "total_fee": 38000.0,
        "installment_amount": 9500.0,
        "number_of_installments": 4,
        "due_date": datetime(2026, 12, 5),
        "late_fee": 250.0
    },
    {
        "standard": "MHT-CET Crash Course",
        "batch": "Mangalwar Peth Fast Track",
        "branch": "Mangalwar Peth",
        "academic_year": "2025-2026",
        "total_fee": 35000.0,
        "installment_amount": 17500.0,
        "number_of_installments": 2,
        "due_date": datetime(2026, 11, 10),
        "late_fee": 300.0
    }
]

async def seed_default_fee_structures() -> dict:
    count_added = 0
    count_updated = 0
    for item in DEFAULT_CAMPUS_STRUCTURES:
        existing = await FeeStructure.find_one(
            FeeStructure.batch == item["batch"],
            FeeStructure.branch == item["branch"]
        )
        if not existing:
            # Also try case-insensitive check
            existing = await FeeStructure.find_one(
                FeeStructure.batch == item["batch"]
            )
        if not existing:
            new_s = FeeStructure(**item)
            await new_s.insert()
            count_added += 1
        else:
            # Ensure branch and total fee are up to date
            existing.branch = item["branch"]
            existing.total_fee = item["total_fee"]
            existing.installment_amount = item["installment_amount"]
            existing.number_of_installments = item["number_of_installments"]
            existing.standard = item["standard"]
            existing.academic_year = item["academic_year"]
            existing.due_date = item["due_date"]
            existing.late_fee = item["late_fee"]
            await existing.save()
            count_updated += 1

    return {
        "success": True,
        "message": f"Seeded fee structures: {count_added} created, {count_updated} refreshed for Tarabai Park & Mangalwar Peth campuses.",
        "added": count_added,
        "updated": count_updated
    }

async def create_fee_structure(structure_in: FeeStructureCreate) -> dict:
    payload = structure_in.dict()
    payload["branch"] = normalize_branch_name(payload.get("branch"), payload.get("batch", ""))
    structure = FeeStructure(**payload)
    await structure.insert()
    res = payload
    res["id"] = str(structure.id)
    return res

async def get_fee_structures(branch: Optional[str] = None) -> list[dict]:
    structures = await FeeStructure.find_all().to_list()
    # If no structures exist in DB yet, auto-seed defaults for both campuses
    if not structures:
        await seed_default_fee_structures()
        structures = await FeeStructure.find_all().to_list()

    res = []
    for s in structures:
        d = s.dict()
        d["id"] = str(s.id)
        # Filter by branch if requested
        if branch and branch != "ALL":
            target = branch.lower().replace(" campus", "").strip()
            s_branch = (d.get("branch") or "").lower().replace(" campus", "").strip()
            if target not in s_branch and s_branch not in target:
                continue
        res.append(d)
    return res

async def update_fee_structure(structure_id: str, structure_in: FeeStructureUpdate) -> dict:
    structure = None
    if ObjectId.is_valid(structure_id):
        structure = await FeeStructure.get(ObjectId(structure_id))
    if not structure:
        try:
            structure = await FeeStructure.get(structure_id)
        except Exception:
            pass
    if not structure:
        raise HTTPException(status_code=404, detail="Fee structure not found")

    update_data = {k: v for k, v in structure_in.dict().items() if v is not None}
    if "branch" in update_data:
        update_data["branch"] = normalize_branch_name(update_data["branch"], update_data.get("batch", getattr(structure, "batch", "")))

    # Recalculate installment amount if total_fee or number_of_installments changed
    total_fee = update_data.get("total_fee", getattr(structure, "total_fee", 0.0))
    installments = update_data.get("number_of_installments", getattr(structure, "number_of_installments", 1))
    if installments > 0 and "installment_amount" not in update_data:
        update_data["installment_amount"] = round(total_fee / installments, 2)

    for k, v in update_data.items():
        setattr(structure, k, v)

    await structure.save()
    res = structure.dict()
    res["id"] = str(structure.id)
    return res

async def delete_fee_structure(structure_id: str) -> dict:
    structure = None
    if ObjectId.is_valid(structure_id):
        structure = await FeeStructure.get(ObjectId(structure_id))
    if not structure:
        raise HTTPException(status_code=404, detail="Fee structure not found")

    await structure.delete()
    return {"success": True, "message": "Fee structure deleted successfully"}
    student_id_str = ""
    student_name = ""
    roll_number = "N/A"
    if isinstance(payment.student, Student):
        student_obj = payment.student
    elif payment.student:
        student_obj = await Student.get(payment.student.ref.id)
    else:
        student_obj = None

    if student_obj:
        student_id_str = str(student_obj.id)
        roll_number = student_obj.student_id
        if getattr(student_obj, "user", None):
            from app.models.user import User
            user_obj = None
            if isinstance(student_obj.user, User):
                user_obj = student_obj.user
            else:
                user_obj = await User.get(student_obj.user.ref.id)
            if user_obj:
                student_name = user_obj.full_name

    return {
        "id": str(payment.id),
        "student_id": student_id_str,
        "student_name": student_name,
        "roll_number": roll_number,
        "amount_paid": payment.amount_paid,
        "payment_method": payment.payment_method,
        "transaction_reference": payment.transaction_reference,
        "remarks": payment.remarks,
        "payment_date": payment.payment_date,
        "original_fees": getattr(student_obj, "original_fees", 0.0) if student_obj else 0.0,
        "total_fees": getattr(student_obj, "total_fees", 0.0) if student_obj else 0.0,
        "discount_amount": getattr(student_obj, "discount_amount", 0.0) if student_obj else 0.0,
        "discount_status": getattr(student_obj, "discount_status", "NONE") if student_obj else "NONE",
        "discount_approved_by": getattr(student_obj, "discount_approved_by", None) if student_obj else None
    }

async def _lookup_student_fee(student: Student, struct_list: list = None) -> float:
    student_custom_fee = getattr(student, 'total_fees', 0.0)
    if student_custom_fee and student_custom_fee > 0:
        return float(student_custom_fee)

    if struct_list is None:
        struct_list = await FeeStructure.find_all().to_list()

    student_branch = normalize_branch_name(getattr(student, "branch", ""), getattr(student, "batch", ""))
    student_batch = (getattr(student, "batch", "") or "").strip().lower()
    student_standard = (getattr(student, "standard", "") or "").strip().lower()
    student_year = (getattr(student, "academic_year", "") or "").strip()

    # 1. Exact match (standard, batch, branch, academic_year)
    for s in struct_list:
        if s.standard.strip().lower() == student_standard and s.batch.strip().lower() == student_batch and s.branch == student_branch and s.academic_year == student_year:
            return float(s.total_fee)

    # 2. Match standard, batch, and branch
    for s in struct_list:
        if s.standard.strip().lower() == student_standard and s.batch.strip().lower() == student_batch and s.branch == student_branch:
            return float(s.total_fee)

    # 3. Match batch and branch
    for s in struct_list:
        if s.batch.strip().lower() == student_batch and s.branch == student_branch:
            return float(s.total_fee)

    # 4. Match batch only
    for s in struct_list:
        if s.batch.strip().lower() == student_batch:
            return float(s.total_fee)

    # 5. Match standard and branch
    for s in struct_list:
        if s.standard.strip().lower() == student_standard and s.branch == student_branch:
            return float(s.total_fee)

    # 6. Any match for the campus branch
    for s in struct_list:
        if s.branch == student_branch:
            return float(s.total_fee)

    return 0.0

async def add_fee_payment(payment_in: FeePaymentCreate) -> dict:
    from app.services.student_service import resolve_student, student_matches_branch, student_matches_standard
    student = await resolve_student(payment_in.student_id)
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if getattr(payment_in, 'branch', None):
        if not student_matches_branch(student, payment_in.branch):
            raise HTTPException(status_code=400, detail=f"Student does not belong to branch: {payment_in.branch}")
    if getattr(payment_in, 'standard', None):
        if not student_matches_standard(student, payment_in.standard):
            raise HTTPException(status_code=400, detail=f"Student does not belong to standard: {payment_in.standard}")
        
    # Update total fees if an override was provided in the UI
    if getattr(payment_in, 'total_course_fees_override', None) is not None and payment_in.total_course_fees_override > 0:
        student.total_fees = payment_in.total_course_fees_override
        await student.save()
        
    payment = FeePayment(
        student=student,
        amount_paid=payment_in.amount_paid,
        payment_method=payment_in.payment_method,
        transaction_reference=payment_in.transaction_reference,
        remarks=payment_in.remarks,
        payment_date=datetime.utcnow()
    )
    await payment.insert()
    
    res = await _format_fee_payment(payment)
    
    total_fees = await _lookup_student_fee(student)
    payments = await FeePayment.find(FeePayment.student.id == student.id).to_list()
    total_paid = sum(p.amount_paid for p in payments)
    
    # Sync student record paid_fees and remaining_fees
    student.paid_fees = total_paid
    student.remaining_fees = max(0.0, total_fees - total_paid)
    await student.save()

    res["total_fees"] = total_fees
    res["pending_fees"] = max(0.0, total_fees - total_paid)
    res["cumulative_paid"] = total_paid
    res["current_pending_fees"] = max(0.0, total_fees - total_paid)
    res["original_fees"] = getattr(student, "original_fees", 0.0) or total_fees
    res["discount_amount"] = getattr(student, "discount_amount", 0.0) or 0.0
    res["discount_status"] = getattr(student, "discount_status", "NONE") or "NONE"
    res["discount_approved_by"] = getattr(student, "discount_approved_by", None)
    return res

async def get_all_fee_payments(
    student_id: Optional[str] = None,
    branch: Optional[str] = None,
    standard: Optional[str] = None
) -> list[dict]:
    from app.services.student_service import student_matches_branch, student_matches_standard
    structures = await FeeStructure.find_all().to_list()
    payments = await FeePayment.find_all().to_list()
    
    # Resolve student references
    for p in payments:
        if not isinstance(p.student, Student):
            student_obj = await Student.get(p.student.ref.id)
            p.student = student_obj

    # Group payments by student ID
    student_payments_map = {}
    for p in payments:
        s_id = str(p.student.id) if p.student else "unknown"
        if student_id:
            raw_s_id = str(getattr(p.student, "student_id", ""))
            if s_id != student_id and raw_s_id != student_id:
                continue
        if p.student:
            if branch and not student_matches_branch(p.student, branch):
                continue
            if standard and not student_matches_standard(p.student, standard):
                continue
        if s_id not in student_payments_map:
            student_payments_map[s_id] = []
        student_payments_map[s_id].append(p)

    res = []
    # For each student, sort payments chronologically and calculate running balance
    for s_id, s_payments in student_payments_map.items():
        # Sort payments chronologically by creation timestamp / payment_date
        s_payments.sort(key=lambda p: (getattr(p.id, "generation_time", None) or p.payment_date or datetime.min, str(p.id)))
        
        student_obj = s_payments[0].student if s_payments else None
        total_fees = 0.0
        if student_obj:
            total_fees = await _lookup_student_fee(student_obj, structures)
        
        total_student_paid = sum(p.amount_paid for p in s_payments)
        current_overall_pending = max(0.0, total_fees - total_student_paid)

        running_paid = 0.0
        for p in s_payments:
            running_paid += p.amount_paid
            pending_after_this_payment = max(0.0, total_fees - running_paid)

            formatted = await _format_fee_payment(p)
            if student_obj:
                formatted["original_fees"] = getattr(student_obj, "original_fees", 0.0) or total_fees
                formatted["discount_amount"] = getattr(student_obj, "discount_amount", 0.0) or 0.0
                formatted["discount_status"] = getattr(student_obj, "discount_status", "NONE") or "NONE"
                formatted["discount_approved_by"] = getattr(student_obj, "discount_approved_by", None)

            formatted["total_fees"] = total_fees
            formatted["pending_fees"] = pending_after_this_payment
            formatted["cumulative_paid"] = running_paid
            formatted["current_pending_fees"] = current_overall_pending
            res.append(formatted)
        
    return res

async def get_fee_details(
    student_id: str,
    branch: Optional[str] = None,
    standard: Optional[str] = None
) -> FeeDetailsResponse:
    from app.services.student_service import resolve_student, student_matches_branch, student_matches_standard
    student = await resolve_student(student_id)
        
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if branch and not student_matches_branch(student, branch):
        raise HTTPException(status_code=400, detail=f"Student does not belong to selected branch: {branch}")
    if standard and not student_matches_standard(student, standard):
        raise HTTPException(status_code=400, detail=f"Student does not belong to selected standard: {standard}")
        
    # Get all payments
    payments = await FeePayment.find(FeePayment.student.id == student.id).to_list()
    total_paid = sum(p.amount_paid for p in payments)
    
    total_fees = await _lookup_student_fee(student)
    pending_fees = max(0.0, total_fees - total_paid)
    
    return FeeDetailsResponse(
        student_id=str(student.id),
        total_fees=total_fees,
        amount_paid=total_paid,
        pending_fees=pending_fees,
        original_fees=getattr(student, "original_fees", 0.0) or total_fees,
        discount_amount=getattr(student, "discount_amount", 0.0) or 0.0,
        discount_reason=getattr(student, "discount_reason", None),
        discount_status=getattr(student, "discount_status", "NONE") or "NONE",
        discount_offered_by=getattr(student, "discount_offered_by", None),
        discount_approved_by=getattr(student, "discount_approved_by", None),
        discount_approved_at=getattr(student, "discount_approved_at", None)
    )

async def get_pending_fees() -> list[PendingFeeResponse]:
    students = await Student.find_all().to_list()
    structures = await FeeStructure.find_all().to_list()
    payments = await FeePayment.find_all().to_list()
    
    paid_map = {}
    for p in payments:
        if not isinstance(p.student, Student):
            student_obj = await Student.get(p.student.ref.id)
            p.student = student_obj
        if p.student:
            s_id = str(p.student.id)
            paid_map[s_id] = paid_map.get(s_id, 0.0) + p.amount_paid
            
    pending_list = []
    for student in students:
        total_fees = await _lookup_student_fee(student, structures)
        amount_paid = paid_map.get(str(student.id), 0.0)
        pending_fees = max(0.0, total_fees - amount_paid)
        
        if pending_fees > 0:
            student_name = ""
            if student.user:
                if hasattr(student.user, "full_name"):
                    student_name = student.user.full_name
                else:
                    from app.models.user import User
                    user_obj = await User.get(student.user.ref.id)
                    student.user = user_obj
                    if student.user:
                        student_name = student.user.full_name
                        
            pending_list.append(PendingFeeResponse(
                student_id=str(student.id),
                student_name=student_name,
                standard=student.standard or "12th Science",
                batch=student.batch or "General",
                branch=normalize_branch_name(student.branch, student.batch),
                total_fees=total_fees,
                amount_paid=amount_paid,
                pending_fees=pending_fees
            ))
            
    return pending_list
