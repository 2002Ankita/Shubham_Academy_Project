from app.models.fees import FeePayment, FeeStructure
from app.models.student import Student
from app.schemas.fees import FeePaymentCreate, FeeDetailsResponse, FeeStructureCreate, PendingFeeResponse
from fastapi import HTTPException
from bson import ObjectId

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
        "payment_date": payment.payment_date
    }

async def create_fee_structure(structure_in: FeeStructureCreate) -> dict:
    structure = FeeStructure(**structure_in.dict())
    await structure.insert()
    res = structure_in.dict()
    res["id"] = str(structure.id)
    return res

async def get_fee_structures() -> list[dict]:
    structures = await FeeStructure.find_all().to_list()
    res = []
    for s in structures:
        d = s.dict()
        d["id"] = str(s.id)
        res.append(d)
    return res

async def add_fee_payment(payment_in: FeePaymentCreate) -> dict:
    from app.services.student_service import resolve_student
    student = await resolve_student(payment_in.student_id)
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Update total fees if an override was provided in the UI
    if getattr(payment_in, 'total_course_fees_override', None) is not None and payment_in.total_course_fees_override > 0:
        student.total_fees = payment_in.total_course_fees_override
        await student.save()
        
    payment = FeePayment(
        student=student,
        amount_paid=payment_in.amount_paid,
        payment_method=payment_in.payment_method,
        transaction_reference=payment_in.transaction_reference,
        remarks=payment_in.remarks
    )
    await payment.insert()
    
    res = await _format_fee_payment(payment)
    
    # Calculate total and pending fees for response
    student_custom_fee = getattr(student, 'total_fees', 0.0)
    if student_custom_fee > 0:
        total_fees = student_custom_fee
    else:
        structure = await FeeStructure.find_one(
            FeeStructure.standard == student.standard,
            FeeStructure.batch == student.batch,
            FeeStructure.branch == student.branch,
            FeeStructure.academic_year == student.academic_year
        )
        total_fees = structure.total_fee if structure else 0.0
        
    payments = await FeePayment.find({"student.$id": student.id}).to_list()
    total_paid = sum(p.amount_paid for p in payments)
    
    res["total_fees"] = total_fees
    res["pending_fees"] = total_fees - total_paid
    return res

async def get_all_fee_payments() -> list[dict]:
    structures = await FeeStructure.find_all().to_list()
    struct_map = {}
    for s in structures:
        struct_map[(s.standard, s.batch, s.branch, s.academic_year)] = s.total_fee

    payments = await FeePayment.find_all().to_list()
    
    paid_map = {}
    for p in payments:
        if not isinstance(p.student, Student):
            student_obj = await Student.get(p.student.ref.id)
            p.student = student_obj
        if p.student:
            s_id = str(p.student.id)
            paid_map[s_id] = paid_map.get(s_id, 0.0) + p.amount_paid

    res = []
    for p in payments:
        formatted = await _format_fee_payment(p)
        total_fees = 0.0
        pending_fees = 0.0
        
        if p.student:
            student_custom_fee = getattr(p.student, 'total_fees', 0.0)
            if student_custom_fee > 0:
                total_fees = student_custom_fee
            else:
                total_fees = struct_map.get((p.student.standard, p.student.batch, p.student.branch, p.student.academic_year), 0.0)
            # The pending fee is the total minus total paid across all payments for this student
            total_paid = paid_map.get(str(p.student.id), 0.0)
            pending_fees = total_fees - total_paid

        formatted["total_fees"] = total_fees
        formatted["pending_fees"] = pending_fees
        res.append(formatted)
        
    return res

async def get_fee_details(student_id: str) -> FeeDetailsResponse:
    from app.services.student_service import resolve_student
    student = await resolve_student(student_id)
        
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Get all payments
    payments = await FeePayment.find({"student.$id": student.id}).to_list()
    total_paid = sum(p.amount_paid for p in payments)
    
    # Fetch real fee structure or use custom total_fees
    student_custom_fee = getattr(student, 'total_fees', 0.0)
    if student_custom_fee > 0:
        total_fees = student_custom_fee
    else:
        structure = await FeeStructure.find_one(
            FeeStructure.standard == student.standard,
            FeeStructure.batch == student.batch,
            FeeStructure.branch == student.branch,
            FeeStructure.academic_year == student.academic_year
        )
        total_fees = structure.total_fee if structure else 0.0
        
    pending_fees = total_fees - total_paid
    
    return FeeDetailsResponse(
        student_id=str(student.id),
        total_fees=total_fees,
        amount_paid=total_paid,
        pending_fees=pending_fees
    )

async def get_pending_fees() -> list[PendingFeeResponse]:
    students = await Student.find_all().to_list()
    structures = await FeeStructure.find_all().to_list()
    payments = await FeePayment.find_all().to_list()
    
    # Map structures by (standard, batch, branch, academic_year)
    struct_map = {}
    for s in structures:
        struct_map[(s.standard, s.batch, s.branch, s.academic_year)] = s.total_fee
        
    # Map payments by student_id
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
        student_custom_fee = getattr(student, 'total_fees', 0.0)
        if student_custom_fee > 0:
            total_fees = student_custom_fee
        else:
            total_fees = struct_map.get((student.standard, student.batch, student.branch, student.academic_year), 0.0)
            
        amount_paid = paid_map.get(str(student.id), 0.0)
        pending_fees = total_fees - amount_paid
        
        if pending_fees > 0:
            if not getattr(student, "user", None):
                # We need user name
                pass
            
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
                standard=student.standard,
                batch=student.batch,
                branch=student.branch,
                total_fees=total_fees,
                amount_paid=amount_paid,
                pending_fees=pending_fees
            ))
            
    return pending_list
