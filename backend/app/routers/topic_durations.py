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
    TopicDurationMatrixSummary,
    SyllabusChapterPlanItem,
    SyllabusPlanBulkSaveRequest
)
from fastapi.security import OAuth2PasswordBearer
from app.services.auth_service import get_current_user

oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="api/auth/token", auto_error=False)

router = APIRouter(prefix="/topic-durations", tags=["Topic Durations & Curriculum Matrix"])

DEFAULT_SYLLABUS_PLANS = [
    # 1. Physics - 12th 2026 - 2027 (16 Chapters)
    {"sr_no": 1, "title": "Rotational Dynamics", "boards_lectures": 7, "entrance_lectures": 3, "total_lectures": 10, "subject": "Physics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 2, "title": "Mechanical Properties of Fluids", "boards_lectures": 7, "entrance_lectures": 3, "total_lectures": 10, "subject": "Physics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 3, "title": "Kinetic Theory of Gases and Radiation", "boards_lectures": 5, "entrance_lectures": 2, "total_lectures": 7, "subject": "Physics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 4, "title": "Thermodynamics", "boards_lectures": 7, "entrance_lectures": 3, "total_lectures": 10, "subject": "Physics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 5, "title": "Oscillations", "boards_lectures": 6, "entrance_lectures": 3, "total_lectures": 9, "subject": "Physics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 6, "title": "Superposition of waves", "boards_lectures": 6, "entrance_lectures": 2, "total_lectures": 8, "subject": "Physics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 7, "title": "Waves Optics", "boards_lectures": 7, "entrance_lectures": 2, "total_lectures": 9, "subject": "Physics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 8, "title": "Electrostatics", "boards_lectures": 7, "entrance_lectures": 3, "total_lectures": 10, "subject": "Physics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 9, "title": "Current Electricity", "boards_lectures": 6, "entrance_lectures": 2, "total_lectures": 8, "subject": "Physics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 10, "title": "Magnetic fields due to Electric Current", "boards_lectures": 6, "entrance_lectures": 2, "total_lectures": 8, "subject": "Physics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 11, "title": "Magnetic Materials", "boards_lectures": 5, "entrance_lectures": 1, "total_lectures": 6, "subject": "Physics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 12, "title": "Electromagnetic Induction", "boards_lectures": 6, "entrance_lectures": 2, "total_lectures": 8, "subject": "Physics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 13, "title": "AC circuits", "boards_lectures": 6, "entrance_lectures": 2, "total_lectures": 8, "subject": "Physics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 14, "title": "Dual Nature of Radiation and Matter", "boards_lectures": 3, "entrance_lectures": 1, "total_lectures": 4, "subject": "Physics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 15, "title": "Structure of Atoms and Nuclei", "boards_lectures": 5, "entrance_lectures": 2, "total_lectures": 7, "subject": "Physics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 16, "title": "Semiconductor Devices", "boards_lectures": 5, "entrance_lectures": 1, "total_lectures": 6, "subject": "Physics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},

    # 2. Chemistry - 12th 2026 - 2027 (16 Chapters)
    {"sr_no": 1, "title": "Solid State", "boards_lectures": 6, "entrance_lectures": 3, "total_lectures": 9, "subject": "Chemistry", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 2, "title": "Solutions", "boards_lectures": 7, "entrance_lectures": 3, "total_lectures": 10, "subject": "Chemistry", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 3, "title": "Ionic Equilibria", "boards_lectures": 6, "entrance_lectures": 2, "total_lectures": 8, "subject": "Chemistry", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 4, "title": "Chemical Thermodynamics", "boards_lectures": 7, "entrance_lectures": 3, "total_lectures": 10, "subject": "Chemistry", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 5, "title": "Electrochemistry", "boards_lectures": 5, "entrance_lectures": 3, "total_lectures": 8, "subject": "Chemistry", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 6, "title": "Chemical Kinetics", "boards_lectures": 6, "entrance_lectures": 3, "total_lectures": 9, "subject": "Chemistry", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 7, "title": "Elements of groups 16, 17 and 18", "boards_lectures": 8, "entrance_lectures": 3, "total_lectures": 11, "subject": "Chemistry", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 8, "title": "Transition and Inner transition Elements", "boards_lectures": 5, "entrance_lectures": 3, "total_lectures": 8, "subject": "Chemistry", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 9, "title": "Coordination Compounds", "boards_lectures": 5, "entrance_lectures": 3, "total_lectures": 8, "subject": "Chemistry", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 10, "title": "Halogen Derivatives", "boards_lectures": 6, "entrance_lectures": 3, "total_lectures": 9, "subject": "Chemistry", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 11, "title": "Alcohols, Phenols and Ethers", "boards_lectures": 6, "entrance_lectures": 3, "total_lectures": 9, "subject": "Chemistry", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 12, "title": "Aldehydes, Ketones and Carboxylic Acids", "boards_lectures": 8, "entrance_lectures": 3, "total_lectures": 11, "subject": "Chemistry", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 13, "title": "Amines", "boards_lectures": 4, "entrance_lectures": 2, "total_lectures": 6, "subject": "Chemistry", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 14, "title": "Biomolecules", "boards_lectures": 5, "entrance_lectures": 3, "total_lectures": 8, "subject": "Chemistry", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 15, "title": "Introduction to Polymer Chemistry", "boards_lectures": 4, "entrance_lectures": 2, "total_lectures": 6, "subject": "Chemistry", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 16, "title": "Green Chemistry and Nano Chemistry", "boards_lectures": 3, "entrance_lectures": 1, "total_lectures": 4, "subject": "Chemistry", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},

    # 3. Mathematics - 12th 2026 - 2027 (15 Chapters)
    {"sr_no": 1, "title": "Mathematical Logic", "boards_lectures": 6, "entrance_lectures": 2, "total_lectures": 8, "subject": "Mathematics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 2, "title": "Matrices", "boards_lectures": 6, "entrance_lectures": 2, "total_lectures": 8, "subject": "Mathematics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 3, "title": "Trigonometric Functions", "boards_lectures": 8, "entrance_lectures": 3, "total_lectures": 11, "subject": "Mathematics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 4, "title": "Pair of Straight Lines", "boards_lectures": 6, "entrance_lectures": 2, "total_lectures": 8, "subject": "Mathematics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 5, "title": "Vectors", "boards_lectures": 8, "entrance_lectures": 3, "total_lectures": 11, "subject": "Mathematics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 6, "title": "Line and Plane", "boards_lectures": 7, "entrance_lectures": 2, "total_lectures": 9, "subject": "Mathematics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 7, "title": "Linear Programming", "boards_lectures": 4, "entrance_lectures": 1, "total_lectures": 5, "subject": "Mathematics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 8, "title": "Differentiation", "boards_lectures": 7, "entrance_lectures": 3, "total_lectures": 10, "subject": "Mathematics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 9, "title": "Applications of Derivatives", "boards_lectures": 8, "entrance_lectures": 3, "total_lectures": 11, "subject": "Mathematics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 10, "title": "Indefinite Integration", "boards_lectures": 9, "entrance_lectures": 3, "total_lectures": 12, "subject": "Mathematics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 11, "title": "Definite Integration", "boards_lectures": 6, "entrance_lectures": 2, "total_lectures": 8, "subject": "Mathematics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 12, "title": "Application of Definite Integration", "boards_lectures": 4, "entrance_lectures": 2, "total_lectures": 6, "subject": "Mathematics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 13, "title": "Differential Equations", "boards_lectures": 7, "entrance_lectures": 3, "total_lectures": 10, "subject": "Mathematics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 14, "title": "Probability Distributions", "boards_lectures": 5, "entrance_lectures": 2, "total_lectures": 7, "subject": "Mathematics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 15, "title": "Binomial Distribution", "boards_lectures": 4, "entrance_lectures": 1, "total_lectures": 5, "subject": "Mathematics", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},

    # 4. Biology - 12th 2026 - 2027 (15 Chapters)
    {"sr_no": 1, "title": "Reproduction in Lower and Higher Plants", "boards_lectures": 8, "entrance_lectures": 2, "total_lectures": 10, "subject": "Biology", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 2, "title": "Reproduction in Lower and Higher Animals", "boards_lectures": 8, "entrance_lectures": 2, "total_lectures": 10, "subject": "Biology", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 3, "title": "Inheritance and Variation", "boards_lectures": 6, "entrance_lectures": 2, "total_lectures": 8, "subject": "Biology", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 4, "title": "Molecular Basis of Inheritance", "boards_lectures": 10, "entrance_lectures": 3, "total_lectures": 13, "subject": "Biology", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 5, "title": "Origin and Evalution of Life", "boards_lectures": 6, "entrance_lectures": 2, "total_lectures": 8, "subject": "Biology", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 6, "title": "Plant Water Relation", "boards_lectures": 6, "entrance_lectures": 2, "total_lectures": 8, "subject": "Biology", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 7, "title": "Plant Growth and Mineral Nutrition", "boards_lectures": 6, "entrance_lectures": 2, "total_lectures": 8, "subject": "Biology", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 8, "title": "Respiration and Circulation", "boards_lectures": 10, "entrance_lectures": 3, "total_lectures": 13, "subject": "Biology", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 9, "title": "Control and Co-ordination", "boards_lectures": 12, "entrance_lectures": 3, "total_lectures": 15, "subject": "Biology", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 10, "title": "Human Health and Diseases", "boards_lectures": 6, "entrance_lectures": 2, "total_lectures": 8, "subject": "Biology", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 11, "title": "Enhancement of Food Production", "boards_lectures": 5, "entrance_lectures": 2, "total_lectures": 7, "subject": "Biology", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 12, "title": "Biotechnology", "boards_lectures": 8, "entrance_lectures": 2, "total_lectures": 10, "subject": "Biology", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 13, "title": "Organisms and Populations", "boards_lectures": 4, "entrance_lectures": 1, "total_lectures": 5, "subject": "Biology", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 14, "title": "Ecosystems and Energy Flow", "boards_lectures": 4, "entrance_lectures": 1, "total_lectures": 5, "subject": "Biology", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"},
    {"sr_no": 15, "title": "Biodiversity, Conservations and Environmental Issues", "boards_lectures": 6, "entrance_lectures": 2, "total_lectures": 8, "subject": "Biology", "standard": "12th", "academic_year": "2026 - 2027", "branch_scope": "mp/tp"}
]

@router.get("/syllabus-plan")
async def get_syllabus_plan(
    subject: Optional[str] = None,
    standard: Optional[str] = "12th",
    academic_year: Optional[str] = "2026 - 2027"
):
    """Retrieve syllabus & lecture breakdown for mp/tp (Boards vs Entrance)"""
    # Seed default plans if none exist for branch_scope
    count_existing = await TopicDuration.find({"branch_scope": "mp/tp"}).count()
    if count_existing == 0:
        for plan in DEFAULT_SYLLABUS_PLANS:
            doc = TopicDuration(
                topic_id=f"SYL-{plan['subject'][:3].upper()}-{plan['sr_no']:02d}",
                standard=plan.get("standard", "12th"),
                branch=None,
                batch=None,
                subject=plan["subject"],
                teacher_name=None,
                chapter=plan["title"],
                topic_name=plan["title"],
                title=plan["title"],
                sr_no=plan["sr_no"],
                boards_lectures=plan["boards_lectures"],
                entrance_lectures=plan["entrance_lectures"],
                total_lectures=plan["total_lectures"],
                required_periods=plan["total_lectures"],
                branch_scope=plan.get("branch_scope", "mp/tp"),
                academic_year=plan.get("academic_year", "2026 - 2027"),
                status="In Progress"
            )
            await doc.insert()

    query = {"branch_scope": "mp/tp"}
    if subject and subject.strip().lower() != "all":
        query["subject"] = {"$regex": f"^{subject.strip()}$", "$options": "i"}

    existing = await TopicDuration.find(query).sort("subject", "sr_no").to_list()
    res = []
    for doc in existing:
        res.append({
            "id": str(doc.id),
            "topic_id": doc.topic_id or str(doc.id),
            "sr_no": doc.sr_no or (len(res) + 1),
            "title": doc.title or doc.topic_name or doc.chapter,
            "boards_lectures": doc.boards_lectures or 0,
            "entrance_lectures": doc.entrance_lectures or 0,
            "total_lectures": doc.total_lectures or ((doc.boards_lectures or 0) + (doc.entrance_lectures or 0)),
            "subject": doc.subject or "Physics",
            "standard": doc.standard or "12th",
            "academic_year": doc.academic_year or "2026 - 2027",
            "branch_scope": doc.branch_scope or "mp/tp"
        })
    return res

@router.post("/syllabus-plan/bulk")
async def save_bulk_syllabus_plan(payload: SyllabusPlanBulkSaveRequest):
    """Save/update entire syllabus lecture plan items for a subject/standard"""
    academic_year = payload.academic_year or "2026 - 2027"
    standard = payload.standard or "12th"
    subject = payload.subject or "Physics"
    branch_scope = payload.branch_scope or "mp/tp"

    # Cleanly remove old syllabus records for this subject under branch_scope to avoid ghost rows
    await TopicDuration.find({
        "subject": {"$regex": f"^{subject}$", "$options": "i"},
        "branch_scope": branch_scope
    }).delete()

    saved_count = 0
    for idx, item in enumerate(payload.chapters):
        if not item.title or not item.title.strip():
            continue
        sr = item.sr_no or (idx + 1)
        tot = item.total_lectures or (item.boards_lectures + item.entrance_lectures)
        doc = TopicDuration(
            topic_id=f"SYL-{subject[:3].upper()}-{sr:02d}",
            standard=standard,
            branch=None,
            batch=None,
            subject=subject,
            teacher_name=None,
            chapter=item.title.strip(),
            topic_name=item.title.strip(),
            title=item.title.strip(),
            sr_no=sr,
            boards_lectures=item.boards_lectures,
            entrance_lectures=item.entrance_lectures,
            total_lectures=tot,
            required_periods=tot,
            branch_scope=branch_scope,
            academic_year=academic_year,
            status="In Progress",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        await doc.insert()
        saved_count += 1
    return {
        "success": True,
        "message": f"Successfully saved {saved_count} chapters for {subject} ({standard}) in MongoDB",
        "saved_count": saved_count
    }


def is_fake_curriculum_topic(topic_dict_or_obj) -> bool:
    """Helper to detect hardcoded/seeded mock topics"""
    topic_id = str(getattr(topic_dict_or_obj, "topic_id", "") or (topic_dict_or_obj.get("topic_id") if isinstance(topic_dict_or_obj, dict) else "") or "")
    topic_name = str(getattr(topic_dict_or_obj, "topic_name", "") or (topic_dict_or_obj.get("topic_name") if isinstance(topic_dict_or_obj, dict) else "") or "").lower()

    if any(topic_id.startswith(p) for p in ["TOP-PHY-", "TOP-CHM-", "TOP-MTH-", "TOP-BIO-"]):
        return True

    fake_keywords = [
        "huygens", "lenz's law", "bohr model", "zener breakdown", "compound microscope",
        "markovnikov", "cannizzaro", "aldol condensation", "coordination complexes",
        "dna replication fork"
    ]
    return any(kw in topic_name for kw in fake_keywords)

async def find_topic_duration(id_str: str) -> Optional[TopicDuration]:
    """Find a TopicDuration by MongoDB ObjectId string or topic_id string"""
    if not id_str:
        return None
    topic = None
    try:
        if ObjectId.is_valid(id_str):
            topic = await TopicDuration.get(ObjectId(id_str))
    except Exception:
        pass
    if not topic:
        topic = await TopicDuration.find_one(TopicDuration.topic_id == id_str)
    if not topic:
        topic = await TopicDuration.find_one({"$or": [{"_id": id_str}, {"topic_id": id_str}]})
    return topic

@router.get("", response_model=List[TopicDurationResponse])

async def list_topic_durations(
    subject: Optional[str] = None,
    teacher: Optional[str] = None,
    batch: Optional[str] = None,
    standard: Optional[str] = None,
    status: Optional[str] = None,
    month: Optional[str] = None,
    academic_year: Optional[str] = None,
    branch: Optional[str] = None,
    token: Optional[str] = Depends(oauth2_scheme_optional)
):
    """Retrieve curriculum topic durations with optional filters"""
    current_user = None
    if token:
        try:
            current_user = await get_current_user(token)
        except Exception:
            pass

    user_role = getattr(current_user, "role", "").upper().replace("-", "_") if current_user else ""
    user_branch = getattr(current_user, "branch", None) if current_user else None
    effective_branch = user_branch if (user_role == "ADMIN" and user_branch) else branch

    query = {}
    if effective_branch and effective_branch != "All":
        target = effective_branch.lower().strip()
        if "tarabai" in target:
            query["$or"] = [
                {"branch": {"$regex": "tarabai", "$options": "i"}},
                {"batch": {"$regex": "tarabai", "$options": "i"}}
            ]
        elif "mangal" in target or "manglavar" in target:
            query["$or"] = [
                {"branch": {"$regex": "mangal", "$options": "i"}},
                {"batch": {"$regex": "mangal", "$options": "i"}},
                {"branch": {"$regex": "manglavar", "$options": "i"}},
                {"batch": {"$regex": "manglavar", "$options": "i"}}
            ]

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

    # Filter out any legacy hardcoded mock topics
    topics = [t for t in topics if not is_fake_curriculum_topic(t)]

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
    from app.models.batch import Batch

    # Build flexible regex for teacher (handles More A.D vs More A.D. or title prefixes)
    clean_teacher = re.sub(r"^(dr\.|prof\.|mr\.|mrs\.|ms\.)\s*", "", teacher.strip(), flags=re.IGNORECASE).strip()
    teacher_pattern = re.escape(clean_teacher).replace(r"\.", r"\.?\s*") if clean_teacher else re.escape(teacher)

    # Build flexible regex for batch (handles with or without (Morning), case differences)
    clean_batch = re.sub(r"\(morning\)|\(evening\)", "", batch.strip(), flags=re.IGNORECASE).strip()
    batch_tokens = [re.escape(w) for w in clean_batch.split() if w]
    batch_regex = ".*".join(batch_tokens) if batch_tokens else re.escape(batch)

    # 1. Fetch real topic durations from DB
    topic_query = {
        "subject": {"$regex": f"^{re.escape(subject)}$", "$options": "i"},
        "teacher_name": {"$regex": teacher_pattern, "$options": "i"},
        "batch": {"$regex": batch_regex, "$options": "i"}
    }
    month_val = month if isinstance(month, str) else "All"
    year_val = academic_year if isinstance(academic_year, str) else "2026-2027"
    if month_val and month_val != "All":
        topic_query["month"] = month_val
    if year_val and year_val != "All":
        topic_query["academic_year"] = year_val

    raw_topics = await TopicDuration.find(topic_query).sort("start_date").to_list()
    real_topics = [t for t in raw_topics if not is_fake_curriculum_topic(t)]

    # 2. Fetch daily activities for this teacher, subject, batch
    act_query = {
        "subject": {"$regex": f"^{re.escape(subject)}$", "$options": "i"},
        "teacher_name": {"$regex": teacher_pattern, "$options": "i"},
        "batch": {"$regex": batch_regex, "$options": "i"}
    }
    activities = await DailyActivity.find(act_query).sort("activity_date").to_list()

    # 3. Check timetable allocation for this batch, subject, teacher
    batch_doc = await Batch.find_one({"name": {"$regex": batch_regex, "$options": "i"}})

    # Aggregate by topic name
    aggregated_topics = {}

    for t in real_topics:
        k = (t.topic_name or "").strip().lower()
        if not k:
            continue
        d = t.dict(exclude={"id", "_id"})
        d["id"] = str(t.id)
        aggregated_topics[k] = d

    for act in activities:
        topic_name = (act.topic_taught or "").strip()
        if not topic_name:
            continue
        k = topic_name.lower()
        act_periods = int(act.periods or 1)
        act_date = act.activity_date or ""

        if k in aggregated_topics:
            existing = aggregated_topics[k]
            if act_date:
                if not existing.get("start_date") or act_date < existing["start_date"]:
                    existing["start_date"] = act_date
                if not existing.get("end_date") or act_date > existing["end_date"]:
                    existing["end_date"] = act_date
            req = existing.get("required_periods") or 3
            comp = existing.get("completed_periods") or 0
            if comp >= req:
                existing["status"] = "Completed"
        else:
            req_periods = max(int(act.total_planned_periods or 3), act_periods)
            act_id_str = str(act.id)
            aggregated_topics[k] = {
                "id": act_id_str,
                "topic_id": f"ACT-{act_id_str[-6:]}",
                "standard": act.standard or ("Class 11th" if "11" in batch else "Class 12th"),
                "branch": act.branch or (batch_doc.branch if batch_doc else "Mangalwar Peth"),
                "batch": batch,
                "subject": subject,
                "teacher_name": act.teacher_name or teacher,
                "chapter": act.chapter or "Curriculum Chapter",
                "topic_name": topic_name,
                "start_date": act_date,
                "end_date": act.target_date or act_date,
                "required_periods": req_periods,
                "period_duration_mins": 45,
                "completed_periods": act_periods,
                "status": "Completed" if act_periods >= req_periods else "In Progress",
                "academic_year": academic_year or "2026-2027",
                "month": month if (month and month != "All") else datetime.utcnow().strftime("%B %Y"),
                "remarks": act.remarks or "Logged via Teacher Daily Activity Log."
            }

    topic_responses = []
    total_planned = 0
    total_completed = 0
    completed_cnt = 0
    in_progress_cnt = 0
    upcoming_cnt = 0

    for d in aggregated_topics.values():
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

    topic = await find_topic_duration(id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic duration plan not found")

    d = topic.dict(exclude={"id", "_id"})
    d["id"] = str(topic.id)
    if not d.get("target_date") and d.get("end_date"):
        d["target_date"] = d["end_date"]
    elif not d.get("end_date") and d.get("target_date"):
        d["end_date"] = d["target_date"]
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

    topic = await find_topic_duration(id)
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
    if not d.get("target_date") and d.get("end_date"):
        d["target_date"] = d["end_date"]
    elif not d.get("end_date") and d.get("target_date"):
        d["end_date"] = d["target_date"]
    return TopicDurationResponse(**d)

@router.delete("/{id}")
async def delete_topic_duration(id: str, token: Optional[str] = Depends(oauth2_scheme_optional)):
    """Delete a topic duration plan"""
    if token:
        try:
            await get_current_user(token)
        except Exception:
            pass

    topic = await find_topic_duration(id)
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
    """Purge any legacy hardcoded mock topics from TopicDuration collection"""
    fake_prefixes = ["TOP-PHY-", "TOP-CHM-", "TOP-MTH-", "TOP-BIO-", "SYL-"]
    for p in fake_prefixes:
        await TopicDuration.find({"topic_id": {"$regex": f"^{p}"}}).delete()

    fake_keywords = [
        "huygens", "lenz's law", "bohr model", "zener breakdown", "compound microscope",
        "markovnikov", "cannizzaro", "aldol condensation", "coordination complexes",
        "dna replication fork"
    ]
    for kw in fake_keywords:
        await TopicDuration.find({"topic_name": {"$regex": kw, "$options": "i"}}).delete()
    return 0
