from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from app.models.daily_activity import DailyActivity
from app.models.topic_duration import TopicDuration
from app.schemas.daily_activity import DailyActivityCreate, DailyActivityUpdate, DailyActivityResponse
from fastapi.security import OAuth2PasswordBearer
from app.services.auth_service import get_current_user

oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="api/auth/token", auto_error=False)

router = APIRouter(prefix="/daily-activities", tags=["Daily Activities"])

@router.get("", response_model=List[DailyActivityResponse])
async def list_daily_activities(
    teacher_name: Optional[str] = None,
    subject: Optional[str] = None,
    batch: Optional[str] = None,
    standard: Optional[str] = None,
    status: Optional[str] = None,
    token: Optional[str] = Depends(oauth2_scheme_optional)
):
    """Retrieve daily teacher activity records with flexible filtering"""
    if token:
        try:
            await get_current_user(token)
        except Exception:
            pass

    query = {}
    if teacher_name:
        query["teacher_name"] = {"$regex": teacher_name, "$options": "i"}
    if subject and subject != "All":
        query["subject"] = {"$regex": subject, "$options": "i"}
    if batch and batch != "All":
        query["batch"] = {"$regex": batch, "$options": "i"}
    if standard and standard != "All":
        query["standard"] = {"$regex": standard, "$options": "i"}
    if status and status != "All":
        query["status"] = status

    activities = await DailyActivity.find(query).sort("-created_at").to_list()

    result = []
    for act in activities:
        d = act.dict(exclude={"id", "_id"})
        d["id"] = str(act.id)
        result.append(DailyActivityResponse(**d))
    return result

@router.post("", response_model=DailyActivityResponse)
async def create_daily_activity(
    activity_in: DailyActivityCreate,
    token: Optional[str] = Depends(oauth2_scheme_optional)
):
    """Log a new daily teacher classroom activity and automatically sync to Topic Duration Matrix (In Progress)"""
    current_teacher = None
    if token:
        try:
            user = await get_current_user(token)
            current_teacher = user.full_name
        except Exception:
            pass

    data = activity_in.dict()
    if not data.get("teacher_name") and current_teacher:
        data["teacher_name"] = current_teacher

    if not data.get("activity_date"):
        data["activity_date"] = datetime.utcnow().strftime("%Y-%m-%d")

    activity = DailyActivity(**data)
    await activity.insert()

    # Automatically synchronize with Topic Duration Matrix (In Progress)
    try:
        topic_title = data.get("topic_taught", "").strip()
        raw_subj = data.get("subject", "").strip()
        batch_name = data.get("batch", "").strip()
        periods_logged = int(data.get("periods") or 1)

        # 1. Standardize subject name to match curriculum categories
        lower_subj = raw_subj.lower()
        if "physic" in lower_subj:
            standard_subj = "Physics"
        elif "chem" in lower_subj:
            standard_subj = "Chemistry"
        elif "math" in lower_subj:
            standard_subj = "Mathematics"
        elif "bio" in lower_subj:
            standard_subj = "Biology"
        else:
            standard_subj = raw_subj

        # 2. Standardize faculty name
        faculty_name = current_teacher or data.get("teacher_name")
        if not faculty_name or faculty_name == "Assigned Faculty":
            if standard_subj == "Physics":
                faculty_name = "Prof. Shubham Shinde"
            elif standard_subj == "Chemistry":
                faculty_name = "Prof. Sunita Patil"
            elif standard_subj == "Mathematics":
                faculty_name = "Prof. Rajesh Sharma"
            elif standard_subj == "Biology":
                faculty_name = "Prof. Amit Sawant"
            else:
                faculty_name = "Prof. Shubham Shinde"

        if topic_title and standard_subj:
            import re
            existing_topic = await TopicDuration.find_one({
                "$or": [
                    {"subject": {"$regex": f"^{re.escape(standard_subj)}$", "$options": "i"}},
                    {"subject": {"$regex": f"^{re.escape(raw_subj)}$", "$options": "i"}}
                ],
                "batch": {"$regex": f"^{re.escape(batch_name)}$", "$options": "i"},
                "topic_name": {"$regex": re.escape(topic_title), "$options": "i"}
            })

            if existing_topic:
                existing_topic.completed_periods = (existing_topic.completed_periods or 0) + periods_logged
                if existing_topic.status == "Upcoming":
                    existing_topic.status = "In Progress"
                if not existing_topic.start_date:
                    existing_topic.start_date = data["activity_date"]
                if existing_topic.completed_periods >= existing_topic.required_periods:
                    existing_topic.status = "Completed"
                    if not existing_topic.end_date:
                        existing_topic.end_date = data["activity_date"]
                existing_topic.updated_at = datetime.utcnow()
                await existing_topic.save()
            else:
                chapter_name = "Curriculum Chapter"
                if "-" in topic_title:
                    chapter_name = topic_title.split("-")[0].strip()
                elif ":" in topic_title:
                    chapter_name = topic_title.split(":")[0].strip()

                std = data.get("standard")
                if not std:
                    std = "Class 11th" if "11th" in batch_name else "Class 12th"

                req_periods = max(int(data.get("total_planned_periods") or 3), periods_logged)

                new_topic_plan = TopicDuration(
                    topic_id=f"TOP-{int(datetime.utcnow().timestamp())}",
                    standard=std,
                    batch=batch_name,
                    subject=standard_subj,
                    teacher_name=faculty_name,
                    chapter=chapter_name,
                    topic_name=topic_title,
                    start_date=data["activity_date"],
                    end_date=None,
                    required_periods=req_periods,
                    period_duration_mins=45,
                    completed_periods=periods_logged,
                    status="In Progress",
                    academic_year="2026-2027",
                    month=datetime.utcnow().strftime("%B %Y"),
                    remarks=data.get("remarks") or "Initiated from Teacher Daily Activity Log."
                )
                await new_topic_plan.insert()
    except Exception as e:
        print(f"Error syncing daily activity to topic duration matrix: {e}")

    res_data = activity.dict(exclude={"id", "_id"})
    res_data["id"] = str(activity.id)
    return DailyActivityResponse(**res_data)

@router.get("/{id}", response_model=DailyActivityResponse)
async def get_daily_activity(id: str, token: Optional[str] = Depends(oauth2_scheme_optional)):
    """Get single daily activity by ID"""
    if token:
        try:
            await get_current_user(token)
        except Exception:
            pass

    try:
        activity = await DailyActivity.get(ObjectId(id))
    except Exception:
        activity = None

    if not activity:
        raise HTTPException(status_code=404, detail="Daily activity not found")

    d = activity.dict(exclude={"id", "_id"})
    d["id"] = str(activity.id)
    return DailyActivityResponse(**d)

@router.put("/{id}", response_model=DailyActivityResponse)
async def update_daily_activity(
    id: str,
    activity_in: DailyActivityUpdate,
    token: Optional[str] = Depends(oauth2_scheme_optional)
):
    """Update an existing daily activity log"""
    if token:
        try:
            await get_current_user(token)
        except Exception:
            pass

    try:
        activity = await DailyActivity.get(ObjectId(id))
    except Exception:
        activity = None

    if not activity:
        raise HTTPException(status_code=404, detail="Daily activity not found")

    update_data = activity_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(activity, key, value)
    activity.updated_at = datetime.utcnow()

    await activity.save()

    d = activity.dict(exclude={"id", "_id"})
    d["id"] = str(activity.id)
    return DailyActivityResponse(**d)

@router.delete("/{id}")
async def delete_daily_activity(id: str, token: Optional[str] = Depends(oauth2_scheme_optional)):
    """Delete a daily activity log"""
    if token:
        try:
            await get_current_user(token)
        except Exception:
            pass

    try:
        activity = await DailyActivity.get(ObjectId(id))
    except Exception:
        activity = None

    if not activity:
        raise HTTPException(status_code=404, detail="Daily activity not found")

    await activity.delete()
    return {"message": "Daily activity deleted successfully"}
