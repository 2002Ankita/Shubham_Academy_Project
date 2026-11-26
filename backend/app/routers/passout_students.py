from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from datetime import datetime
from bson import ObjectId

from app.models.passout_student import PassoutStudent
from app.models.student import Student
from app.models.attendance import Attendance
from app.models.daily_activity import DailyActivity
from app.routers.auth import oauth2_scheme
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/passout-students", tags=["Passout Students"])


def _format_passout(doc: PassoutStudent) -> dict:
    return {
        "id": str(doc.id),
        "passout_id": doc.passout_id,
        "student_id": doc.student_id,
        "roll_number": doc.roll_number,
        "student_name": doc.student_name,
        "branch": doc.branch,
        "standard": doc.standard,
        "academic_batch": doc.academic_batch,
        "passing_year": doc.passing_year,
        "mobile_number": doc.mobile_number,
        "parent_mobile": doc.parent_mobile,
        "college_name": doc.college_name,
        "college_city": doc.college_city,
        "course_or_degree": doc.course_or_degree,
        "entrance_exam": doc.entrance_exam,
        "entrance_score": doc.entrance_score,
        "remarks": doc.remarks,
        "attendance_percentage": doc.attendance_percentage,
        "lectures_attended": doc.lectures_attended,
        "total_lectures": doc.total_lectures,
        "daily_logs_count": doc.daily_logs_count,
        "daily_log_summary": doc.daily_log_summary,
        "recorded_by": doc.recorded_by,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
        "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
    }


def _branch_matches(item_branch: Optional[str], filter_branch: Optional[str]) -> bool:
    if not filter_branch or filter_branch.upper() == "ALL":
        return True
    ib = (item_branch or "").lower()
    fb = filter_branch.lower()
    if "mangal" in fb:
        return "mangal" in ib
    if "tarabai" in fb:
        return "tarabai" in ib or ("mangal" not in ib)
    return True


async def _compute_student_attendance_and_logs(student_id: Optional[str], roll_number: Optional[str], academic_batch: Optional[str], branch: Optional[str]):
    """Computes attendance stats & daily activity logs count for a student/batch."""
    attendance_pct = 0.0
    lectures_attended = 0
    total_lectures = 0
    daily_logs_count = 0
    daily_log_summary = ""

    student_doc = None
    if student_id:
        try:
            if ObjectId.is_valid(student_id):
                student_doc = await Student.get(ObjectId(student_id))
            if not student_doc:
                student_doc = await Student.find_one({"student_id": student_id})
        except Exception:
            pass
    if not student_doc and roll_number:
        student_doc = await Student.find_one({"student_id": roll_number})

    if student_doc:
        try:
            att_records = await Attendance.find({"student.id": student_doc.id}).to_list()
            total_lectures = len(att_records)
            if total_lectures > 0:
                lectures_attended = sum(
                    1 for a in att_records
                    if (getattr(a, "status", "") or "").lower() in ["present", "p", "late"]
                )
                attendance_pct = round((lectures_attended / total_lectures) * 100.0, 1)
        except Exception:
            pass

    batch_key = academic_batch or (getattr(student_doc, "academic_batch", None) if student_doc else None)
    if batch_key:
        try:
            all_activities = await DailyActivity.find_all().to_list()
            matching = [
                d for d in all_activities
                if (batch_key.lower() in (getattr(d, "batch", "") or "").lower())
                and _branch_matches(getattr(d, "branch", ""), branch)
            ]
            daily_logs_count = len(matching)
            if matching:
                latest = sorted(matching, key=lambda x: str(getattr(x, "date", "") or ""), reverse=True)[0]
                daily_log_summary = f"Latest: {getattr(latest, 'subject', '')} - {getattr(latest, 'topic', '')} ({getattr(latest, 'date', '')})"
        except Exception:
            pass

    return attendance_pct, lectures_attended, total_lectures, daily_logs_count, daily_log_summary


@router.get("")
async def list_passout_students(
    branch: Optional[str] = None,
    passing_year: Optional[str] = None,
    search: Optional[str] = None,
    token: str = Depends(oauth2_scheme)
):
    current_user = await get_current_user(token)
    user_role = (getattr(current_user, "role", "") or "").upper().replace("-", "_")
    user_branch = getattr(current_user, "branch", None)
    if user_role == "ADMIN" and user_branch:
        branch = user_branch

    docs = await PassoutStudent.find_all().sort("-created_at").to_list()
    results = []
    for d in docs:
        if not _branch_matches(d.branch, branch):
            continue
        if passing_year and passing_year != "ALL" and d.passing_year != passing_year:
            continue
        if search:
            q = search.lower().strip()
            hay = f"{d.student_name} {d.roll_number or ''} {d.college_name} {d.course_or_degree or ''} {d.entrance_exam or ''}".lower()
            if q not in hay:
                continue
        results.append(_format_passout(d))
    return results


@router.post("")
async def create_passout_student(payload: dict, token: str = Depends(oauth2_scheme)):
    current_user = await get_current_user(token)
    user_role = (getattr(current_user, "role", "") or "").upper().replace("-", "_")
    if user_role not in ["ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Only Admins can record passout students")

    student_name = (payload.get("student_name") or "").strip()
    college_name = (payload.get("college_name") or "").strip()
    if not student_name or not college_name:
        raise HTTPException(status_code=400, detail="Student Name and Admitted College Name are required")

    branch = payload.get("branch") or getattr(current_user, "branch", None) or "Tarabai Park"
    if user_role == "ADMIN" and getattr(current_user, "branch", None):
        branch = current_user.branch

    att_pct, lec_att, tot_lec, logs_cnt, logs_sum = await _compute_student_attendance_and_logs(
        payload.get("student_id"),
        payload.get("roll_number"),
        payload.get("academic_batch"),
        branch
    )

    doc = PassoutStudent(
        student_id=payload.get("student_id"),
        roll_number=(payload.get("roll_number") or "").strip() or None,
        student_name=student_name,
        branch=branch,
        standard=payload.get("standard") or "12th Science",
        academic_batch=payload.get("academic_batch") or None,
        passing_year=payload.get("passing_year") or "2025-2026",
        mobile_number=payload.get("mobile_number") or None,
        parent_mobile=payload.get("parent_mobile") or None,
        college_name=college_name,
        college_city=(payload.get("college_city") or "").strip() or None,
        course_or_degree=(payload.get("course_or_degree") or "").strip() or None,
        entrance_exam=(payload.get("entrance_exam") or "").strip() or None,
        entrance_score=(payload.get("entrance_score") or "").strip() or None,
        remarks=(payload.get("remarks") or "").strip() or None,
        attendance_percentage=float(payload.get("attendance_percentage") or att_pct or 0.0),
        lectures_attended=int(payload.get("lectures_attended") or lec_att or 0),
        total_lectures=int(payload.get("total_lectures") or tot_lec or 0),
        daily_logs_count=int(payload.get("daily_logs_count") or logs_cnt or 0),
        daily_log_summary=payload.get("daily_log_summary") or logs_sum or None,
        recorded_by=getattr(current_user, "full_name", None) or getattr(current_user, "email", "Admin"),
    )
    await doc.insert()
    return _format_passout(doc)


@router.put("/{id}")
async def update_passout_student(id: str, payload: dict, token: str = Depends(oauth2_scheme)):
    current_user = await get_current_user(token)
    user_role = (getattr(current_user, "role", "") or "").upper().replace("-", "_")
    if user_role not in ["ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Only Admins can update passout student records")

    doc = await PassoutStudent.get(ObjectId(id)) if ObjectId.is_valid(id) else await PassoutStudent.find_one({"passout_id": id})
    if not doc:
        raise HTTPException(status_code=404, detail="Passout student record not found")

    updatable = [
        "student_name", "roll_number", "branch", "standard", "academic_batch",
        "passing_year", "mobile_number", "parent_mobile", "college_name",
        "college_city", "course_or_degree", "entrance_exam", "entrance_score",
        "remarks", "attendance_percentage", "lectures_attended", "total_lectures",
        "daily_logs_count", "daily_log_summary"
    ]
    for field in updatable:
        if field in payload and payload[field] is not None:
            setattr(doc, field, payload[field])
    doc.updated_at = datetime.utcnow()
    await doc.save()
    return _format_passout(doc)


@router.delete("/{id}")
async def delete_passout_student(id: str, token: str = Depends(oauth2_scheme)):
    current_user = await get_current_user(token)
    user_role = (getattr(current_user, "role", "") or "").upper().replace("-", "_")
    if user_role not in ["ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Only Admins can delete passout student records")

    doc = await PassoutStudent.get(ObjectId(id)) if ObjectId.is_valid(id) else await PassoutStudent.find_one({"passout_id": id})
    if not doc:
        raise HTTPException(status_code=404, detail="Passout student record not found")
    await doc.delete()
    return {"message": "Passout student record deleted"}


@router.get("/{id}/logs")
async def get_passout_student_attendance_and_logs(id: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    doc = await PassoutStudent.get(ObjectId(id)) if ObjectId.is_valid(id) else await PassoutStudent.find_one({"passout_id": id})
    if not doc:
        raise HTTPException(status_code=404, detail="Passout student record not found")

    attendance_records = []
    student_doc = None
    if doc.student_id and ObjectId.is_valid(doc.student_id):
        student_doc = await Student.get(ObjectId(doc.student_id))
    if not student_doc and doc.roll_number:
        student_doc = await Student.find_one({"student_id": doc.roll_number})

    if student_doc:
        atts = await Attendance.find({"student.id": student_doc.id}).sort("-date").limit(50).to_list()
        for a in atts:
            attendance_records.append({
                "id": str(a.id),
                "date": str(getattr(a, "date", "") or ""),
                "subject": getattr(a, "subject", "") or "Lecture",
                "status": getattr(a, "status", "") or "Present",
                "lecture_slot": getattr(a, "lecture_slot", None) or getattr(a, "lecture_number", 1),
                "remarks": getattr(a, "remarks", None) or ""
            })

    daily_logs = []
    if doc.academic_batch:
        all_acts = await DailyActivity.find_all().to_list()
        matched = [
            d for d in all_acts
            if doc.academic_batch.lower() in (getattr(d, "batch", "") or "").lower()
            and _branch_matches(getattr(d, "branch", ""), doc.branch)
        ]
        matched.sort(key=lambda x: str(getattr(x, "date", "") or ""), reverse=True)
        for d in matched[:30]:
            daily_logs.append({
                "id": str(d.id),
                "date": str(getattr(d, "date", "") or ""),
                "teacher_name": getattr(d, "teacher_name", "") or "Faculty",
                "subject": getattr(d, "subject", "") or "",
                "topic": getattr(d, "topic", "") or "",
                "chapter": getattr(d, "chapter", "") or "",
                "batch": getattr(d, "batch", "") or "",
                "remarks": getattr(d, "remarks", "") or ""
            })

    return {
        "passout": _format_passout(doc),
        "attendance_records": attendance_records,
        "daily_logs": daily_logs
    }
