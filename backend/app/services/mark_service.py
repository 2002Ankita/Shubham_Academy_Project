from datetime import datetime
from app.models.marks import Exam, Mark
from app.models.student import Student
from app.models.teacher import Teacher
from app.schemas.marks import BulkMarkCreate, ExamCreate, MarkCreate
from fastapi import HTTPException
from bson import ObjectId

def _calculate_duration(start_time: datetime, end_time: datetime) -> str:
    diff_seconds = (end_time - start_time).total_seconds()
    if diff_seconds <= 0:
        return "1 Hour"
    hours = int(diff_seconds // 3600)
    mins = int((diff_seconds % 3600) // 60)
    if mins == 0:
        return f"{hours} {'Hour' if hours == 1 else 'Hours'}"
    elif hours == 0:
        return f"{mins} Mins"
    else:
        return f"{hours}h {mins}m"

async def _check_room_conflict(room_no: str, exam_date: datetime, start_time: datetime, end_time: datetime, current_exam_id: str = None):
    room_clean = (room_no or "").strip()
    if not room_clean:
        return
    all_exams = await Exam.find_all().to_list()
    target_date = exam_date.date() if isinstance(exam_date, datetime) else None
    target_start = start_time.time() if isinstance(start_time, datetime) else None
    target_end = end_time.time() if isinstance(end_time, datetime) else None

    for ex in all_exams:
        if current_exam_id and str(ex.id) == current_exam_id:
            continue
        if getattr(ex, "status", "") == "Cancelled":
            continue
        ex_room = (getattr(ex, "room_no", "") or "").strip()
        if ex_room.lower() != room_clean.lower():
            continue
        ex_date = ex.exam_date.date() if isinstance(ex.exam_date, datetime) else None
        if ex_date != target_date:
            continue
        ex_start = ex.start_time.time() if isinstance(ex.start_time, datetime) else None
        ex_end = ex.end_time.time() if isinstance(ex.end_time, datetime) else None

        if ex_start and ex_end and target_start and target_end:
            if target_start < ex_end and target_end > ex_start:
                raise HTTPException(status_code=400, detail=f"{room_clean} is already booked during this time.")

def _parse_dt(val):
    if isinstance(val, datetime):
        return val
    if isinstance(val, str) and val:
        clean_val = val.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(clean_val)
        except Exception:
            pass
    return None

async def _format_exam(exam: Exam) -> dict:
    teacher_obj = None
    if isinstance(exam.teacher, Teacher):
        teacher_obj = exam.teacher
    elif getattr(exam, 'teacher', None):
        teacher_obj = await Teacher.get(exam.teacher.ref.id)
        exam.teacher = teacher_obj
        
    teacher_name = ""
    if teacher_obj and getattr(teacher_obj, "user", None):
        try:
            from app.models.user import User
            user_t = teacher_obj.user if isinstance(teacher_obj.user, User) else await User.get(teacher_obj.user.ref.id) if getattr(teacher_obj.user, "ref", None) else None
            if user_t and getattr(user_t, "full_name", None):
                teacher_name = user_t.full_name
        except Exception:
            pass

    raw_status = getattr(exam, "status", "Scheduled")
    computed_status = raw_status
    if raw_status != "Cancelled" and exam.start_time and exam.end_time:
        if exam.end_time.tzinfo is not None:
            from datetime import timezone
            now = datetime.now(timezone.utc)
        else:
            now = datetime.now()
        if now > exam.end_time:
            computed_status = "Completed"
        elif now >= exam.start_time and now <= exam.end_time:
            computed_status = "Ongoing"
        else:
            computed_status = "Scheduled"

    return {
        "id": str(exam.id),
        "exam_name": exam.exam_name,
        "exam_type": getattr(exam, "exam_type", "Regular"),
        "standard": exam.standard,
        "section": getattr(exam, "section", ""),
        "batch": exam.batch,
        "branch": exam.branch,
        "subject": exam.subject,
        "exam_date": exam.exam_date,
        "start_time": exam.start_time,
        "end_time": exam.end_time,
        "duration": getattr(exam, "duration", "2 Hours"),
        "room_no": getattr(exam, "room_no", "Room 101"),
        "max_marks": exam.max_marks,
        "passing_marks": exam.passing_marks,
        "teacher_id": str(exam.teacher.id) if exam.teacher else "",
        "teacher_name": teacher_name,
        "status": computed_status
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

    student_id_val = ""
    if student_obj:
        student_id_val = str(student_obj.id)
    elif getattr(getattr(mark, 'student', None), 'ref', None):
        student_id_val = str(mark.student.ref.id)
    elif getattr(mark, 'student', None) and hasattr(mark.student, 'id'):
        student_id_val = str(mark.student.id)

    exam_id_val = ""
    if exam_obj:
        exam_id_val = str(exam_obj.id)
    elif getattr(getattr(mark, 'exam', None), 'ref', None):
        exam_id_val = str(mark.exam.ref.id)
    elif getattr(mark, 'exam', None) and hasattr(mark.exam, 'id'):
        exam_id_val = str(mark.exam.id)

    return {
        "id": str(mark.id),
        "student_id": student_id_val,
        "student_name": student_name,
        "roll_number": roll_number,
        "exam_id": exam_id_val,
        "exam_name": exam_obj.exam_name if exam_obj else "",
        "subject": exam_obj.subject if exam_obj else "",
        "max_marks": exam_obj.max_marks if exam_obj else 100,
        "marks_obtained": mark.marks_obtained,
        "remarks": mark.remarks,
        "status": getattr(mark, "status", "Published") or "Published",
        "grade": grade,
        "pass_status": pass_status,
        "exam_date": exam_date_str,
        "teacher": teacher_name or "Faculty"
    }

async def create_exam(exam_in: ExamCreate, user=None) -> dict:
    from app.services.teacher_service import resolve_teacher
    teacher = None
    if exam_in.teacher_id:
        teacher = await resolve_teacher(exam_in.teacher_id)
    if not teacher and user:
        teacher = await resolve_teacher(str(user.id))
    if not teacher:
        teachers = await Teacher.find_all().to_list()
        teacher = teachers[0] if teachers else None
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    if exam_in.start_time >= exam_in.end_time:
        raise HTTPException(status_code=400, detail="End time must be later than start time.")

    room = (exam_in.room_no or "Room 101").strip()
    await _check_room_conflict(room, exam_in.exam_date, exam_in.start_time, exam_in.end_time)

    duration = exam_in.duration or _calculate_duration(exam_in.start_time, exam_in.end_time)

    exam = Exam(
        exam_name=exam_in.exam_name,
        exam_type=exam_in.exam_type or "Regular",
        standard=exam_in.standard,
        section=exam_in.section or "",
        batch=exam_in.batch or exam_in.section or "General",
        branch=exam_in.branch or "Tarabai Park",
        subject=exam_in.subject,
        exam_date=exam_in.exam_date,
        start_time=exam_in.start_time,
        end_time=exam_in.end_time,
        duration=duration,
        room_no=room,
        max_marks=exam_in.max_marks,
        passing_marks=exam_in.passing_marks or 35.0,
        teacher=teacher,
        status="Scheduled"
    )
    await exam.insert()

    # Automatically notify teachers and students about the newly scheduled examination
    try:
        from app.models.notices import Notice
        admin_user = teacher.user if getattr(teacher, "user", None) else None
        if admin_user and getattr(admin_user, "ref", None):
            from app.models.user import User
            admin_user = await User.get(admin_user.ref.id)

        date_str = exam.exam_date.strftime("%d %b %Y") if hasattr(exam.exam_date, "strftime") else str(exam.exam_date).split("T")[0]
        notice = Notice(
            title=f"Scheduled Examination: {exam.exam_name}",
            content=f"An examination '{exam.exam_name}' for {exam.subject} ({exam.standard}) has been scheduled on {date_str}. Teachers and students can track timetable and marks under Examinations.",
            target_audiences=["TEACHER", "STUDENT", "ALL"],
            target_batches=[exam.batch] if exam.batch else [],
            category="Examinations",
            priority="High",
            created_by=admin_user or teacher.user
        )
        await notice.insert()

        # Dispatch SMS alert to assigned Teacher
        if teacher and getattr(teacher, "mobile_number", None):
            try:
                from app.services.notification_service import notification_service
                t_name = ""
                if getattr(teacher, "user", None):
                    from app.models.user import User
                    t_user = teacher.user if isinstance(teacher.user, User) else await User.get(teacher.user.ref.id)
                    t_name = getattr(t_user, "full_name", "") if t_user else ""
                sms_text = notification_service.build_teacher_exam_schedule_alert(
                    teacher_name=t_name or "Faculty",
                    exam_name=exam.exam_name,
                    subject=exam.subject,
                    standard=exam.standard,
                    date_str=date_str
                )
                await notification_service.send_sms(teacher.mobile_number, sms_text)
            except Exception as e:
                print(f"Teacher exam SMS alert skipped: {e}")
    except Exception as e:
        print(f"Notice creation for scheduled exam skipped: {e}")

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
        
    if mark_in.marks_obtained < 0:
        raise HTTPException(status_code=400, detail="Marks cannot be negative")
    if mark_in.marks_obtained > exam.max_marks:
        raise HTTPException(status_code=400, detail=f"Marks cannot exceed maximum marks of {exam.max_marks}")
        
    status_val = getattr(mark_in, "status", "Published") or "Published"

    # Check for existing mark to prevent duplicate records and support editing drafts
    existing_mark = await Mark.find_one(
        Mark.student.id == student.id,
        Mark.exam.id == exam.id
    )
    if existing_mark:
        existing_mark.marks_obtained = mark_in.marks_obtained
        existing_mark.remarks = mark_in.remarks or ""
        existing_mark.status = status_val
        await existing_mark.save()
        return await _format_mark(existing_mark)

    mark = Mark(
        student=student,
        exam=exam,
        marks_obtained=mark_in.marks_obtained,
        remarks=mark_in.remarks or "",
        status=status_val
    )
    await mark.insert()
    return await _format_mark(mark)

async def enter_bulk_marks(marks_in: BulkMarkCreate) -> list[dict]:
    from app.services.student_service import resolve_student

    student_ids = [entry.student_id for entry in marks_in.entries]
    if len(student_ids) != len(set(student_ids)):
        raise HTTPException(status_code=400, detail="A student can only be included once per exam")

    try:
        exam = await Exam.get(ObjectId(marks_in.exam_id))
    except Exception:
        exam = None
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    students_and_entries = []
    resolved_student_ids = set()
    for entry in marks_in.entries:
        student = await resolve_student(entry.student_id)
        if not student:
            raise HTTPException(status_code=404, detail=f"Student not found: {entry.student_id}")
        if student.id in resolved_student_ids:
            raise HTTPException(status_code=400, detail="A student can only be included once per exam")
        resolved_student_ids.add(student.id)
        if entry.marks_obtained < 0:
            raise HTTPException(
                status_code=400,
                detail=f"Marks for student {entry.student_id} cannot be negative",
            )
        if entry.marks_obtained > exam.max_marks:
            raise HTTPException(
                status_code=400,
                detail=f"Marks for student {entry.student_id} cannot exceed {exam.max_marks}",
            )
        students_and_entries.append((student, entry))

    status_to_set = getattr(marks_in, "status", "Published") or "Published"
    saved_marks = []
    for student, entry in students_and_entries:
        existing_marks = await Mark.find(
            Mark.student.id == student.id,
            Mark.exam.id == exam.id,
        ).to_list()
        entry_status = getattr(entry, "status", None) or status_to_set
        if existing_marks:
            mark = existing_marks[0]
            mark.marks_obtained = entry.marks_obtained
            mark.remarks = entry.remarks or ""
            mark.status = entry_status
            await mark.save()
        else:
            mark = Mark(
                student=student,
                exam=exam,
                marks_obtained=entry.marks_obtained,
                remarks=entry.remarks or "",
                status=entry_status
            )
            await mark.insert()
        saved_marks.append(await _format_mark(mark))

    return saved_marks

async def get_student_results(student_id: str) -> list[dict]:
    from app.services.student_service import resolve_student
    student = await resolve_student(student_id)
        
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    marks = await Mark.find(Mark.student.id == student.id).to_list()
    # Student portal should only view Published marks, not drafts
    return [await _format_mark(m) for m in marks if getattr(m, "status", "Published") != "Draft"]

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
            return
    except InvalidId:
        pass
    raise HTTPException(status_code=404, detail="Exam not found")

async def update_exam(id: str, exam_in: dict, user=None) -> dict:
    from bson.errors import InvalidId
    from bson import ObjectId
    try:
        exam = await Exam.get(ObjectId(id))
    except (InvalidId, Exception):
        exam = None
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    new_exam_date = _parse_dt(exam_in.get("exam_date")) if "exam_date" in exam_in else exam.exam_date
    new_start_time = _parse_dt(exam_in.get("start_time")) if "start_time" in exam_in else exam.start_time
    new_end_time = _parse_dt(exam_in.get("end_time")) if "end_time" in exam_in else exam.end_time
    new_room = exam_in.get("room_no") if "room_no" in exam_in else getattr(exam, "room_no", "Room 101")

    if new_start_time and new_end_time:
        if new_start_time >= new_end_time:
            raise HTTPException(status_code=400, detail="End time must be later than start time.")

    if new_room and new_exam_date and new_start_time and new_end_time:
        await _check_room_conflict(new_room, new_exam_date, new_start_time, new_end_time, current_exam_id=str(exam.id))

    if "exam_name" in exam_in: exam.exam_name = exam_in["exam_name"]
    if "exam_type" in exam_in: exam.exam_type = exam_in["exam_type"]
    if "standard" in exam_in: exam.standard = exam_in["standard"]
    if "section" in exam_in: exam.section = exam_in["section"]
    if "batch" in exam_in: exam.batch = exam_in["batch"]
    if "branch" in exam_in: exam.branch = exam_in["branch"]
    if "subject" in exam_in: exam.subject = exam_in["subject"]
    if new_exam_date: exam.exam_date = new_exam_date
    if new_start_time: exam.start_time = new_start_time
    if new_end_time: exam.end_time = new_end_time
    if "duration" in exam_in:
        exam.duration = exam_in["duration"]
    elif new_start_time and new_end_time:
        exam.duration = _calculate_duration(new_start_time, new_end_time)
    if new_room: exam.room_no = new_room
    if "max_marks" in exam_in: exam.max_marks = float(exam_in["max_marks"])
    if "passing_marks" in exam_in: exam.passing_marks = float(exam_in["passing_marks"])
    if "status" in exam_in: exam.status = exam_in["status"]

    await exam.save()
    return await _format_exam(exam)

async def send_marks_notifications(user, req) -> dict:
    from app.services.notification_service import notification_service
    from app.models.audit_log import NotificationAuditLog
    from app.models.user import User
    from app.models.student import Student
    from bson import ObjectId

    try:
        exam = await Exam.get(ObjectId(req.exam_id))
    except Exception:
        exam = None
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    all_marks = await Mark.find_all().to_list()
    exam_marks = [
        m for m in all_marks
        if (
            (
                (getattr(m.exam, "id", None) == exam.id) or
                (getattr(getattr(m.exam, "ref", None), "id", None) == exam.id)
            )
            and getattr(m, "status", "Published") != "Draft"
        )
    ]

    if not exam_marks:
        raise HTTPException(status_code=400, detail="No published marks recorded for this examination yet")

    results = []
    summary = {
        "total": 0,
        "sent": 0,
        "failed": 0,
        "unconfigured": 0,
        "missing_phone": 0
    }

    selected_student_ids = set(req.student_ids) if req.student_ids else None

    for mark in exam_marks:
        student_obj = None
        if isinstance(mark.student, Student):
            student_obj = mark.student
        elif getattr(mark, 'student', None) and getattr(mark.student, 'ref', None):
            student_obj = await Student.get(mark.student.ref.id)
        elif getattr(mark, 'student', None) and getattr(mark.student, 'id', None):
            student_obj = await Student.get(mark.student.id)

        if not student_obj:
            continue

        stu_id_str = str(student_obj.id)
        if selected_student_ids and (stu_id_str not in selected_student_ids and getattr(student_obj, "student_id", "") not in selected_student_ids):
            continue

        summary["total"] += 1

        student_name = ""
        if getattr(student_obj, "user", None):
            user_obj = student_obj.user if isinstance(student_obj.user, User) else await User.get(student_obj.user.ref.id)
            if user_obj:
                student_name = user_obj.full_name
        if not student_name:
            student_name = getattr(student_obj, "student_id", "Student")

        parent_name = getattr(student_obj, "parent_name", "") or "Parent"
        parent_mobile = getattr(student_obj, "parent_mobile", "") or getattr(student_obj, "mobile_number", "") or ""
        masked_mobile = notification_service.mask_phone(parent_mobile)

        max_marks = exam.max_marks if exam.max_marks > 0 else 100
        percentage = (mark.marks_obtained / max_marks) * 100

        grade = "F"
        if percentage >= 90: grade = "A+"
        elif percentage >= 80: grade = "A"
        elif percentage >= 70: grade = "B"
        elif percentage >= 60: grade = "C"
        elif percentage >= 50: grade = "D"
        else: grade = "F"

        roll_number = getattr(student_obj, "student_id", "") or ""
        remarks_val = getattr(mark, "remarks", "") or ""

        msg = notification_service.build_marks_message(
            student_name=student_name,
            marks_obtained=mark.marks_obtained,
            max_marks=max_marks,
            subject=req.subject or exam.subject,
            exam_name=exam.exam_name,
            percentage=percentage,
            roll_number=roll_number,
            grade=grade,
            remarks=remarks_val
        )

        if req.channel == "whatsapp":
            dispatch_result = await notification_service.send_whatsapp(parent_mobile, msg)
        else:
            dispatch_result = await notification_service.send_sms(parent_mobile, msg)

        status_key = dispatch_result.get("status", "failed")
        if status_key in summary:
            summary[status_key] += 1
        else:
            summary["failed"] += 1

        audit_entry = NotificationAuditLog(
            teacher_id=str(user.id),
            teacher_name=getattr(user, "full_name", "") or getattr(user, "name", "Faculty"),
            student_id=stu_id_str,
            student_name=student_name,
            parent_name=parent_name,
            parent_mobile=parent_mobile,
            masked_mobile=masked_mobile,
            batch_name=req.batch or exam.batch,
            subject_name=req.subject or exam.subject,
            exam_id=str(exam.id),
            exam_name=exam.exam_name,
            marks_obtained=mark.marks_obtained,
            max_marks=max_marks,
            percentage=percentage,
            channel=req.channel,
            status=status_key,
            details=dispatch_result.get("message", "")
        )
        await audit_entry.insert()

        results.append({
            "student_id": stu_id_str,
            "student_name": student_name,
            "parent_name": parent_name,
            "parent_mobile": parent_mobile,
            "masked_mobile": masked_mobile,
            "marks_obtained": mark.marks_obtained,
            "max_marks": max_marks,
            "percentage": percentage,
            "status": status_key,
            "message": dispatch_result.get("message", "")
        })

    # Dispatch SMS alert and notification to the Teacher
    teacher_notification_info = None
    try:
        from app.models.teacher import Teacher
        teacher_obj = None
        if getattr(exam, 'teacher', None):
            if isinstance(exam.teacher, Teacher):
                teacher_obj = exam.teacher
            elif getattr(exam.teacher, 'ref', None):
                teacher_obj = await Teacher.get(exam.teacher.ref.id)
            elif getattr(exam.teacher, 'id', None):
                teacher_obj = await Teacher.get(exam.teacher.id)

        if not teacher_obj and user:
            teacher_obj = await Teacher.find_one({"user.id": user.id})
            if not teacher_obj and getattr(user, "id", None):
                teacher_obj = await Teacher.find_one({"user.$id": user.id})

        teacher_mobile = getattr(teacher_obj, "mobile_number", "") if teacher_obj else ""
        teacher_name = getattr(user, "full_name", "") or getattr(user, "name", "Faculty")
        if teacher_obj and getattr(teacher_obj, "user", None):
            try:
                t_user = teacher_obj.user if isinstance(teacher_obj.user, User) else await User.get(teacher_obj.user.ref.id)
                if t_user and t_user.full_name:
                    teacher_name = t_user.full_name
            except Exception:
                pass

        teacher_alert_msg = notification_service.build_teacher_marks_alert(
            teacher_name=teacher_name,
            exam_name=exam.exam_name,
            subject=req.subject or exam.subject,
            total_students=summary["total"],
            channel=req.channel
        )

        teacher_dispatch_result = None
        if teacher_mobile:
            teacher_dispatch_result = await notification_service.send_sms(teacher_mobile, teacher_alert_msg)
        else:
            teacher_dispatch_result = {
                "success": False,
                "status": "missing_phone",
                "message": "Teacher mobile number not registered"
            }

        masked_teacher_phone = notification_service.mask_phone(teacher_mobile)
        teacher_notification_info = {
            "teacher_name": teacher_name,
            "masked_mobile": masked_teacher_phone,
            "status": teacher_dispatch_result.get("status", "failed"),
            "message": teacher_dispatch_result.get("message", "")
        }

        # Log teacher SMS alert in audit logs
        audit_teacher = NotificationAuditLog(
            teacher_id=str(user.id),
            teacher_name=teacher_name,
            student_id="",
            student_name=f"[Teacher Alert: {teacher_name}]",
            parent_name="Faculty Notification",
            parent_mobile=teacher_mobile,
            masked_mobile=masked_teacher_phone,
            batch_name=req.batch or exam.batch,
            subject_name=req.subject or exam.subject,
            exam_id=str(exam.id),
            exam_name=exam.exam_name,
            marks_obtained=0.0,
            max_marks=0.0,
            percentage=0.0,
            channel="sms",
            status=teacher_dispatch_result.get("status", "failed"),
            details=f"Teacher copy: {teacher_dispatch_result.get('message', '')}"
        )
        await audit_teacher.insert()

        # In-app notice for TEACHER
        from app.models.notices import Notice
        teacher_notice = Notice(
            title=f"SMS Alert: Marks Dispatched for {exam.exam_name}",
            content=f"Marks notifications for {exam.exam_name} ({req.subject or exam.subject}) have been dispatched via {req.channel.upper()} to parents of {summary['total']} students. SMS confirmation sent to teacher mobile {masked_teacher_phone}.",
            target_audiences=["TEACHER", "ALL"],
            target_batches=[exam.batch] if exam.batch else [],
            category="Examinations & SMS Alerts",
            priority="High",
            created_by=user
        )
        await teacher_notice.insert()
    except Exception as e:
        print(f"Teacher alert dispatch skipped: {e}")

    return {
        "summary": summary,
        "channel": req.channel,
        "results": results,
        "teacher_notification": teacher_notification_info
    }

async def get_notification_logs(limit: int = 50) -> list[dict]:
    from app.models.audit_log import NotificationAuditLog
    logs = await NotificationAuditLog.find_all().sort("-created_at").limit(limit).to_list()
    return [
        {
            "id": str(log.id),
            "teacher_name": log.teacher_name,
            "student_name": log.student_name,
            "masked_mobile": log.masked_mobile,
            "exam_name": log.exam_name,
            "channel": log.channel,
            "status": log.status,
            "details": log.details,
            "created_at": log.created_at.strftime("%Y-%m-%d %H:%M") if log.created_at else ""
        }
        for log in logs
    ]

