from app.models.marks import Exam, Mark
from app.models.student import Student
from app.models.teacher import Teacher
from app.schemas.marks import ExamCreate, MarkCreate
from fastapi import HTTPException
from bson import ObjectId

async def _format_exam(exam: Exam) -> dict:
    teacher_obj = None
    if isinstance(exam.teacher, Teacher):
        teacher_obj = exam.teacher
    elif getattr(exam, 'teacher', None):
        teacher_obj = await Teacher.get(exam.teacher.ref.id)
        exam.teacher = teacher_obj
        
    return {
        "id": str(exam.id),
        "exam_name": exam.exam_name,
        "standard": exam.standard,
        "batch": exam.batch,
        "branch": exam.branch,
        "subject": exam.subject,
        "exam_date": exam.exam_date,
        "start_time": exam.start_time,
        "end_time": exam.end_time,
        "max_marks": exam.max_marks,
        "passing_marks": exam.passing_marks,
        "teacher_id": str(exam.teacher.id) if exam.teacher else "",
        "status": getattr(exam, "status", "Scheduled")
    }

async def _format_mark(mark: Mark) -> dict:
    exam_obj = None
    if isinstance(mark.exam, Exam):
        exam_obj = mark.exam
    elif getattr(mark, 'exam', None):
        exam_obj = await Exam.get(mark.exam.ref.id)
        mark.exam = exam_obj

    student_obj = None
    if isinstance(mark.student, Student):
        student_obj = mark.student
    elif getattr(mark, 'student', None):
        student_obj = await Student.get(mark.student.ref.id)
        mark.student = student_obj
        
    pass_status = False
    grade = "F"
    if mark.exam:
        pass_status = mark.marks_obtained >= mark.exam.passing_marks
        pct = (mark.marks_obtained / mark.exam.max_marks) * 100 if mark.exam.max_marks > 0 else 0
        if pct >= 90: grade = "A+"
        elif pct >= 80: grade = "A"
        elif pct >= 70: grade = "B"
        elif pct >= 60: grade = "C"
        elif pct >= 50: grade = "D"
        else: grade = "F"
        
    student_name = ""
    roll_number = ""
    if student_obj:
        roll_number = student_obj.student_id
        if getattr(student_obj, "user", None):
            from app.models.user import User
            user_obj = student_obj.user if isinstance(student_obj.user, User) else await User.get(student_obj.user.ref.id)
            if user_obj:
                student_name = user_obj.full_name

    exam_date_str = ""
    teacher_name = ""
    if exam_obj:
        if getattr(exam_obj, 'exam_date', None):
            try:
                exam_date_str = exam_obj.exam_date.strftime("%Y-%m-%d")
            except Exception:
                exam_date_str = str(exam_obj.exam_date).split("T")[0]
        if getattr(exam_obj, 'teacher', None):
            try:
                teacher_obj = None
                if isinstance(exam_obj.teacher, Teacher):
                    teacher_obj = exam_obj.teacher
                elif getattr(exam_obj.teacher, 'ref', None):
                    teacher_obj = await Teacher.get(exam_obj.teacher.ref.id)
                elif getattr(exam_obj.teacher, 'id', None):
                    teacher_obj = await Teacher.get(exam_obj.teacher.id)

                if teacher_obj and getattr(teacher_obj, 'user', None):
                    from app.models.user import User
                    user_t = teacher_obj.user if isinstance(teacher_obj.user, User) else await User.get(teacher_obj.user.ref.id) if getattr(teacher_obj.user, 'ref', None) else None
                    if user_t and user_t.full_name:
                        teacher_name = user_t.full_name
            except Exception:
                pass

    return {
        "id": str(mark.id),
        "student_id": str(mark.student.id) if mark.student else "",
        "student_name": student_name,
        "roll_number": roll_number,
        "exam_id": str(mark.exam.id) if mark.exam else "",
        "exam_name": exam_obj.exam_name if exam_obj else "",
        "subject": exam_obj.subject if exam_obj else "",
        "max_marks": exam_obj.max_marks if exam_obj else 100,
        "marks_obtained": mark.marks_obtained,
        "remarks": mark.remarks,
        "grade": grade,
        "pass_status": pass_status,
        "exam_date": exam_date_str,
        "teacher": teacher_name or "Faculty"
    }

async def create_exam(exam_in: ExamCreate) -> dict:
    from app.services.teacher_service import resolve_teacher
    teacher = await resolve_teacher(exam_in.teacher_id)
        
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
        
    exam = Exam(
        exam_name=exam_in.exam_name,
        standard=exam_in.standard,
        batch=exam_in.batch,
        branch=exam_in.branch,
        subject=exam_in.subject,
        exam_date=exam_in.exam_date,
        start_time=exam_in.start_time,
        end_time=exam_in.end_time,
        max_marks=exam_in.max_marks,
        passing_marks=exam_in.passing_marks,
        teacher=teacher
    )
    await exam.insert()
    return await _format_exam(exam)

async def get_all_exams() -> list[dict]:
    exams = await Exam.find_all().to_list()
    return [await _format_exam(e) for e in exams]

async def enter_marks(mark_in: MarkCreate) -> dict:
    from app.services.student_service import resolve_student
    student = await resolve_student(mark_in.student_id)
    try:
        exam = await Exam.get(ObjectId(mark_in.exam_id))
    except Exception:
        exam = None
    
    if not student or not exam:
        raise HTTPException(status_code=404, detail="Student or Exam not found")
        
    if mark_in.marks_obtained > exam.max_marks:
        raise HTTPException(status_code=400, detail="Marks cannot exceed maximum marks")
        
    mark = Mark(
        student=student,
        exam=exam,
        marks_obtained=mark_in.marks_obtained,
        remarks=mark_in.remarks
    )
    await mark.insert()
    return await _format_mark(mark)

async def get_student_results(student_id: str) -> list[dict]:
    from app.services.student_service import resolve_student
    student = await resolve_student(student_id)
        
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    marks = await Mark.find(Mark.student.id == student.id).to_list()
    return [await _format_mark(m) for m in marks]

async def get_all_marks() -> list[dict]:
    marks = await Mark.find_all().to_list()
    return [await _format_mark(m) for m in marks]

async def delete_exam(id: str):
    from bson.errors import InvalidId
    from bson import ObjectId
    try:
        exam = await Exam.get(ObjectId(id))
        if exam:
            await exam.delete()
    except InvalidId:
        pass

async def update_exam(id: str, exam_in: dict) -> dict:
    from bson.errors import InvalidId
    from bson import ObjectId
    try:
        exam = await Exam.get(ObjectId(id))
        if exam:
            if "status" in exam_in:
                exam.status = exam_in["status"]
            if "exam_name" in exam_in:
                exam.exam_name = exam_in["exam_name"]
            await exam.save()
            return await _format_exam(exam)
    except InvalidId:
        pass
    raise Exception("Exam not found")
