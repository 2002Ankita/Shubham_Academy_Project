from app.models.batch import Batch
from app.models.teacher import Teacher
from app.models.student import Student
from app.models.user import User
from app.schemas.batch import BatchCreate
from app.services.teacher_service import resolve_teacher
from fastapi import HTTPException
from bson import ObjectId
from typing import Optional, List, Dict, Any

async def ensure_default_batches():
    """Seed initial batches and link student profiles if none exist."""
    count = await Batch.count()
    if count == 0:
        teacher = await Teacher.find_one(Teacher.employee_id == "EMP-A1EBC7")
        teacher_name = "More A.D"
        if teacher:
            if isinstance(teacher.user, User):
                teacher_name = teacher.user.full_name
            elif teacher.user:
                try:
                    u = await User.get(teacher.user.ref.id)
                    if u:
                        teacher_name = u.full_name
                except Exception:
                    pass

        default_batches = [
            Batch(
                name="12th pcm tarabai park",
                standard="12th Science",
                subject="Physics",
                room="Room 201",
                time="08:00 AM – 10:30 AM",
                student_count=24,
                teacher_name=teacher_name,
                teacher=teacher,
                batch_name="PCM",
                class_code="12-PCM",
                days=["Monday", "Wednesday", "Friday"],
                timetable=[
                    {"day": "Monday", "time": "08:00 AM – 10:30 AM", "room": "Room 201", "subject": "Physics", "class_code": "12-PCM"},
                    {"day": "Wednesday", "time": "08:00 AM – 10:30 AM", "room": "Room 201", "subject": "Physics", "class_code": "12-PCM"},
                    {"day": "Friday", "time": "08:00 AM – 10:30 AM", "room": "Room 201", "subject": "Physics", "class_code": "12-PCM"}
                ],
                academic_year="2025-2026",
                branch="Tarabai Park",
                status="Active"
            ),
            Batch(
                name="12th pcb tarabai park",
                standard="12th Science",
                subject="Physics",
                room="Room 202",
                time="10:30 AM – 01:00 PM",
                student_count=22,
                teacher_name=teacher_name,
                teacher=teacher,
                batch_name="PCB",
                class_code="12-PCB",
                days=["Monday", "Wednesday", "Friday"],
                timetable=[
                    {"day": "Monday", "time": "10:30 AM – 01:00 PM", "room": "Room 202", "subject": "Physics", "class_code": "12-PCB"},
                    {"day": "Wednesday", "time": "10:30 AM – 01:00 PM", "room": "Room 202", "subject": "Physics", "class_code": "12-PCB"},
                    {"day": "Friday", "time": "10:30 AM – 01:00 PM", "room": "Room 202", "subject": "Physics", "class_code": "12-PCB"}
                ],
                academic_year="2025-2026",
                branch="Tarabai Park",
                status="Active"
            ),
            Batch(
                name="11th pcm tarabai park",
                standard="11th Science",
                subject="Physics",
                room="Physics Lab 1",
                time="08:00 AM – 10:30 AM",
                student_count=28,
                teacher_name=teacher_name,
                teacher=teacher,
                batch_name="PCM",
                class_code="11-PCM",
                days=["Tuesday", "Thursday", "Saturday"],
                timetable=[
                    {"day": "Tuesday", "time": "08:00 AM – 10:30 AM", "room": "Physics Lab 1", "subject": "Physics", "class_code": "11-PCM"},
                    {"day": "Thursday", "time": "08:00 AM – 10:30 AM", "room": "Physics Lab 1", "subject": "Physics", "class_code": "11-PCM"},
                    {"day": "Saturday", "time": "08:00 AM – 10:30 AM", "room": "Physics Lab 1", "subject": "Physics", "class_code": "11-PCM"}
                ],
                academic_year="2025-2026",
                branch="Tarabai Park",
                status="Active"
            ),
            Batch(
                name="12th pcm mangalvar peth",
                standard="12th Science",
                subject="Physics",
                room="Room 101",
                time="08:00 AM – 10:30 AM",
                student_count=25,
                teacher_name=teacher_name,
                teacher=teacher,
                batch_name="PCM",
                class_code="12-PCM-MP",
                days=["Monday", "Wednesday", "Friday"],
                timetable=[
                    {"day": "Monday", "time": "08:00 AM – 10:30 AM", "room": "Room 101", "subject": "Physics", "class_code": "12-PCM-MP"},
                    {"day": "Wednesday", "time": "08:00 AM – 10:30 AM", "room": "Room 101", "subject": "Physics", "class_code": "12-PCM-MP"},
                    {"day": "Friday", "time": "08:00 AM – 10:30 AM", "room": "Room 101", "subject": "Physics", "class_code": "12-PCM-MP"}
                ],
                academic_year="2025-2026",
                branch="Mangalvar Peth",
                status="Active"
            ),
            Batch(
                name="11th pcm mangalvar peth",
                standard="11th Science",
                subject="Physics",
                room="Room 102",
                time="10:30 AM – 01:00 PM",
                student_count=22,
                teacher_name=teacher_name,
                teacher=teacher,
                batch_name="PCM",
                class_code="11-PCM-MP",
                days=["Tuesday", "Thursday", "Saturday"],
                timetable=[
                    {"day": "Tuesday", "time": "10:30 AM – 01:00 PM", "room": "Room 102", "subject": "Physics", "class_code": "11-PCM-MP"},
                    {"day": "Thursday", "time": "10:30 AM – 01:00 PM", "room": "Room 102", "subject": "Physics", "class_code": "11-PCM-MP"},
                    {"day": "Saturday", "time": "10:30 AM – 01:00 PM", "room": "Room 102", "subject": "Physics", "class_code": "11-PCM-MP"}
                ],
                academic_year="2025-2026",
                branch="Mangalvar Peth",
                status="Active"
            )
        ]
        for b in default_batches:
            await b.insert()

    # Ensure student profiles exist for student users
    student_count = await Student.count()
    if student_count == 0:
        student_users = await User.find({"$or": [{"role": "student"}, {"role": "STUDENT"}]}).to_list()
        sample_meta = [
            ("STU-1001", "9822110001", "12th Science", "A", 45000.0, 45000.0),
            ("STU-1002", "9822110002", "12th Science", "A", 45000.0, 30000.0),
            ("STU-1003", "9822110003", "12th Science", "B", 45000.0, 45000.0),
            ("STU-1004", "9822110004", "12th Science", "B", 45000.0, 20000.0),
            ("STU-1005", "9822110005", "11th Science", "A", 40000.0, 40000.0)
        ]
        for idx, u in enumerate(student_users):
            meta = sample_meta[idx % len(sample_meta)]
            stu = Student(
                user=u,
                student_id=meta[0],
                mobile_number=meta[1],
                parent_mobile="9822999000",
                email=u.email,
                standard=meta[2],
                batch=meta[3],
                branch="Tarabai Park",
                academic_year="2025-2026",
                total_fees=meta[4],
                paid_fees=meta[5],
                remaining_fees=meta[4] - meta[5],
                profile_completed=True
            )
            try:
                await stu.insert()
            except Exception:
                pass

def _format_batch(b: Batch) -> dict:
    tid_str = None
    if b.teacher:
        if hasattr(b.teacher, "id"):
            tid_str = str(b.teacher.id)
        elif hasattr(b.teacher, "ref"):
            tid_str = str(b.teacher.ref.id)

    return {
        "id": str(b.id),
        "name": b.name,
        "standard": b.standard,
        "subject": b.subject,
        "room": b.room or "Room 201",
        "time": b.time or "09:00 AM – 10:00 AM",
        "date": b.date or "",
        "student_count": b.student_count or 0,
        "teacher_name": b.teacher_name or "",
        "teacher_id": tid_str,
        "batch_name": b.batch_name or (b.name.split("Batch")[1].strip() if "Batch" in b.name else "A"),
        "class_code": b.class_code or f"{b.standard[:2]}-{b.batch_name or 'A'}",
        "days": b.days or ["Monday", "Wednesday", "Friday"],
        "timetable": b.timetable or [],
        "academic_year": getattr(b, "academic_year", "2025-2026"),
        "branch": getattr(b, "branch", "Tarabai Park"),
        "status": getattr(b, "status", "Active")
    }

async def get_all_batches(
    teacher_id: Optional[str] = None,
    standard: Optional[str] = None,
    branch: Optional[str] = None
) -> List[dict]:
    await ensure_default_batches()
    query = {}
    if standard:
        query["standard"] = standard

    batches = await Batch.find(query).to_list()

    if branch and str(branch).upper() != "ALL":
        target = str(branch).lower().strip()
        filtered = []
        for b in batches:
            b_br = (getattr(b, "branch", "") or "").lower().strip()
            b_name = (b.name or "").lower().strip()
            if "tarabai" in target:
                if "tarabai" in b_br or "tarabai" in b_name:
                    filtered.append(b)
            elif "mangal" in target or "manglavar" in target:
                if "mangal" in b_br or "manglavar" in b_br or "mangal" in b_name or "manglavar" in b_name:
                    filtered.append(b)
            elif target in b_br or target in b_name:
                filtered.append(b)
        batches = filtered
    
    if teacher_id:
        teacher = await resolve_teacher(teacher_id)
        if teacher:
            first_name = ""
            full_name = ""
            if isinstance(teacher.user, User):
                full_name = teacher.user.full_name
            elif teacher.user:
                try:
                    u = await User.get(teacher.user.ref.id)
                    if u:
                        full_name = u.full_name
                except Exception:
                    pass
            if full_name:
                first_name = full_name.split()[0].lower()
            teacher_sub = getattr(teacher, "specialization", "") or getattr(teacher, "subject", "") or ""

            filtered = []
            for b in batches:
                is_match = False
                if b.teacher and hasattr(b.teacher, "id") and b.teacher.id == teacher.id:
                    is_match = True
                elif b.teacher and hasattr(b.teacher, "ref") and b.teacher.ref.id == teacher.id:
                    is_match = True
                elif b.teacher_name and full_name and (full_name.lower() in b.teacher_name.lower() or b.teacher_name.lower() in full_name.lower()):
                    is_match = True
                elif b.teacher_name and first_name and first_name in b.teacher_name.lower():
                    is_match = True
                elif not b.teacher_name:
                    is_match = True

                # Also inspect timetable slots so imported or scheduled slots for this faculty are included
                if not is_match and b.timetable:
                    for s in b.timetable:
                        st = s.get("teacher_name") or ""
                        ssub = s.get("subject") or ""
                        if st and (
                            (full_name and (full_name.lower() in st.lower() or st.lower() in full_name.lower())) or
                            (first_name and first_name in st.lower())
                        ):
                            is_match = True
                            break
                        if teacher_sub and ssub and teacher_sub.lower() in ssub.lower():
                            is_match = True
                            break

                if is_match:
                    filtered.append(b)
            batches = filtered

    return [_format_batch(b) for b in batches]

async def get_teacher_batches(teacher_identifier: str) -> List[dict]:
    """Get all batches assigned to a specific teacher."""
    return await get_all_batches(teacher_id=teacher_identifier)

async def get_batch_by_id(batch_id: str) -> dict:
    try:
        b = await Batch.get(ObjectId(batch_id))
    except Exception:
        b = None
    if not b:
        raise HTTPException(status_code=404, detail="Batch not found")
    return _format_batch(b)

async def create_batch(data: dict) -> dict:
    teacher = None
    if data.get("teacher_id"):
        teacher = await resolve_teacher(data["teacher_id"])
    elif data.get("teacher_name"):
        teacher = await resolve_teacher(data["teacher_name"])

    batch = Batch(
        name=data["name"],
        standard=data["standard"],
        subject=data["subject"],
        room=data.get("room", "Room 201"),
        time=data.get("time", "09:00 AM – 10:00 AM"),
        date=data.get("date"),
        student_count=int(data.get("student_count", 0)),
        teacher_name=data.get("teacher_name") or (teacher.user.full_name if teacher and isinstance(teacher.user, User) else ""),
        teacher=teacher,
        batch_name=data.get("batch_name") or "A",
        class_code=data.get("class_code"),
        days=data.get("days") or ["Monday", "Wednesday", "Friday"],
        timetable=data.get("timetable") or [],
        academic_year=data.get("academic_year", "2025-2026"),
        branch=data.get("branch", "Tarabai Park"),
        status=data.get("status", "Active")
    )
    await batch.insert()
    return _format_batch(batch)

async def update_batch(batch_id: str, data: dict) -> dict:
    try:
        b = await Batch.get(ObjectId(batch_id))
    except Exception:
        b = None
    if not b:
        raise HTTPException(status_code=404, detail="Batch not found")

    for k, v in data.items():
        if k in {"id", "_id"}:
            continue
        if hasattr(b, k):
            setattr(b, k, v)

    if data.get("teacher_id"):
        t = await resolve_teacher(data["teacher_id"])
        if t:
            b.teacher = t

    await b.save()
    return _format_batch(b)

async def delete_batch(batch_id: str) -> dict:
    try:
        b = await Batch.get(ObjectId(batch_id))
    except Exception:
        b = None
    if not b:
        raise HTTPException(status_code=404, detail="Batch not found")
    await b.delete()
    return {"message": "Batch deleted successfully"}

async def get_batch_students(batch_id: str) -> List[dict]:
    batch_dict = await get_batch_by_id(batch_id)
    std = batch_dict["standard"]
    batch_name = batch_dict["batch_name"]

    query = {}
    if std and batch_name:
        query = {
            "$and": [
                {"standard": std},
                {"batch": batch_name}
            ]
        }
    elif std:
        query = {"standard": std}
    elif batch_name:
        query = {"batch": batch_name}

    students = await Student.find(query).to_list()
    if not students and std:
        students = await Student.find({"standard": std}).to_list()
    if not students:
        students = await Student.find_all().to_list()

    from app.services.student_service import _format_student
    return [await _format_student(s) for s in students]

async def import_timetable_slots_service(items: List[Dict[str, Any]]) -> dict:
    """Import timetable slots in bulk from Excel or single slot entry and link to batches and teachers."""
    import re
    updated_batches = []
    
    faculty_by_subject = {
        "Physics": "More A.D",
        "Chemistry": "More A.D",
        "Mathematics": "veer 1",
        "Biology": "Shri"
    }

    for item in items:
        day = (item.get("day") or item.get("Day") or "Monday").capitalize()
        raw_time = item.get("time") or item.get("time_slot") or item.get("Time Slot") or "09:00 AM – 10:00 AM"
        # Standardize dash in time string
        time_slot = raw_time.replace("-", "–").replace("—", "–").strip()
        subject = (item.get("subject") or item.get("Subject") or "Physics").strip()
        batch_name = (item.get("batch") or item.get("class_batch") or item.get("Class / Batch") or "12th pcm tarabai park").strip()
        room = item.get("room") or item.get("Room") or "Room 201"
        branch = item.get("branch") or item.get("Branch") or ("Mangalwar Peth" if "mangalwar" in batch_name.lower() else "Tarabai Park")
        teacher_name = item.get("teacher_name") or item.get("teacher") or item.get("Teacher Name") or ""

        if not teacher_name:
            sub_low = subject.lower()
            if "physic" in sub_low:
                teacher_name = "More A.D"
            elif "chem" in sub_low:
                teacher_name = "More A.D"
            elif "math" in sub_low:
                teacher_name = "veer 1"
            elif "bio" in sub_low:
                teacher_name = "Shri"
            else:
                teacher_name = faculty_by_subject.get(subject, "More A.D")

        # 1. Search for batch with exact name and subject
        batch = await Batch.find_one({
            "name": {"$regex": f"^{re.escape(batch_name)}$", "$options": "i"},
            "subject": {"$regex": f"^{re.escape(subject)}$", "$options": "i"}
        })
        # 2. Search for batch with name ending in subject (e.g. "12th Science Tarabai Park (Batch A) - Physics")
        if not batch:
            batch = await Batch.find_one({
                "name": {"$regex": f"^{re.escape(batch_name)} - {re.escape(subject)}$", "$options": "i"}
            })
        # 3. Search for batch by name only
        if not batch:
            batch = await Batch.find_one({"name": {"$regex": f"^{re.escape(batch_name)}$", "$options": "i"}})
        # 4. Search by partial name prefix
        if not batch:
            first_word = batch_name.split()[0] if batch_name else "12th"
            batch = await Batch.find_one({
                "name": {"$regex": first_word, "$options": "i"},
                "subject": {"$regex": f"^{re.escape(subject)}$", "$options": "i"}
            })
        if not batch:
            first_word = batch_name.split()[0] if batch_name else "12th"
            batch = await Batch.find_one({"name": {"$regex": first_word, "$options": "i"}})

        if not batch:
            std = "12th Science" if "12" in batch_name else "11th Science"
            batch_label = "A" if "A" in batch_name else ("B" if "B" in batch_name else "A")
            class_code = f"{std[:2]}-{batch_label}"
            batch = Batch(
                name=f"{batch_name} - {subject}" if not batch_name.endswith(subject) else batch_name,
                standard=std,
                subject=subject,
                room=room,
                time=time_slot,
                teacher_name=teacher_name,
                days=[day],
                timetable=[],
                academic_year="2025-2026",
                branch=branch,
                status="Active",
                class_code=class_code,
                batch_name=batch_label
            )
            await batch.insert()

        if batch.timetable is None:
            batch.timetable = []

        code = batch.class_code or f"{batch.standard[:2]}-{batch.batch_name or 'A'}"

        new_slot = {
            "day": day,
            "time": time_slot,
            "room": room,
            "subject": subject,
            "class_code": code,
            "teacher_name": teacher_name,
            "branch": branch
        }

        norm_target = time_slot.replace(" ", "").replace("-", "–")
        slot_updated = False
        for idx, s in enumerate(batch.timetable):
            s_day = s.get("day", "").lower()
            s_time = s.get("time", "").replace(" ", "").replace("-", "–")
            if s_day == day.lower() and s_time == norm_target and (not s.get("subject") or s.get("subject", "").lower() == subject.lower()):
                batch.timetable[idx] = new_slot
                slot_updated = True
                break

        if not slot_updated:
            batch.timetable.append(new_slot)

        if not batch.days:
            batch.days = []
        if day not in batch.days:
            batch.days.append(day)

        if teacher_name and (not batch.teacher_name or batch.teacher_name in ["Assigned Faculty", ""]):
            batch.teacher_name = teacher_name

        await batch.save()
        if str(batch.id) not in updated_batches:
            updated_batches.append(str(batch.id))

    return {"message": f"Successfully imported {len(items)} timetable slots", "updated_batches": updated_batches}

async def delete_timetable_slot_service(data: Dict[str, Any]) -> dict:
    """Delete a specific timetable slot from batches."""
    day = data.get("day", "").capitalize()
    time_slot = data.get("time") or data.get("time_slot") or ""
    norm_time = time_slot.replace(" ", "").replace("-", "–")
    subject = data.get("subject", "").strip()
    batch_name = data.get("batch") or data.get("class_batch") or ""
    batch_id = data.get("batch_id")

    query = {}
    if batch_id:
        try:
            from bson import ObjectId
            query["_id"] = ObjectId(batch_id)
        except Exception:
            pass

    batches = await Batch.find(query).to_list() if query else await Batch.find().to_list()
    deleted_count = 0

    for b in batches:
        if not b.timetable:
            continue
        original_len = len(b.timetable)
        b.timetable = [
            s for s in b.timetable
            if not (
                s.get("day", "").lower() == day.lower() and
                s.get("time", "").replace(" ", "").replace("-", "–") == norm_time and
                (not subject or s.get("subject", "").lower() == subject.lower()) and
                (not batch_name or batch_name.lower() in b.name.lower() or b.name.lower() in batch_name.lower())
            )
        ]
        if len(b.timetable) < original_len:
            deleted_count += (original_len - len(b.timetable))
            await b.save()

    return {"message": f"Successfully deleted {deleted_count} timetable slot(s)", "deleted": deleted_count}

