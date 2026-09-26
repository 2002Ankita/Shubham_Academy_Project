from app.models.fees import FeePayment, FeeStructure
from app.models.student import Student
from app.schemas.fees import FeePaymentCreate, FeeDetailsResponse, FeeStructureCreate, PendingFeeResponse
from fastapi import HTTPException
from bson import ObjectId

async def _format_fee_payment(payment: FeePayment) -> dict:
    student_id_str = ""
    if isinstance(payment.student, Student):
        student_id_str = str(payment.student.id)
    elif payment.student:
        student_id_str = str(getattr(payment.student, 'ref', payment.student).id)
        
    return {
        "id": str(payment.id),
        "student_id": student_id_str,
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
    try:
        student = await Student.get(ObjectId(payment_in.student_id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student ID")
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    payment = FeePayment(
        student=student,
        amount_paid=payment_in.amount_paid,
        payment_method=payment_in.payment_method,
        transaction_reference=payment_in.transaction_reference,
        remarks=payment_in.remarks
    )
    await payment.insert()
    return await _format_fee_payment(payment)

async def get_all_fee_payments() -> list[dict]:
    payments = await FeePayment.find_all().to_list()
    return [await _format_fee_payment(p) for p in payments]

async def get_fee_details(student_id: str) -> FeeDetailsResponse:
    try:
        student = await Student.get(ObjectId(student_id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student ID")
        
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Get all payments
    payments = await FeePayment.find(FeePayment.student.id == student.id).to_list()
    total_paid = sum(p.amount_paid for p in payments)
    
    # Fetch real fee structure
    structure = await FeeStructure.find_one(
        FeeStructure.course == student.course,
        FeeStructure.batch == student.batch,
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
    
    # Map structures by (course, batch, academic_year)
    struct_map = {}
    for s in structures:
        struct_map[(s.course, s.batch, s.academic_year)] = s.total_fee
        
    # Map payments by student_id
    paid_map = {}
    for p in payments:
        if not isinstance(p.student, Student):
            await p.fetch_link(FeePayment.student)
        if p.student:
            s_id = str(p.student.id)
            paid_map[s_id] = paid_map.get(s_id, 0.0) + p.amount_paid
            
    pending_list = []
    for student in students:
        total_fees = struct_map.get((student.course, student.batch, student.academic_year), 0.0)
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
                    await student.fetch_link(Student.user)
                    if student.user:
                        student_name = student.user.full_name
                        
            pending_list.append(PendingFeeResponse(
                student_id=str(student.id),
                student_name=student_name,
                course=student.course,
                batch=student.batch,
                total_fees=total_fees,
                amount_paid=amount_paid,
                pending_fees=pending_fees
            ))
            
    return pending_list
