from app.models.marks import Exam, Mark
from app.models.student import Student
from app.models.teacher import Teacher
from app.schemas.marks import ExamCreate, MarkCreate
from fastapi import HTTPException
from bson import ObjectId

async def _format_exam(exam: Exam) -> dict:
    if not getattr(exam, 'teacher', None) or not isinstance(exam.teacher, Teacher):
        await exam.fetch_link(Exam.teacher)
    return {
        "id": str(exam.id),
        "exam_name": exam.exam_name,
        "course": exam.course,
        "batch": exam.batch,
        "subject": exam.subject,
        "exam_date": exam.exam_date,
        "start_time": exam.start_time,
        "end_time": exam.end_time,
        "max_marks": exam.max_marks,
        "passing_marks": exam.passing_marks,
        "teacher_id": str(exam.teacher.id) if exam.teacher else ""
    }

async def _format_mark(mark: Mark) -> dict:
    if not getattr(mark, 'exam', None) or not isinstance(mark.exam, Exam):
        await mark.fetch_link(Mark.exam)
    if not getattr(mark, 'student', None) or not isinstance(mark.student, Student):
        await mark.fetch_link(Mark.student)
        
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
        
    return {
        "id": str(mark.id),
        "student_id": str(mark.student.id) if mark.student else "",
        "exam_id": str(mark.exam.id) if mark.exam else "",
        "marks_obtained": mark.marks_obtained,
        "remarks": mark.remarks,
        "grade": grade,
        "pass_status": pass_status
    }

async def create_exam(exam_in: ExamCreate) -> dict:
    try:
        teacher = await Teacher.get(ObjectId(exam_in.teacher_id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid teacher ID")
        
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
        
    exam = Exam(
        exam_name=exam_in.exam_name,
        course=exam_in.course,
        batch=exam_in.batch,
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
    try:
        student = await Student.get(ObjectId(mark_in.student_id))
        exam = await Exam.get(ObjectId(mark_in.exam_id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID")
    
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
    try:
        student = await Student.get(ObjectId(student_id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student ID")
        
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    marks = await Mark.find(Mark.student.id == student.id, fetch_links=True).to_list()
    return [await _format_mark(m) for m in marks]

async def get_all_marks() -> list[dict]:
    marks = await Mark.find_all(fetch_links=True).to_list()
    return [await _format_mark(m) for m in marks]
