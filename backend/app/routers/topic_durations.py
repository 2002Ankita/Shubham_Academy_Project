from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from app.models.topic_duration import TopicDuration
from app.models.daily_activity import DailyActivity
from app.schemas.topic_duration import (
    TopicDurationCreate,
    TopicDurationUpdate,
    TopicDurationResponse,
    TopicDurationMatrixSummary
)
from fastapi.security import OAuth2PasswordBearer
from app.services.auth_service import get_current_user

oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="api/auth/token", auto_error=False)

router = APIRouter(prefix="/topic-durations", tags=["Topic Durations & Curriculum Matrix"])

@router.get("", response_model=List[TopicDurationResponse])
async def list_topic_durations(
    subject: Optional[str] = None,
    teacher: Optional[str] = None,
    batch: Optional[str] = None,
    standard: Optional[str] = None,
    status: Optional[str] = None,
    month: Optional[str] = None,
    academic_year: Optional[str] = None,
    token: Optional[str] = Depends(oauth2_scheme_optional)
):
    """Retrieve curriculum topic durations with optional filters"""
    if token:
        try:
            await get_current_user(token)
        except Exception:
            pass

    query = {}
    if subject and subject != "All":
        query["subject"] = {"$regex": subject, "$options": "i"}
    if teacher and teacher != "All":
        query["teacher_name"] = {"$regex": teacher, "$options": "i"}
    if batch and batch != "All":
        query["batch"] = {"$regex": batch, "$options": "i"}
    if standard and standard != "All":
        query["standard"] = {"$regex": standard, "$options": "i"}
    if status and status != "All":
        query["status"] = status
    if month and month != "All":
        query["month"] = month
    if academic_year and academic_year != "All":
        query["academic_year"] = academic_year

    topics = await TopicDuration.find(query).sort("start_date").to_list()

    # If database is empty, automatically seed initial curriculum dataset
    if not topics and not query:
        await seed_curriculum_database()
        topics = await TopicDuration.find(query).sort("start_date").to_list()

    # Deduplicate topics by (subject, batch, topic_name) and purge duplicates from DB
    seen_keys = {}
    unique_topics = []
    duplicates_to_delete = []

    for t in topics:
        subj_norm = (t.subject or "").strip().lower()
        if "physic" in subj_norm:
            subj_norm = "physics"
        elif "chem" in subj_norm:
            subj_norm = "chemistry"
        elif "math" in subj_norm:
            subj_norm = "mathematics"
        elif "bio" in subj_norm:
            subj_norm = "biology"

        key = (
            subj_norm,
            (t.batch or "").strip().lower(),
            (t.topic_name or "").strip().lower()
        )

        if key in seen_keys:
            existing = seen_keys[key]
            # Merge stats into existing
            existing.completed_periods = max(existing.completed_periods or 0, t.completed_periods or 0)
            existing.required_periods = max(existing.required_periods or 0, t.required_periods or 0)
            if existing.chapter in ["Curriculum Chapter", "Curriculum Module", None, ""] and t.chapter not in ["Curriculum Chapter", "Curriculum Module", None, ""]:
                existing.chapter = t.chapter
            if t.status == "Completed" or (existing.completed_periods >= existing.required_periods and existing.required_periods > 0):
                existing.status = "Completed"
            elif existing.status != "Completed" and (t.status == "In Progress" or (existing.completed_periods or 0) > 0):
                existing.status = "In Progress"
            duplicates_to_delete.append(t)
        else:
            seen_keys[key] = t
            unique_topics.append(t)

    # Purge duplicates from database asynchronously so they never return
    for dup in duplicates_to_delete:
        try:
            await dup.delete()
        except Exception:
            pass

    # Save any merged changes on kept items
    for unique_t in seen_keys.values():
        try:
            await unique_t.save()
        except Exception:
            pass

    result = []
    for t in unique_topics:
        d = t.dict(exclude={"id", "_id"})
        d["id"] = str(t.id)
        result.append(TopicDurationResponse(**d))
    return result

@router.get("/matrix", response_model=TopicDurationMatrixSummary)
async def get_topic_duration_matrix(
    subject: str = Query(..., description="Subject name e.g. Physics"),
    teacher: str = Query(..., description="Faculty name e.g. Prof. Shubham Shinde"),
    batch: str = Query(..., description="Batch name e.g. 12th Science Tarabai Park (Batch A)"),
    month: Optional[str] = Query("All"),
    academic_year: Optional[str] = Query("2026-2027"),
    token: Optional[str] = Depends(oauth2_scheme_optional)
):
    """
    Academic Admin Endpoint:
    Returns the Topic Duration & Period Allocation Matrix specifically for the chosen Subject, Faculty, and Batch.
    Computes dynamic KPIs and verification.
    """
    if token:
        try:
            await get_current_user(token)
        except Exception:
            pass

    import re
    query = {
        "subject": {"$regex": f"^{re.escape(subject)}$", "$options": "i"},
        "teacher_name": {"$regex": re.escape(teacher), "$options": "i"},
        "batch": {"$regex": f"^{re.escape(batch)}$", "$options": "i"}
    }
    if month and month != "All":
        query["month"] = month
    if academic_year and academic_year != "All":
        query["academic_year"] = academic_year

    topics = await TopicDuration.find(query).sort("start_date").to_list()

    # Fallback to subject topics for the grade level (11th / 12th)
    if not topics:
        std = "11" if "11" in batch else "12"
        fallback_query = {
            "subject": {"$regex": f"^{re.escape(subject)}$", "$options": "i"}
        }
        all_subj_topics = await TopicDuration.find(fallback_query).sort("start_date").to_list()
        grade_topics = [t for t in all_subj_topics if (std in getattr(t, "standard", "") or std in getattr(t, "batch", ""))]
        topics = grade_topics if grade_topics else all_subj_topics

    # Fallback seeding if still empty
    if not topics:
        await seed_curriculum_database()
        topics = await TopicDuration.find(query).sort("start_date").to_list()

    topic_responses = []
    total_planned = 0
    total_completed = 0
    completed_cnt = 0
    in_progress_cnt = 0
    upcoming_cnt = 0

    for t in topics:
        d = t.dict(exclude={"id", "_id"})
        d["id"] = str(t.id)
        resp = TopicDurationResponse(**d)
        topic_responses.append(resp)

        req = resp.required_periods or 0
        comp = resp.completed_periods or 0
        total_planned += req
        total_completed += comp

        if resp.status == "Completed":
            completed_cnt += 1
        elif resp.status == "In Progress":
            in_progress_cnt += 1
        else:
            upcoming_cnt += 1

    pct = round((total_completed / total_planned * 100), 1) if total_planned > 0 else 0.0

    return TopicDurationMatrixSummary(
        subject=subject,
        teacher_name=teacher,
        batch=batch,
        total_topics=len(topic_responses),
        total_planned_periods=total_planned,
        total_completed_periods=total_completed,
        completion_percentage=pct,
        completed_count=completed_cnt,
        in_progress_count=in_progress_cnt,
        upcoming_count=upcoming_cnt,
        topics=topic_responses
    )

@router.post("", response_model=TopicDurationResponse)
async def create_topic_duration(
    topic_in: TopicDurationCreate,
    token: Optional[str] = Depends(oauth2_scheme_optional)
):
    """Create a new topic duration plan or update existing if duplicate"""
    if token:
        try:
            await get_current_user(token)
        except Exception:
            pass

    data = topic_in.dict()
    topic_name = (data.get("topic_name") or "").strip()
    batch_name = (data.get("batch") or "").strip()
    raw_subj = (data.get("subject") or "").strip()

    # Deduplication check: check if already exists
    import re
    existing = await TopicDuration.find_one({
        "subject": {"$regex": f"^{re.escape(raw_subj)}$", "$options": "i"},
        "batch": {"$regex": f"^{re.escape(batch_name)}$", "$options": "i"},
        "topic_name": {"$regex": f"^{re.escape(topic_name)}$", "$options": "i"}
    })

    if existing:
        if data.get("completed_periods") is not None:
            existing.completed_periods = max(existing.completed_periods or 0, data["completed_periods"])
        if data.get("required_periods"):
            existing.required_periods = max(existing.required_periods or 0, data["required_periods"])
        if data.get("status"):
            existing.status = data["status"]
        if data.get("chapter") and data["chapter"] not in ["Curriculum Chapter", "Curriculum Module"]:
            existing.chapter = data["chapter"]
        if data.get("remarks"):
            existing.remarks = data["remarks"]
        existing.updated_at = datetime.utcnow()
        await existing.save()

        d = existing.dict(exclude={"id", "_id"})
        d["id"] = str(existing.id)
        return TopicDurationResponse(**d)

    if not data.get("topic_id"):
        data["topic_id"] = f"TOPIC-{int(datetime.utcnow().timestamp())}"

    topic = TopicDuration(**data)
    await topic.insert()

    d = topic.dict(exclude={"id", "_id"})
    d["id"] = str(topic.id)
    return TopicDurationResponse(**d)

@router.post("/bulk", response_model=List[TopicDurationResponse])
async def create_bulk_topic_durations(
    topics_in: List[TopicDurationCreate],
    token: Optional[str] = Depends(oauth2_scheme_optional)
):
    """Bulk create topic duration curriculum plans from Excel import and route to respective faculty"""
    current_teacher = None
    if token:
        try:
            user = await get_current_user(token)
            current_teacher = user.full_name
        except Exception:
            pass

    faculty_by_subj = {
        "physics": "Dr. Priya Kulkarni",
        "chemistry": "Prof. Sunita Patil",
        "mathematics": "Prof. Rajesh Sharma",
        "math": "Prof. Rajesh Sharma",
        "biology": "Prof. Amit Sawant"
    }

    created = []
    for t_in in topics_in:
        data = t_in.dict()
        subj_raw = (data.get("subject") or "Physics").strip()
        subj_lower = subj_raw.lower()

        # Faculty assignment
        f_name = data.get("teacher_name") or current_teacher
        if not f_name or f_name in ["Assigned Faculty", ""]:
            for k, v in faculty_by_subj.items():
                if k in subj_lower:
                    f_name = v
                    break
            if not f_name:
                f_name = "Dr. Priya Kulkarni"
        data["teacher_name"] = f_name

        if not data.get("branch"):
            data["branch"] = "Tarabai Park"

        if not data.get("topic_id"):
            data["topic_id"] = f"TOPIC-{int(datetime.utcnow().timestamp())}-{len(created)}"

        topic = TopicDuration(**data)
        await topic.insert()
        res_d = topic.dict(exclude={"id", "_id"})
        res_d["id"] = str(topic.id)
        created.append(TopicDurationResponse(**res_d))

    return created

@router.get("/{id}", response_model=TopicDurationResponse)
async def get_topic_duration(id: str, token: Optional[str] = Depends(oauth2_scheme_optional)):
    """Get single topic duration plan by ID"""
    if token:
        try:
            await get_current_user(token)
        except Exception:
            pass

    try:
        topic = await TopicDuration.get(ObjectId(id))
    except Exception:
        topic = None

    if not topic:
        raise HTTPException(status_code=404, detail="Topic duration plan not found")

    d = topic.dict(exclude={"id", "_id"})
    d["id"] = str(topic.id)
    return TopicDurationResponse(**d)

@router.put("/{id}", response_model=TopicDurationResponse)
async def update_topic_duration(
    id: str,
    topic_in: TopicDurationUpdate,
    token: Optional[str] = Depends(oauth2_scheme_optional)
):
    """Update topic start/end dates, required periods, or status"""
    if token:
        try:
            await get_current_user(token)
        except Exception:
            pass

    try:
        topic = await TopicDuration.get(ObjectId(id))
    except Exception:
        topic = None

    if not topic:
        raise HTTPException(status_code=404, detail="Topic duration plan not found")

    update_data = topic_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(topic, key, value)
    topic.updated_at = datetime.utcnow()

    await topic.save()

    d = topic.dict(exclude={"id", "_id"})
    d["id"] = str(topic.id)
    return TopicDurationResponse(**d)

@router.delete("/{id}")
async def delete_topic_duration(id: str, token: Optional[str] = Depends(oauth2_scheme_optional)):
    """Delete a topic duration plan"""
    if token:
        try:
            await get_current_user(token)
        except Exception:
            pass

    try:
        topic = await TopicDuration.get(ObjectId(id))
    except Exception:
        topic = None

    if not topic:
        raise HTTPException(status_code=404, detail="Topic duration plan not found")

    await topic.delete()
    return {"message": "Topic duration plan deleted successfully"}

@router.post("/seed")
async def seed_curriculum_endpoint():
    """Seed comprehensive initial curriculum topics data"""
    count = await seed_curriculum_database()
    return {"message": f"Successfully seeded {count} curriculum topic records"}

async def seed_curriculum_database():
    """Helper function to seed rich master curriculum topics across subjects, teachers & batches"""
    existing_count = await TopicDuration.count()
    if existing_count > 0:
        return existing_count

    initial_topics = [
        # 1. Physics - More A.D - 12th pcm tarabai park
        {
            "topic_id": "TOP-PHY-01",
            "standard": "Class 12th",
            "batch": "12th pcm tarabai park",
            "subject": "Physics",
            "teacher_name": "More A.D",
            "chapter": "Chapter 7: Wave Optics",
            "topic_name": "Wavefronts & Huygens Principle Derivation",
            "start_date": "2026-06-15",
            "end_date": "2026-07-02",
            "required_periods": 3,
            "period_duration_mins": 45,
            "completed_periods": 3,
            "status": "Completed",
            "academic_year": "2026-2027",
            "month": "June 2026",
            "remarks": "Derived reflection and refraction laws. Solved slit interference numericals."
        },
        {
            "topic_id": "TOP-PHY-02",
            "standard": "Class 12th",
            "batch": "12th pcm tarabai park",
            "subject": "Physics",
            "teacher_name": "More A.D",
            "chapter": "Chapter 9: Electromagnetic Induction",
            "topic_name": "Lenz's Law, Self-Inductance & Mutual Inductance",
            "start_date": "2026-07-20",
            "end_date": "2026-08-14",
            "required_periods": 4,
            "period_duration_mins": 45,
            "completed_periods": 3,
            "status": "In Progress",
            "academic_year": "2026-2027",
            "month": "August 2026",
            "remarks": "Faraday laws completed. Mutual inductance numerical session pending."
        },
        {
            "topic_id": "TOP-PHY-03",
            "standard": "Class 12th",
            "batch": "12th pcm tarabai park",
            "subject": "Physics",
            "teacher_name": "More A.D",
            "chapter": "Chapter 12: Atoms & Nuclei",
            "topic_name": "Bohr Model, Hydrogen Spectrum & Energy Levels",
            "start_date": "2026-09-08",
            "end_date": "2026-09-29",
            "required_periods": 4,
            "period_duration_mins": 45,
            "completed_periods": 4,
            "status": "Completed",
            "academic_year": "2026-2027",
            "month": "September 2026",
            "remarks": "Spectral series (Lyman, Balmer, Paschen) and Rydberg formula covered."
        },
        {
            "topic_id": "TOP-PHY-04",
            "standard": "Class 12th",
            "batch": "12th pcm tarabai park",
            "subject": "Physics",
            "teacher_name": "More A.D",
            "chapter": "Chapter 14: Semiconductor Electronics",
            "topic_name": "P-N Junction Diodes, Rectifiers & Zener Breakdown",
            "start_date": "2026-10-01",
            "end_date": "2026-10-26",
            "required_periods": 5,
            "period_duration_mins": 45,
            "completed_periods": 2,
            "status": "In Progress",
            "academic_year": "2026-2027",
            "month": "October 2026",
            "remarks": "Forward/reverse I-V characteristics taught. Full wave rectifier pending."
        },
        {
            "topic_id": "TOP-PHY-05",
            "standard": "Class 12th",
            "batch": "12th pcm tarabai park",
            "subject": "Physics",
            "teacher_name": "More A.D",
            "chapter": "Chapter 15: Ray Optics & Instruments",
            "topic_name": "Compound Microscope & Astronomical Telescope Magnification",
            "start_date": "2026-11-05",
            "end_date": "2026-11-30",
            "required_periods": 4,
            "period_duration_mins": 45,
            "completed_periods": 0,
            "status": "Upcoming",
            "academic_year": "2026-2027",
            "month": "November 2026",
            "remarks": "Scheduled for Term 2 practical theory sessions."
        },

        # 2. Chemistry - Dr. Priya Kulkarni - 12th pcb tarabai park
        {
            "topic_id": "TOP-CHM-01",
            "standard": "Class 12th",
            "batch": "12th pcb tarabai park",
            "subject": "Chemistry",
            "teacher_name": "Dr. Priya Kulkarni",
            "chapter": "Chapter 3: Chemical Kinetics",
            "topic_name": "Integrated Rate Law & Arrhenius Equation",
            "start_date": "2026-07-10",
            "end_date": "2026-07-28",
            "required_periods": 4,
            "period_duration_mins": 45,
            "completed_periods": 4,
            "status": "Completed",
            "academic_year": "2026-2027",
            "month": "July 2026",
            "remarks": "Zero and first order rate constants and half-life derivations completed."
        },
        {
            "topic_id": "TOP-CHM-02",
            "standard": "Class 12th",
            "batch": "12th pcb tarabai park",
            "subject": "Chemistry",
            "teacher_name": "Dr. Priya Kulkarni",
            "chapter": "Chapter 2: Solutions",
            "topic_name": "Raoult's Law, Colligative Properties & Van't Hoff Factor",
            "start_date": "2026-08-02",
            "end_date": "2026-08-24",
            "required_periods": 5,
            "period_duration_mins": 45,
            "completed_periods": 5,
            "status": "Completed",
            "academic_year": "2026-2027",
            "month": "August 2026",
            "remarks": "Osmotic pressure and elevation in boiling point problems solved."
        },
        {
            "topic_id": "TOP-CHM-03",
            "standard": "Class 12th",
            "batch": "12th pcb tarabai park",
            "subject": "Chemistry",
            "teacher_name": "Dr. Priya Kulkarni",
            "chapter": "Chapter 8: d- and f-Block Elements",
            "topic_name": "Transition Elements Electronic Configuration & Oxidation States",
            "start_date": "2026-09-02",
            "end_date": "2026-09-22",
            "required_periods": 4,
            "period_duration_mins": 45,
            "completed_periods": 4,
            "status": "Completed",
            "academic_year": "2026-2027",
            "month": "September 2026",
            "remarks": "Catalytic properties, color formation, and Lanthanoid contraction covered."
        },
        {
            "topic_id": "TOP-CHM-04",
            "standard": "Class 12th",
            "batch": "12th pcb tarabai park",
            "subject": "Chemistry",
            "teacher_name": "Dr. Priya Kulkarni",
            "chapter": "Chapter 9: Coordination Compounds",
            "topic_name": "IUPAC Nomenclature, Werner's Theory & Crystal Field Splitting",
            "start_date": "2026-10-04",
            "end_date": "2026-10-28",
            "required_periods": 5,
            "period_duration_mins": 45,
            "completed_periods": 2,
            "status": "In Progress",
            "academic_year": "2026-2027",
            "month": "October 2026",
            "remarks": "Octahedral and tetrahedral CFT splitting diagrams introduced."
        },

        # 3. Mathematics - veer 1 - 12th pcm tarabai park
        {
            "topic_id": "TOP-MTH-01",
            "standard": "Class 12th",
            "batch": "12th pcm tarabai park",
            "subject": "Mathematics",
            "teacher_name": "veer 1",
            "chapter": "Chapter 5: Continuity & Differentiability",
            "topic_name": "Chain Rule, Implicit Functions & Logarithmic Differentiation",
            "start_date": "2026-07-15",
            "end_date": "2026-08-08",
            "required_periods": 6,
            "period_duration_mins": 45,
            "completed_periods": 6,
            "status": "Completed",
            "academic_year": "2026-2027",
            "month": "August 2026",
            "remarks": "Solved 25 Board and JEE numerical problems."
        },
        {
            "topic_id": "TOP-MTH-02",
            "standard": "Class 12th",
            "batch": "12th pcm tarabai park",
            "subject": "Mathematics",
            "teacher_name": "veer 1",
            "chapter": "Chapter 7: Integrals",
            "topic_name": "Definite Integrals & Properties of Definite Integrals",
            "start_date": "2026-09-12",
            "end_date": "2026-10-06",
            "required_periods": 6,
            "period_duration_mins": 45,
            "completed_periods": 6,
            "status": "Completed",
            "academic_year": "2026-2027",
            "month": "September 2026",
            "remarks": "Mastered properties P0 to P7 with 30 practice problems."
        },
        {
            "topic_id": "TOP-MTH-03",
            "standard": "Class 12th",
            "batch": "12th pcm tarabai park",
            "subject": "Mathematics",
            "teacher_name": "veer 1",
            "chapter": "Chapter 9: Differential Equations",
            "topic_name": "Variable Separable Method & Homogeneous Equations",
            "start_date": "2026-10-10",
            "end_date": "2026-10-31",
            "required_periods": 5,
            "period_duration_mins": 45,
            "completed_periods": 3,
            "status": "In Progress",
            "academic_year": "2026-2027",
            "month": "October 2026",
            "remarks": "Linear differential equations integrating factor session in progress."
        },

        # 4. Biology - Shri - 12th pcb tarabai park
        {
            "topic_id": "TOP-BIO-01",
            "standard": "Class 12th",
            "batch": "12th pcb tarabai park",
            "subject": "Biology",
            "teacher_name": "Shri",
            "chapter": "Chapter 2: Flowering Plants Reproduction",
            "topic_name": "Microsporogenesis & Megasporogenesis Mechanism",
            "start_date": "2026-07-08",
            "end_date": "2026-07-26",
            "required_periods": 4,
            "period_duration_mins": 45,
            "completed_periods": 4,
            "status": "Completed",
            "academic_year": "2026-2027",
            "month": "July 2026",
            "remarks": "Pollen grain development and embryo sac diagrams thoroughly covered."
        },
        {
            "topic_id": "TOP-BIO-02",
            "standard": "Class 12th",
            "batch": "12th pcb tarabai park",
            "subject": "Biology",
            "teacher_name": "Shri",
            "chapter": "Chapter 5: Principles of Inheritance",
            "topic_name": "Mendelian Monohybrid & Dihybrid Cross, Incomplete Dominance",
            "start_date": "2026-08-16",
            "end_date": "2026-09-10",
            "required_periods": 5,
            "period_duration_mins": 45,
            "completed_periods": 5,
            "status": "Completed",
            "academic_year": "2026-2027",
            "month": "August 2026",
            "remarks": "Punnett squares and test cross numericals completed."
        },
        {
            "topic_id": "TOP-BIO-03",
            "standard": "Class 12th",
            "batch": "12th pcb tarabai park",
            "subject": "Biology",
            "teacher_name": "Shri",
            "chapter": "Chapter 6: Molecular Basis of Inheritance",
            "topic_name": "DNA Replication Fork & Transcription in Prokaryotes",
            "start_date": "2026-09-14",
            "end_date": "2026-10-06",
            "required_periods": 5,
            "period_duration_mins": 45,
            "completed_periods": 4,
            "status": "In Progress",
            "academic_year": "2026-2027",
            "month": "September 2026",
            "remarks": "Okazaki fragments covered. Translation mechanism in progress."
        }
    ]

    for item in initial_topics:
        topic = TopicDuration(**item)
        await topic.insert()

    return len(initial_topics)
