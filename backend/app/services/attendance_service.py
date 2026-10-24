from app.models.attendance import Attendance
from app.schemas.attendance import AttendanceCreate
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.user import User
from app.models.leave_request import LeaveRequest
from app.models.batch import Batch
from fastapi import HTTPException
from beanie import PydanticObjectId
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
import re

def _get_teacher_mongo_query(teacher_id_obj: ObjectId) -> Dict[str, Any]:
    return {
        "$or": [
            {"teacher.$id": teacher_id_obj},
            {"teacher.id": teacher_id_obj},
            {"teacher": teacher_id_obj}
        ]
    }

def parse_time_slot_duration(time_str: str) -> int:
    """Parse time slot string like '09:00 AM – 10:00 AM' and return duration in minutes."""
    if not time_str:
        return 60
    clean = re.sub(r'[–—]', '-', str(time_str)).strip()
    parts = clean.split('-')
    if len(parts) != 2:
        return 60
    def to_minutes(t_s: str) -> int:
        m = re.search(r'(\d+):(\d+)\s*(AM|PM)?', t_s.strip(), re.I)
        if not m:
            return 0
        h, mn, mer = int(m.group(1)), int(m.group(2)), (m.group(3) or '').upper()
        if mer == 'PM' and h < 12:
            h += 12
        if mer == 'AM' and h == 12:
            h = 0
        return h * 60 + mn
    diff = to_minutes(parts[1]) - to_minutes(parts[0])
    return diff if diff > 0 else 60

async def get_teacher_scheduled_lecture_minutes(teacher: Optional[Teacher], weekday_name: str) -> int:
    """Calculate the teacher's scheduled timetable lecture hours in minutes for a given weekday."""
    if not teacher:
        return 60
    tid_str = str(teacher.id)
    t_name = ''
    if isinstance(teacher.user, User):
        t_name = teacher.user.full_name
    elif teacher.user:
        try:
            u = await User.get(teacher.user.ref.id)
            if u:
                t_name = u.full_name
        except Exception:
            pass

    batches = await Batch.find_all().to_list()
    total_mins = 0
    seen_slots = set()

    for b in batches:
        is_my_batch = False
        if b.teacher:
            if hasattr(b.teacher, 'id') and str(b.teacher.id) == tid_str:
                is_my_batch = True
            elif hasattr(b.teacher, 'ref') and str(b.teacher.ref.id) == tid_str:
                is_my_batch = True
        elif b.teacher_name and t_name and (t_name.lower() in b.teacher_name.lower() or b.teacher_name.lower() in t_name.lower()):
            is_my_batch = True

        if is_my_batch and b.timetable:
            for s in b.timetable:
                day = s.get('day', '')
                if day.lower() == weekday_name.lower():
                    slot_t = s.get('time', '')
                    slot_key = f"{day.lower()}_{slot_t}_{s.get('subject', '')}_{s.get('class_code', '')}"
                    if slot_key not in seen_slots:
                        seen_slots.add(slot_key)
                        total_mins += parse_time_slot_duration(slot_t)
        elif is_my_batch and b.days and any(d.lower() == weekday_name.lower() for d in b.days) and not b.timetable:
            total_mins += parse_time_slot_duration(b.time)

    return total_mins if total_mins > 0 else 60

async def auto_close_forgotten_checkouts(teacher: Optional[Teacher] = None):
    """
    Auto-close teacher attendance records where the teacher forgot to check out.
    If the record date is prior to today, automatically set the check-out time
    and total hours based strictly on their scheduled timetable lecture hours.
    """
    try:
        now = datetime.utcnow()
        conditions = [
            {"check_in_time": {"$ne": None}},
            {"check_out_time": None}
        ]
        if teacher:
            conditions.append(_get_teacher_mongo_query(teacher.id))

        unclosed_records = await Attendance.find({"$and": conditions} if len(conditions) > 1 else conditions[0]).to_list()
        for r in unclosed_records:
            rec_date = r.date or r.check_in_time
            is_past_day = rec_date.date() < now.date()
            is_overdue = (now - r.check_in_time).total_seconds() > 57600
            if is_past_day or is_overdue:
                rec_teacher = teacher
                if not rec_teacher and r.teacher:
                    tid = r.teacher.ref.id if hasattr(r.teacher, 'ref') else getattr(r.teacher, 'id', None)
                    if tid:
                        rec_teacher = await Teacher.get(tid)
                
                weekday_name = rec_date.strftime('%A')
                scheduled_mins = await get_teacher_scheduled_lecture_minutes(rec_teacher, weekday_name)
                
                hrs = scheduled_mins // 60
                mins = scheduled_mins % 60
                formatted_hours = f"{hrs}h {mins:02d}m"

                r.check_out_time = r.check_in_time + timedelta(minutes=scheduled_mins)
                r.total_hours = formatted_hours
                r.status = "Present"
                remark_note = f"Auto Closed (Lecture Hours: {formatted_hours})"
                r.remarks = f"{r.remarks} | {remark_note}" if r.remarks else remark_note
                await r.save()
    except Exception:
        pass


async def mark_attendance(attendance_in: AttendanceCreate) -> Attendance:
    from app.services.student_service import resolve_student
    from app.services.teacher_service import resolve_teacher
    student = None
    teacher = None
    if attendance_in.student_id:
        student = await resolve_student(str(attendance_in.student_id))
    if attendance_in.teacher_id:
        teacher = await resolve_teacher(str(attendance_in.teacher_id))
        
    # Inherit branch, academic_batch, session from student admission profile
    b_branch = attendance_in.branch or (student.branch if student else None)
    b_academic_batch = attendance_in.academic_batch or (student.academic_batch if student else None)
    b_session = attendance_in.session or (student.session if student else None)
    b_batch = attendance_in.batch or (student.batch if student else None)

    attendance = Attendance(
        student=student,
        teacher=teacher,
        date=attendance_in.date,
        status=attendance_in.status,
        rfid_scan_time=attendance_in.rfid_scan_time,
        check_in_time=attendance_in.check_in_time,
        check_out_time=attendance_in.check_out_time,
        total_hours=attendance_in.total_hours,
        remarks=attendance_in.remarks,
        branch=b_branch,
        academic_batch=b_academic_batch,
        session=b_session,
        batch=b_batch,
        lecture_slot=attendance_in.lecture_slot,
        subject=attendance_in.subject
    )
    await attendance.insert()
    return attendance

async def get_student_attendance(student_id: str) -> list[Attendance]:
    from app.services.student_service import resolve_student
    student = await resolve_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return await Attendance.find({
        "$or": [
            {"student.$id": student.id},
            {"student.id": student.id},
            {"student": student.id}
        ]
    }).sort("-date").to_list()

async def check_in_teacher(attendance_in: AttendanceCreate) -> dict:
    from app.services.teacher_service import resolve_teacher
    teacher = None
    if attendance_in.teacher_id:
        teacher = await resolve_teacher(str(attendance_in.teacher_id))
    
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    # Normalize date to day start / day end
    date_val = attendance_in.date or datetime.utcnow()
    day_start = date_val.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = date_val.replace(hour=23, minute=59, second=59, microsecond=999999)

    existing = await Attendance.find_one({
        "$and": [
            _get_teacher_mongo_query(teacher.id),
            {"date": {"$gte": day_start, "$lte": day_end}}
        ]
    })

    if existing:
        raise HTTPException(status_code=400, detail="Teacher is already checked in for today")

    now = datetime.utcnow()
    check_in_time = attendance_in.check_in_time or now
    status = "Working" if attendance_in.status in {"Present", "", None} else attendance_in.status

    attendance = Attendance(
        teacher=teacher,
        date=date_val,
        status=status,
        check_in_time=check_in_time,
        remarks=attendance_in.remarks
    )
    await attendance.insert()
    res = attendance.model_dump()
    res["id"] = str(attendance.id)
    res["teacher_id"] = str(teacher.id)
    return res

async def check_out_teacher(attendance_in: AttendanceCreate) -> dict:
    from app.services.teacher_service import resolve_teacher
    teacher = None
    if attendance_in.teacher_id:
        teacher = await resolve_teacher(str(attendance_in.teacher_id))
    
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    date_val = attendance_in.date or datetime.utcnow()
    day_start = date_val.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = date_val.replace(hour=23, minute=59, second=59, microsecond=999999)

    existing = await Attendance.find_one({
        "$and": [
            _get_teacher_mongo_query(teacher.id),
            {"date": {"$gte": day_start, "$lte": day_end}}
        ]
    })

    if not existing:
        raise HTTPException(status_code=400, detail="No check-in record found for today. Please check in first.")
        
    if existing.check_out_time:
        raise HTTPException(status_code=400, detail="Teacher has already checked out today.")

    now = datetime.utcnow()
    check_out_time = attendance_in.check_out_time or now
    existing.check_out_time = check_out_time
    existing.status = "Present"
    
    if attendance_in.remarks:
        if existing.remarks:
            existing.remarks = f"{existing.remarks} | {attendance_in.remarks}"
        else:
            existing.remarks = attendance_in.remarks

    if existing.check_in_time:
        diff = check_out_time - existing.check_in_time
        hours, remainder = divmod(diff.total_seconds(), 3600)
        minutes, _ = divmod(remainder, 60)
        existing.total_hours = f"{int(hours)}h {int(minutes)}m"

    await existing.save()
    res = existing.model_dump()
    res["id"] = str(existing.id)
    res["teacher_id"] = str(teacher.id)
    return res

async def auto_record_teacher_login(teacher_id_or_user_id: str) -> Optional[Attendance]:
    """
    Auto check-in disabled: Teacher check-in must be manual (punch/entry).
    Only returns existing record if already created.
    """
    from app.services.teacher_service import resolve_teacher
    teacher = await resolve_teacher(str(teacher_id_or_user_id))
    if not teacher:
        return None

    now = datetime.utcnow()
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    existing = await Attendance.find_one({
        "$and": [
            _get_teacher_mongo_query(teacher.id),
            {"date": {"$gte": day_start, "$lte": day_end}}
        ]
    })
    return existing

async def auto_record_teacher_logout(teacher_id_or_user_id: str) -> Optional[Attendance]:
    """
    Called when a teacher logs out.
    Automatically sets check-out time and computes total duration if currently checked in.
    """
    from app.services.teacher_service import resolve_teacher
    teacher = await resolve_teacher(str(teacher_id_or_user_id))
    if not teacher:
        return None

    now = datetime.utcnow()
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    existing = await Attendance.find_one({
        "$and": [
            _get_teacher_mongo_query(teacher.id),
            {"date": {"$gte": day_start, "$lte": day_end}},
            {"check_in_time": {"$ne": None}},
            {"check_out_time": None}
        ]
    })

    if existing and existing.check_in_time:
        existing.check_out_time = now
        existing.status = "Present"
        diff = existing.check_out_time - existing.check_in_time
        total_seconds = max(0, diff.total_seconds())
        hrs = int(total_seconds // 3600)
        mins = int((total_seconds % 3600) // 60)
        existing.total_hours = f"{hrs}h {mins}m"
        note = "Auto Check-Out on Faculty Logout"
        existing.remarks = f"{existing.remarks} | {note}" if existing.remarks else note
        await existing.save()
        return existing
    return None

async def get_teacher_attendance(teacher_id: str) -> list[dict]:
    from app.services.teacher_service import resolve_teacher
    teacher = await resolve_teacher(teacher_id)
    if not teacher:
        return []

    # Automatically close any past forgotten checkouts based on scheduled lecture timetable
    await auto_close_forgotten_checkouts(teacher=teacher)

    records = await Attendance.find(
        _get_teacher_mongo_query(teacher.id)
    ).sort("-date", "-check_in_time").to_list()

    now = datetime.utcnow()
    res = []
    for r in records:
        d = r.model_dump()
        d["id"] = str(r.id)
        d["teacher_id"] = str(teacher.id)
        d["student_id"] = ""
        d.pop("teacher", None)
        d.pop("student", None)

        # Dynamic live calculation of working hours
        if r.check_in_time and r.check_out_time:
            diff = r.check_out_time - r.check_in_time
            total_seconds = max(0, diff.total_seconds())
            hrs = int(total_seconds // 3600)
            mins = int((total_seconds % 3600) // 60)
            d["total_hours"] = f"{hrs}h {mins}m"
            d["status"] = r.status or "Present"
        elif r.check_in_time and not r.check_out_time:
            rec_date = r.date or r.check_in_time
            if rec_date.date() == now.date():
                diff = now - r.check_in_time
                total_seconds = max(0, diff.total_seconds())
                hrs = int(total_seconds // 3600)
                mins = int((total_seconds % 3600) // 60)
                d["total_hours"] = f"{hrs}h {mins}m"
                d["status"] = "Working"
            else:
                scheduled_mins = await get_teacher_scheduled_lecture_minutes(teacher, rec_date.strftime('%A'))
                hrs = scheduled_mins // 60
                mins = scheduled_mins % 60
                d["total_hours"] = f"{hrs}h {mins:02d}m"
                d["status"] = "Present"
        elif r.total_hours:
            d["total_hours"] = r.total_hours

        res.append(d)

    # Check if teacher was mentioned in DailyActivity on dates without Attendance
    try:
        from app.models.daily_activity import DailyActivity
        t_name = ""
        if isinstance(teacher.user, User):
            t_name = teacher.user.full_name
        elif teacher.user:
            try:
                u = await User.get(teacher.user.ref.id)
                if u:
                    t_name = u.full_name
            except Exception:
                pass

        activity_query = {"$or": [{"teacher_id": str(teacher.id)}]}
        if t_name:
            activity_query["$or"].append({"teacher_name": t_name})
        
        acts = await DailyActivity.find(activity_query).to_list()
        existing_dates = {r.date.strftime("%Y-%m-%d") for r in records if r.date}

        acts_by_date = {}
        for a in acts:
            d_str = a.target_date or (getattr(a, 'activity_date', None))
            if not d_str and a.created_at:
                d_str = a.created_at.strftime("%Y-%m-%d")
            if d_str and d_str not in existing_dates:
                if d_str not in acts_by_date:
                    acts_by_date[d_str] = []
                acts_by_date[d_str].append(a)

        for d_str, day_acts in acts_by_date.items():
            tot_h = sum(float(getattr(x, 'hours', 1.0) or 1.0) for x in day_acts)
            hrs = int(tot_h)
            mins = int((tot_h - hrs) * 60)
            formatted_h = f"{hrs}h {mins:02d}m"
            try:
                rec_date = datetime.strptime(d_str, "%Y-%m-%d")
            except Exception:
                rec_date = datetime.utcnow()

            res.append({
                "id": f"ACT-ATT-{str(day_acts[0].id)}",
                "teacher_id": str(teacher.id),
                "student_id": "",
                "date": rec_date.isoformat(),
                "status": "Present",
                "check_in_time": None,
                "check_out_time": None,
                "total_hours": formatted_h,
                "remarks": f"Lectures conducted: {len(day_acts)} session(s)"
            })
    except Exception:
        pass

    return res

async def get_all_teachers_attendance(
    date_str: Optional[str] = None,
    teacher_id: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> list[dict]:
    from app.services.teacher_service import resolve_teacher

    # Automatically close any past forgotten checkouts based on scheduled lecture timetable
    await auto_close_forgotten_checkouts()

    # Preload all teachers with their linked user profiles for high performance
    teachers = await Teacher.find_all().to_list()
    teacher_map: Dict[str, Dict[str, Any]] = {}
    for t in teachers:
        user_name = ""
        user_email = ""
        if isinstance(t.user, User):
            user_name = t.user.full_name
            user_email = t.user.email
        elif t.user:
            try:
                user_obj = await User.get(t.user.ref.id)
                if user_obj:
                    user_name = user_obj.full_name
                    user_email = user_obj.email
            except Exception:
                pass

        teacher_map[str(t.id)] = {
            "teacher_id": str(t.id),
            "teacher_name": user_name or f"Faculty ({t.employee_id})",
            "employee_id": t.employee_id,
            "mobile_number": t.mobile_number,
            "subjects": t.subjects or [],
            "email": user_email
        }

    conditions: List[Dict[str, Any]] = [
        {"$or": [
            {"teacher": {"$ne": None}},
            {"teacher.$id": {"$exists": True}},
            {"teacher.id": {"$exists": True}}
        ]}
    ]

    if teacher_id:
        target_teacher = await resolve_teacher(teacher_id)
        if target_teacher:
            conditions.append(_get_teacher_mongo_query(target_teacher.id))
        else:
            return []

    if date_str:
        try:
            clean_date = date_str.split("T")[0]
            dt = datetime.strptime(clean_date, "%Y-%m-%d")
            day_start = dt.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = dt.replace(hour=23, minute=59, second=59, microsecond=999999)
            conditions.append({"date": {"$gte": day_start, "$lte": day_end}})
        except Exception:
            pass
    elif start_date and end_date:
        try:
            s_dt = datetime.strptime(start_date.split("T")[0], "%Y-%m-%d").replace(hour=0, minute=0, second=0)
            e_dt = datetime.strptime(end_date.split("T")[0], "%Y-%m-%d").replace(hour=23, minute=59, second=59, microsecond=999999)
            conditions.append({"date": {"$gte": s_dt, "$lte": e_dt}})
        except Exception:
            pass

    if status and status.strip().lower() not in {"all", ""}:
        conditions.append({"status": {"$regex": f"^{status.strip()}$", "$options": "i"}})

    query = {"$and": conditions} if conditions else {}
    records = await Attendance.find(query).sort("-date", "-check_in_time").to_list()

    res = []
    for r in records:
        tid_str = ""
        if hasattr(r, "teacher") and r.teacher:
            if hasattr(r.teacher, "id"):
                tid_str = str(r.teacher.id)
            elif hasattr(r.teacher, "ref") and hasattr(r.teacher.ref, "id"):
                tid_str = str(r.teacher.ref.id)
            elif isinstance(r.teacher, dict) and "$id" in r.teacher:
                tid_str = str(r.teacher["$id"])
            else:
                tid_str = str(r.teacher)

        t_info = teacher_map.get(tid_str, {})

        hours_str = None
        if r.check_in_time and r.check_out_time:
            diff = r.check_out_time - r.check_in_time
            total_seconds = max(0, diff.total_seconds())
            hrs = int(total_seconds // 3600)
            mins = int((total_seconds % 3600) // 60)
            hours_str = f"{hrs}h {mins}m"
        elif r.check_in_time and not r.check_out_time:
            rec_date = r.date or r.check_in_time
            if rec_date.date() == datetime.utcnow().date():
                diff = datetime.utcnow() - r.check_in_time
                total_seconds = max(0, diff.total_seconds())
                hrs = int(total_seconds // 3600)
                mins = int((total_seconds % 3600) // 60)
                hours_str = f"{hrs}h {mins}m"
            else:
                hours_str = r.total_hours or "1h 00m"
        elif r.total_hours:
            hours_str = r.total_hours

        res.append({
            "id": str(r.id),
            "teacher_id": tid_str or "",
            "teacher_name": t_info.get("teacher_name", "Faculty Member"),
            "employee_id": t_info.get("employee_id", "--"),
            "email": t_info.get("email", ""),
            "mobile_number": t_info.get("mobile_number", ""),
            "subjects": t_info.get("subjects", []),
            "date": r.date.replace(tzinfo=timezone.utc).isoformat() if (r.date and r.date.tzinfo is None) else (r.date.isoformat() if r.date else None),
            "status": r.status,
            "check_in_time": r.check_in_time.replace(tzinfo=timezone.utc).isoformat() if (r.check_in_time and r.check_in_time.tzinfo is None) else (r.check_in_time.isoformat() if r.check_in_time else None),
            "check_out_time": r.check_out_time.replace(tzinfo=timezone.utc).isoformat() if (r.check_out_time and r.check_out_time.tzinfo is None) else (r.check_out_time.isoformat() if r.check_out_time else None),
            "total_hours": hours_str or "--",
            "remarks": r.remarks or ""
        })

    # Also automatically include teachers who conducted DailyActivities on dates without punch records
    try:
        from app.models.daily_activity import DailyActivity
        act_query = {}
        if date_str:
            clean_date = date_str.split("T")[0]
            act_query = {"$or": [{"target_date": clean_date}, {"activity_date": clean_date}]}
        elif start_date and end_date:
            s_clean = start_date.split("T")[0]
            e_clean = end_date.split("T")[0]
            act_query = {"$or": [
                {"target_date": {"$gte": s_clean, "$lte": e_clean}},
                {"activity_date": {"$gte": s_clean, "$lte": e_clean}}
            ]}

        acts = await DailyActivity.find(act_query).to_list()
        existing_combos = set()
        for item in res:
            t_key = item.get("teacher_id") or item.get("teacher_name", "").lower()
            d_key = item.get("date", "").split("T")[0]
            existing_combos.add((t_key, d_key))

        acts_by_teacher_date = {}
        for a in acts:
            d_str = a.target_date or getattr(a, 'activity_date', None)
            if not d_str and a.created_at:
                d_str = a.created_at.strftime("%Y-%m-%d")
            t_id = a.teacher_id or ""
            t_name = a.teacher_name or ""
            key = (t_id, t_name, d_str)
            if key not in acts_by_teacher_date:
                acts_by_teacher_date[key] = []
            acts_by_teacher_date[key].append(a)

        for (a_tid, a_tname, d_str), day_acts in acts_by_teacher_date.items():
            if not d_str:
                continue
            matched_tid = a_tid
            if not matched_tid and a_tname:
                for tid_k, t_val in teacher_map.items():
                    if t_val.get("teacher_name", "").lower() == a_tname.lower():
                        matched_tid = tid_k
                        break

            if (matched_tid, d_str) in existing_combos or (a_tname.lower(), d_str) in existing_combos:
                continue

            t_info = teacher_map.get(matched_tid, {})
            tot_h = sum(float(getattr(x, 'hours', 1.0) or 1.0) for x in day_acts)
            hrs = int(tot_h)
            mins = int((tot_h - hrs) * 60)
            formatted_h = f"{hrs}h {mins:02d}m"

            try:
                rec_date = datetime.strptime(d_str, "%Y-%m-%d")
            except Exception:
                rec_date = datetime.utcnow()

            res.append({
                "id": f"ACT-ATT-{str(day_acts[0].id)}",
                "teacher_id": matched_tid or "",
                "teacher_name": t_info.get("teacher_name") or a_tname or "Faculty Member",
                "employee_id": t_info.get("employee_id", "--"),
                "email": t_info.get("email", ""),
                "mobile_number": t_info.get("mobile_number", ""),
                "subjects": t_info.get("subjects", []),
                "date": rec_date.isoformat(),
                "status": "Present",
                "check_in_time": None,
                "check_out_time": None,
                "total_hours": formatted_h,
                "remarks": f"Lectures conducted: {len(day_acts)} session(s)"
            })
    except Exception:
        pass

    return res

async def get_teachers_attendance_summary(date_str: Optional[str] = None) -> dict:
    await auto_close_forgotten_checkouts()
    target_date = datetime.utcnow()
    if date_str:
        try:
            target_date = datetime.strptime(date_str.split("T")[0], "%Y-%m-%d")
        except Exception:
            pass

    day_start = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)

    teachers = await Teacher.find(Teacher.status == "Active").to_list()
    total_teachers = len(teachers)

    attendance_records = await Attendance.find({
        "$and": [
            {"$or": [
                {"teacher": {"$ne": None}},
                {"teacher.$id": {"$exists": True}},
                {"teacher.id": {"$exists": True}}
            ]},
            {"date": {"$gte": day_start, "$lte": day_end}}
        ]
    }).to_list()

    working_count = 0
    completed_count = 0
    checked_in_teacher_ids = set()

    for r in attendance_records:
        tid = ""
        if hasattr(r, "teacher") and r.teacher:
            if hasattr(r.teacher, "id"):
                tid = str(r.teacher.id)
            elif hasattr(r.teacher, "ref"):
                tid = str(r.teacher.ref.id)
            elif isinstance(r.teacher, dict) and "$id" in r.teacher:
                tid = str(r.teacher["$id"])
            else:
                tid = str(r.teacher)
        if tid:
            checked_in_teacher_ids.add(tid)

        if r.check_out_time:
            completed_count += 1
        elif r.check_in_time:
            working_count += 1

    # Check active approved leaves for this date
    approved_leaves = await LeaveRequest.find({
        "status": "Approved",
        "from_date": {"$lte": day_end},
        "to_date": {"$gte": day_start}
    }).to_list()

    leave_teacher_ids = set()
    for l in approved_leaves:
        if hasattr(l, "teacher") and l.teacher:
            if hasattr(l.teacher, "id"):
                leave_teacher_ids.add(str(l.teacher.id))
            elif hasattr(l.teacher, "ref"):
                leave_teacher_ids.add(str(l.teacher.ref.id))

    on_leave_count = len(leave_teacher_ids - checked_in_teacher_ids)
    present_count = len(checked_in_teacher_ids)
    absent_count = max(0, total_teachers - present_count - on_leave_count)

    return {
        "date": target_date.strftime("%Y-%m-%d"),
        "total_teachers": total_teachers,
        "present_count": present_count,
        "working_count": working_count,
        "completed_count": completed_count,
        "absent_count": absent_count,
        "on_leave_count": on_leave_count
    }

async def mark_manual_teacher_attendance(data: dict) -> dict:
    from app.services.teacher_service import resolve_teacher

    teacher_id = data.get("teacher_id")
    if not teacher_id:
        raise HTTPException(status_code=400, detail="Teacher ID is required")
        
    teacher = await resolve_teacher(teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    date_dt = _to_naive_utc(data.get("date")) or datetime.utcnow()
    check_in = _to_naive_utc(data.get("check_in_time"))
    check_out = _to_naive_utc(data.get("check_out_time"))

    total_hours = None
    if check_in and check_out:
        diff = check_out - check_in
        total_seconds = max(0, diff.total_seconds())
        hrs = int(total_seconds // 3600)
        mins = int((total_seconds % 3600) // 60)
        total_hours = f"{hrs}h {mins}m"
    elif check_in and not check_out:
        if date_dt.date() == datetime.utcnow().date():
            diff = datetime.utcnow() - check_in
            total_seconds = max(0, diff.total_seconds())
            hrs = int(total_seconds // 3600)
            mins = int((total_seconds % 3600) // 60)
            total_hours = f"{hrs}h {mins}m"
        else:
            total_hours = data.get("total_hours") or "1h 00m"
    elif data.get("total_hours"):
        total_hours = data.get("total_hours")

    status = data.get("status", "Present")
    if not check_out and check_in and status == "Present":
        status = "Working"

    day_start = date_dt.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = date_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
    existing = await Attendance.find_one({
        "$and": [
            _get_teacher_mongo_query(teacher.id),
            {"date": {"$gte": day_start, "$lte": day_end}}
        ]
    })

    if existing:
        existing.status = status
        if check_in:
            existing.check_in_time = check_in
        if check_out:
            existing.check_out_time = check_out
        existing.total_hours = total_hours
        if data.get("remarks"):
            existing.remarks = data["remarks"]
        await existing.save()
        res = existing.model_dump()
        res["id"] = str(existing.id)
        res["teacher_id"] = str(teacher.id)
        return res

    attendance = Attendance(
        teacher=teacher,
        date=date_dt,
        status=status,
        check_in_time=check_in,
        check_out_time=check_out,
        total_hours=total_hours,
        remarks=data.get("remarks")
    )
    await attendance.insert()
    res = attendance.model_dump()
    res["id"] = str(attendance.id)
    res["teacher_id"] = str(teacher.id)
    return res

def _to_naive_utc(val):
    if not val:
        return None
    if isinstance(val, str):
        clean = val.replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(clean)
        except Exception:
            return None
    elif isinstance(val, datetime):
        dt = val
    else:
        return None

    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt

async def update_attendance_record(record_id: str, data: dict) -> dict:
    record = None
    if record_id:
        if str(record_id).startswith("ACT-ATT-"):
            act_id = str(record_id).replace("ACT-ATT-", "")
            from app.models.daily_activity import DailyActivity
            from app.services.teacher_service import resolve_teacher
            act = await DailyActivity.get(ObjectId(act_id)) if ObjectId.is_valid(act_id) else None
            teacher_ref = None
            if act and act.teacher_id:
                teacher_ref = await resolve_teacher(act.teacher_id)
            if not teacher_ref and data.get("teacher_id"):
                teacher_ref = await resolve_teacher(data["teacher_id"])

            d_val = data.get("date") or (act.target_date if act else None) or datetime.utcnow()
            d_dt = _to_naive_utc(d_val) or datetime.utcnow()
            day_start = d_dt.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = d_dt.replace(hour=23, minute=59, second=59, microsecond=999999)

            if teacher_ref:
                record = await Attendance.find_one({
                    "$and": [
                        _get_teacher_mongo_query(teacher_ref.id),
                        {"date": {"$gte": day_start, "$lte": day_end}}
                    ]
                })
                if not record:
                    record = Attendance(
                        teacher=teacher_ref,
                        date=day_start,
                        status="Present"
                    )
                    await record.insert()
        else:
            try:
                record = await Attendance.get(ObjectId(record_id))
            except Exception:
                record = None

    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    if "status" in data and data["status"]:
        record.status = data["status"]
    if "remarks" in data:
        record.remarks = data["remarks"]
    if "date" in data and data["date"]:
        parsed_d = _to_naive_utc(data["date"])
        if parsed_d:
            record.date = parsed_d

    if "check_in_time" in data:
        record.check_in_time = _to_naive_utc(data["check_in_time"])
    if "check_out_time" in data:
        record.check_out_time = _to_naive_utc(data["check_out_time"])

    # Ensure both existing dates are normalized naive UTC
    if record.check_in_time and record.check_in_time.tzinfo is not None:
        record.check_in_time = record.check_in_time.astimezone(timezone.utc).replace(tzinfo=None)
    if record.check_out_time and record.check_out_time.tzinfo is not None:
        record.check_out_time = record.check_out_time.astimezone(timezone.utc).replace(tzinfo=None)

    # Recalculate duration and status
    if record.check_in_time and record.check_out_time:
        diff = record.check_out_time - record.check_in_time
        total_seconds = max(0, diff.total_seconds())
        hrs = int(total_seconds // 3600)
        mins = int((total_seconds % 3600) // 60)
        record.total_hours = f"{hrs}h {mins}m"
        if record.status == "Working":
            record.status = "Present"
    elif record.check_in_time and not record.check_out_time:
        record.total_hours = "--"
        if record.status == "Present":
            record.status = "Working"
    elif not record.check_in_time and not record.check_out_time:
        if record.status == "Working":
            record.status = "Present"
    elif "total_hours" in data and data["total_hours"]:
        record.total_hours = data["total_hours"]

    await record.save()
    res = record.model_dump()
    res["id"] = str(record.id)
    if record.teacher:
        t_id = record.teacher.id if hasattr(record.teacher, "id") else getattr(record.teacher.ref, "id", None)
        res["teacher_id"] = str(t_id) if t_id else ""
    if record.date:
        res["date"] = record.date.replace(tzinfo=timezone.utc).isoformat()
    if record.check_in_time:
        res["check_in_time"] = record.check_in_time.replace(tzinfo=timezone.utc).isoformat()
    if record.check_out_time:
        res["check_out_time"] = record.check_out_time.replace(tzinfo=timezone.utc).isoformat()
    return res

async def delete_attendance_record(record_id: str) -> dict:
    record = await Attendance.get(ObjectId(record_id))
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    await record.delete()
    return {"message": "Attendance record deleted successfully"}

async def get_all_attendance_logs(params: Optional[dict] = None) -> list[dict]:
    # General attendance logs (such as RFID / student gate taps)
    records = await Attendance.find({"student": {"$ne": None}}).sort("-date").limit(100).to_list()
    res = []
    for r in records:
        student_name = "Student"
        roll = "--"
        rfid = "--"
        if r.student:
            student_obj = None
            if isinstance(r.student, Student):
                student_obj = r.student
            elif hasattr(r.student, "ref"):
                student_obj = await Student.get(r.student.ref.id)
            if student_obj:
                roll = student_obj.roll_number
                rfid = student_obj.rfid_tag or "--"
                if student_obj.user:
                    u = await User.get(student_obj.user.ref.id) if hasattr(student_obj.user, "ref") else student_obj.user
                    if u:
                        student_name = u.full_name

        time_str = r.rfid_scan_time.strftime("%I:%M %p") if r.rfid_scan_time else r.date.strftime("%I:%M %p")
        res.append({
            "id": str(r.id),
            "time": time_str,
            "studentName": student_name,
            "rollNumber": roll,
            "rfidCard": rfid,
            "gate": "Gate 1",
            "status": r.status or "Present",
            "smsAlert": "Dispatched to parents"
        })
    return res

async def scan_rfid_card(rfid_card: str, gate: str = "Gate 1") -> dict:
    from app.services.student_service import resolve_student
    student = await Student.find_one(Student.rfid_tag == rfid_card)
    if not student:
        raise HTTPException(status_code=404, detail=f"No student registered with RFID badge UID: {rfid_card}")

    now = datetime.utcnow()
    att = Attendance(
        student=student,
        date=now,
        status="Present",
        rfid_scan_time=now,
        remarks=f"Scanned at {gate}",
        branch=student.branch,
        academic_batch=student.academic_batch,
        session=student.session,
        batch=student.batch
    )
    await att.insert()
    
    student_name = "Student"
    if student.user:
        u = await User.get(student.user.ref.id) if hasattr(student.user, "ref") else student.user
        if u:
            student_name = u.full_name

    return {
        "message": f"Badge verified for {student_name} ({student.roll_number}) at {gate}",
        "record": {
            "id": str(att.id),
            "studentName": student_name,
            "time": now.strftime("%I:%M %p"),
            "status": "Present"
        }
    }

async def get_batch_date_attendance(
    date_str: Optional[str] = None,
    branch: Optional[str] = None,
    academic_batch: Optional[str] = None,
    session: Optional[str] = None,
    batch: Optional[str] = None
) -> dict:
    from app.core.branch_config import student_matches_filters, parse_student_branch_batch, BRANCH_MANGALWAR

    now = datetime.utcnow()
    target_date = now
    if date_str:
        try:
            clean_date = date_str.split("T")[0]
            target_date = datetime.strptime(clean_date, "%Y-%m-%d")
        except Exception:
            target_date = now

    date_formatted = target_date.strftime("%Y-%m-%d")
    pretty_date = target_date.strftime("%d %b %Y")

    day_start = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)

    target_batch = academic_batch or batch
    all_students = await Student.find_all().to_list()
    matched_students = []

    for s in all_students:
        if student_matches_filters(s, branch_filter=branch, academic_batch_filter=target_batch, session_filter=session):
            matched_students.append(s)

    matched_students.sort(key=lambda s: getattr(s, "student_id", "") or "")

    mongo_id_list = [s.id for s in matched_students]

    existing_attendance = []
    if mongo_id_list:
        existing_attendance = await Attendance.find({
            "$and": [
                {"date": {"$gte": day_start, "$lte": day_end}},
                {"$or": [
                    {"student.$id": {"$in": mongo_id_list}},
                    {"student.id": {"$in": mongo_id_list}},
                    {"student": {"$in": mongo_id_list}}
                ]}
            ]
        }).to_list()

    def _extract_sid(student_link) -> Optional[str]:
        if not student_link:
            return None
        if hasattr(student_link, "id"):
            return str(student_link.id)
        if hasattr(student_link, "ref") and hasattr(student_link.ref, "id"):
            return str(student_link.ref.id)
        if isinstance(student_link, dict) and "$id" in student_link:
            return str(student_link["$id"])
        return str(student_link)

    slot_map: Dict[tuple, Attendance] = {}
    for att in existing_attendance:
        sid = _extract_sid(att.student)
        slot = getattr(att, "lecture_slot", 1) or 1
        if sid:
            slot_map[(sid, slot)] = att

    records = []
    l1_present = 0
    l1_absent = 0
    l2_present = 0
    l2_absent = 0

    for s in matched_students:
        sid_str = str(s.id)
        st_branch, st_acad_batch, st_session, _ = parse_student_branch_batch(
            s.branch, s.batch, s.academic_batch, s.session
        )
        session_str = f" ({st_session})" if st_session and st_branch == BRANCH_MANGALWAR else ""
        batch_label = f"{st_branch} • {st_acad_batch}{session_str}"

        st_name = getattr(s, "full_name", None)
        if not st_name and s.user:
            try:
                u = await User.get(s.user.ref.id) if hasattr(s.user, "ref") else s.user
                if u:
                    st_name = u.full_name
            except Exception:
                pass
        if not st_name:
            st_name = s.student_id

        # Slot 1
        att_slot1 = slot_map.get((sid_str, 1))
        st1_status = att_slot1.status if att_slot1 else "Not Marked"
        st1_subject = (att_slot1.subject if att_slot1 and att_slot1.subject else None) or "Physics"
        st1_id = str(att_slot1.id) if att_slot1 else None

        if st1_status == "Present":
            l1_present += 1
        elif st1_status == "Absent":
            l1_absent += 1

        # Slot 2
        att_slot2 = slot_map.get((sid_str, 2))
        st2_status = att_slot2.status if att_slot2 else "Not Marked"
        st2_subject = (att_slot2.subject if att_slot2 and att_slot2.subject else None) or "Mathematics"
        st2_id = str(att_slot2.id) if att_slot2 else None

        if st2_status == "Present":
            l2_present += 1
        elif st2_status == "Absent":
            l2_absent += 1

        records.append({
            "id": sid_str,
            "student_id": s.student_id,
            "roll_number": s.student_id,
            "student_name": st_name,
            "batch": batch_label,
            "branch": st_branch,
            "academic_batch": st_acad_batch,
            "session": st_session,
            "parent_mobile": getattr(s, "parent_mobile", None) or getattr(s, "mobile_number", None) or "+91 98220 33445",
            "lecture_1": {
                "slot": 1,
                "subject": st1_subject,
                "time": "09:00 AM – 10:30 AM",
                "status": st1_status,
                "attendance_id": st1_id,
                "notification_sent": st1_status == "Absent"
            },
            "lecture_2": {
                "slot": 2,
                "subject": st2_subject,
                "time": "11:00 AM – 12:30 PM",
                "status": st2_status,
                "attendance_id": st2_id,
                "notification_sent": st2_status == "Absent"
            }
        })

    tot = len(records)
    l1_rate = round((l1_present / tot) * 100) if tot > 0 else 0
    l2_rate = round((l2_present / tot) * 100) if tot > 0 else 0

    return {
        "date": date_formatted,
        "formatted_date": pretty_date,
        "branch": branch or "All",
        "academic_batch": academic_batch or "All",
        "session": session or "",
        "total_enrolled": tot,
        "lecture_1_summary": {
            "present": l1_present,
            "absent": l1_absent,
            "rate": l1_rate
        },
        "lecture_2_summary": {
            "present": l2_present,
            "absent": l2_absent,
            "rate": l2_rate
        },
        "records": records
    }

async def save_batch_date_attendance(payload: dict) -> dict:
    from app.services.student_service import resolve_student
    from app.core.branch_config import parse_student_branch_batch

    date_str = payload.get("date")
    if not date_str:
        raise HTTPException(status_code=400, detail="Date is required (YYYY-MM-DD)")

    clean_date = date_str.split("T")[0]
    target_date = datetime.strptime(clean_date, "%Y-%m-%d")
    day_start = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)

    records = payload.get("records") or []
    if not records:
        raise HTTPException(status_code=400, detail="No attendance records provided to save")

    saved_count = 0
    absent_count = 0

    for item in records:
        student_id_val = item.get("student_id")
        if not student_id_val:
            continue
        student = await resolve_student(str(student_id_val))
        if not student:
            continue

        st_branch, st_acad_batch, st_session, _ = parse_student_branch_batch(
            student.branch, student.batch, student.academic_batch, student.session
        )

        # Slot 1
        st1_status = item.get("lecture_1_status")
        if st1_status:
            st1_subject = item.get("lecture_1_subject") or "Physics"
            existing_s1 = await Attendance.find_one({
                "$and": [
                    {"$or": [
                        {"student.$id": student.id},
                        {"student.id": student.id},
                        {"student": student.id}
                    ]},
                    {"date": {"$gte": day_start, "$lte": day_end}},
                    {"lecture_slot": 1}
                ]
            })

            if st1_status == "Not Marked":
                if existing_s1:
                    await existing_s1.delete()
                    saved_count += 1
            else:
                if st1_status == "Absent":
                    absent_count += 1

                if existing_s1:
                    existing_s1.status = st1_status
                    existing_s1.subject = st1_subject
                    existing_s1.branch = st_branch
                    existing_s1.academic_batch = st_acad_batch
                    existing_s1.session = st_session
                    existing_s1.batch = st_acad_batch
                    if item.get("remarks"):
                        existing_s1.remarks = item["remarks"]
                    await existing_s1.save()
                else:
                    att1 = Attendance(
                        student=student,
                        date=day_start + timedelta(hours=9),
                        status=st1_status,
                        lecture_slot=1,
                        subject=st1_subject,
                        branch=st_branch,
                        academic_batch=st_acad_batch,
                        session=st_session,
                        batch=st_acad_batch,
                        remarks=item.get("remarks")
                    )
                    await att1.insert()
                saved_count += 1

        # Slot 2
        st2_status = item.get("lecture_2_status")
        if st2_status:
            st2_subject = item.get("lecture_2_subject") or "Mathematics"
            existing_s2 = await Attendance.find_one({
                "$and": [
                    {"$or": [
                        {"student.$id": student.id},
                        {"student.id": student.id},
                        {"student": student.id}
                    ]},
                    {"date": {"$gte": day_start, "$lte": day_end}},
                    {"lecture_slot": 2}
                ]
            })

            if st2_status == "Not Marked":
                if existing_s2:
                    await existing_s2.delete()
                    saved_count += 1
            else:
                if st2_status == "Absent":
                    absent_count += 1

                if existing_s2:
                    existing_s2.status = st2_status
                    existing_s2.subject = st2_subject
                    existing_s2.branch = st_branch
                    existing_s2.academic_batch = st_acad_batch
                    existing_s2.session = st_session
                    existing_s2.batch = st_acad_batch
                    if item.get("remarks"):
                        existing_s2.remarks = item["remarks"]
                    await existing_s2.save()
                else:
                    att2 = Attendance(
                        student=student,
                        date=day_start + timedelta(hours=11),
                        status=st2_status,
                        lecture_slot=2,
                        subject=st2_subject,
                        branch=st_branch,
                        academic_batch=st_acad_batch,
                        session=st_session,
                        batch=st_acad_batch,
                        remarks=item.get("remarks")
                    )
                    await att2.insert()
                saved_count += 1

    return {
        "success": True,
        "message": f"Successfully saved {saved_count} lecture attendance record(s) for {clean_date}",
        "date": clean_date,
        "saved_count": saved_count,
        "absent_count": absent_count,
        "students_processed": len(records)
    }

