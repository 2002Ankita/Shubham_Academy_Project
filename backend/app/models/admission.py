from beanie import Document, Link
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class AdmissionRecord(BaseModel):
    admission_id: str = Field(default_factory=lambda: f"ADM-{uuid.uuid4().hex[:8].upper()}")
    standard: str  # "11th Science" or "12th Science"
    academic_year: str = "2025-2026"  # "2025-2026", "2026-2027"
    batch: Optional[str] = None  # e.g. "11th PCM Tarabai Park"
    academic_batch: Optional[str] = None  # e.g. "11th PCM"
    session: Optional[str] = None  # e.g. "Morning"
    branch: Optional[str] = "Tarabai Park"
    original_fees: float = 0.0
    concession_amount: float = 0.0
    final_fees: float = 0.0
    paid_fees: float = 0.0
    remaining_fees: float = 0.0
    status: str = "Active"  # "Active", "Upcoming", "Completed"
    admission_date: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        extra = "allow"

class Admission(Document):
    admission_id: str = Field(default_factory=lambda: f"ADM-{uuid.uuid4().hex[:8].upper()}")
    student_id: str  # Student MongoDB ID or student_id (e.g. STD-101)
    student_name: Optional[str] = None
    roll_number: Optional[str] = None
    admission_type: str = "11th Standard Only"  # "11th Standard Only", "12th Standard Only", "11th + 12th Standard (Two-Year Admission)"
    standard: str  # "11th Science" or "12th Science"
    academic_year: str = "2025-2026"
    batch: Optional[str] = None
    academic_batch: Optional[str] = None
    session: Optional[str] = None
    branch: Optional[str] = "Tarabai Park"
    original_fees: float = 0.0
    concession_amount: float = 0.0
    final_fees: float = 0.0
    paid_fees: float = 0.0
    remaining_fees: float = 0.0
    status: str = "Active"  # "Active", "Upcoming", "Completed"
    admission_date: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "admissions"
