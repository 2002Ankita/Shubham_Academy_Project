"""
Centralized Branch and Academic Batch Configuration for Shubham Academy.

Branches:
1. Tarabai Park: Academic batches (11th PCM, 11th PCB, 11th PCMB, 12th PCM, 12th PCB, 12th PCMB)
2. Mangalwar Peth: Session (Morning, Afternoon) -> Academic batches (11th PCM, 11th PCB, 11th PCMB, 12th PCM, 12th PCB, 12th PCMB)
"""

from typing import Optional, Tuple, List, Dict, Any
import re

BRANCH_TARABAI = "Tarabai Park"
BRANCH_MANGALWAR = "Mangalwar Peth"
BRANCHES = [BRANCH_TARABAI, BRANCH_MANGALWAR]

SESSIONS = ["Morning", "Afternoon"]

ACADEMIC_BATCHES = [
    "11th PCM",
    "11th PCB",
    "11th PCMB",
    "12th PCM",
    "12th PCB",
    "12th PCMB",
]

# Map stream/subject abbreviations to normalized names
STREAM_MAP = {
    "pcm": "PCM",
    "pcb": "PCB",
    "pcmb": "PCMB",
}


def normalize_branch(raw_branch: Optional[str]) -> Optional[str]:
    if not raw_branch:
        return None
    b = str(raw_branch).strip().lower()
    if "tarabai" in b or "main" in b or "kolhapur" in b:
        return BRANCH_TARABAI
    if "mangal" in b:
        return BRANCH_MANGALWAR
    return raw_branch.strip()


def normalize_academic_batch(raw_batch: Optional[str]) -> Optional[str]:
    if not raw_batch:
        return None
    b = str(raw_batch).strip().lower()

    # Determine class (11th vs 12th)
    is_12th = "12" in b
    is_11th = "11" in b or not is_12th
    std = "12th" if is_12th else "11th"

    # Determine stream (PCM, PCB, PCMB)
    if "pcmb" in b or ("math" in b and "bio" in b):
        stream = "PCMB"
    elif "pcb" in b or "bio" in b:
        stream = "PCB"
    elif "pcm" in b or "math" in b:
        stream = "PCM"
    else:
        # Default fallback
        stream = "PCM"

    return f"{std} {stream}"


def normalize_session(raw_session: Optional[str]) -> Optional[str]:
    if not raw_session:
        return None
    s = str(raw_session).strip().lower()
    if "afternoon" in s or "pm" in s or "noon" in s or "evening" in s:
        return "Afternoon"
    if "morning" in s or "am" in s:
        return "Morning"
    return None


def parse_student_branch_batch(
    branch: Optional[str],
    batch: Optional[str],
    academic_batch: Optional[str] = None,
    session: Optional[str] = None
) -> Tuple[str, str, Optional[str], str]:
    """
    Parse and normalize branch, academic_batch, session, and standard.
    Returns: (branch, academic_batch, session, standard)
    """
    norm_branch = normalize_branch(branch)
    if not norm_branch:
        # Try extracting branch from batch string if present
        if batch and "mangal" in batch.lower():
            norm_branch = BRANCH_MANGALWAR
        else:
            norm_branch = BRANCH_TARABAI

    norm_batch = normalize_academic_batch(academic_batch or batch) or "11th PCM"

    norm_session = normalize_session(session)
    if norm_branch == BRANCH_MANGALWAR and not norm_session:
        # Check if session is embedded in batch string
        if batch and ("afternoon" in batch.lower() or "pm" in batch.lower()):
            norm_session = "Afternoon"
        else:
            norm_session = "Morning"  # Default session for Mangalwar Peth if unspecified
    elif norm_branch == BRANCH_TARABAI:
        norm_session = None

    standard = "12th Science" if norm_batch.startswith("12th") else "11th Science"

    return norm_branch, norm_batch, norm_session, standard


def validate_branch_batch_selection(
    branch: Optional[str],
    academic_batch: Optional[str],
    session: Optional[str] = None
) -> Tuple[str, str, Optional[str]]:
    """
    Strict validation of branch, academic batch, and session combination.
    Raises ValueError with user-friendly message on mismatch.
    """
    if not branch or str(branch).strip() not in BRANCHES:
        raise ValueError(f"Invalid branch '{branch}'. Must be one of: {', '.join(BRANCHES)}")

    norm_branch = str(branch).strip()

    if not academic_batch or str(academic_batch).strip() not in ACADEMIC_BATCHES:
        raise ValueError(
            f"Invalid academic batch '{academic_batch}'. Must be one of: {', '.join(ACADEMIC_BATCHES)}"
        )
    norm_batch = str(academic_batch).strip()

    norm_session = None
    if norm_branch == BRANCH_MANGALWAR:
        if not session or str(session).strip() not in SESSIONS:
            raise ValueError(
                f"Session (Morning or Afternoon) is required for branch '{BRANCH_MANGALWAR}'."
            )
        norm_session = str(session).strip()
    else:
        norm_session = None

    return norm_branch, norm_batch, norm_session


def student_matches_filters(
    student: Any,
    branch_filter: Optional[str] = None,
    academic_batch_filter: Optional[str] = None,
    session_filter: Optional[str] = None,
    **kwargs: Any
) -> bool:
    """
    Check if a student document or dict matches branch, academic_batch, and session filters.
    """
    if not student:
        return False

    b_filter = branch_filter or kwargs.get("branch")
    ab_filter = academic_batch_filter or kwargs.get("academic_batch")
    s_filter = session_filter or kwargs.get("session")

    get_val = lambda k, d=None: (
        student.get(k, d) if isinstance(student, dict) else getattr(student, k, d)
    )

    s_branch = get_val("branch", "")
    s_batch = get_val("batch", "")
    s_acad_batch = get_val("academic_batch", "")
    s_session = get_val("session", "")

    # Normalize student data
    st_branch, st_acad_batch, st_session, _ = parse_student_branch_batch(
        s_branch, s_batch, s_acad_batch, s_session
    )

    # 1. Branch match
    if b_filter and str(b_filter).strip().upper() not in ["ALL", ""]:
        req_branch = normalize_branch(b_filter)
        if req_branch and req_branch != st_branch:
            return False

    # 2. Session match (only applies when branch is Mangalwar Peth or session is explicitly requested)
    if s_filter and str(s_filter).strip().upper() not in ["ALL", ""]:
        req_session = normalize_session(s_filter)
        if req_session:
            if st_branch != BRANCH_MANGALWAR:
                return False
            if st_session != req_session:
                return False

    # 3. Academic Batch match
    if ab_filter and str(ab_filter).strip().upper() not in ["ALL", ""]:
        req_batch = normalize_academic_batch(ab_filter)
        if req_batch and req_batch != st_acad_batch:
            return False

    return True
