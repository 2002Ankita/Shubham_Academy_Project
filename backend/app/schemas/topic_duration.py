from pydantic import BaseModel, model_validator
from typing import Optional, List, Any

class TopicDurationBase(BaseModel):
    topic_id: Optional[str] = None
    standard: Optional[str] = "Class 12th"
    branch: Optional[str] = "Tarabai Park"
    batch: Optional[str] = "12th Science Tarabai Park (Batch A)"
    subject: Optional[str] = "Physics"
    teacher_name: Optional[str] = "Senior Faculty"
    chapter: Optional[str] = "Curriculum Chapter"
    topic_name: Optional[str] = "Topic Plan"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    target_date: Optional[str] = None
    required_periods: Optional[int] = 1
    period_duration_mins: Optional[int] = 45
    completed_periods: Optional[int] = 0
    status: Optional[str] = "In Progress"
    academic_year: Optional[str] = "2026-2027"
    month: Optional[str] = None
    remarks: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Map camelCase to snake_case if snake_case not present
            if "topicName" in data and not data.get("topic_name"):
                data["topic_name"] = data["topicName"]
            if "requiredPeriods" in data and not data.get("required_periods"):
                data["required_periods"] = data["requiredPeriods"]
            if "periodDurationMins" in data and not data.get("period_duration_mins"):
                data["period_duration_mins"] = data["periodDurationMins"]
            if "completedPeriods" in data and not data.get("completed_periods"):
                data["completed_periods"] = data["completedPeriods"]
            if "targetDate" in data and not data.get("end_date"):
                data["end_date"] = data["targetDate"]
            if "targetDate" in data and not data.get("target_date"):
                data["target_date"] = data["targetDate"]
            if "target_date" in data and not data.get("end_date"):
                data["end_date"] = data["target_date"]
            if "end_date" in data and not data.get("target_date"):
                data["target_date"] = data["end_date"]
            if "teacherName" in data and not data.get("teacher_name"):
                data["teacher_name"] = data["teacherName"]
            if "teacher" in data and not data.get("teacher_name"):
                data["teacher_name"] = data["teacher"]
            if "startDate" in data and not data.get("start_date"):
                data["start_date"] = data["startDate"]
            if "academicYear" in data and not data.get("academic_year"):
                data["academic_year"] = data["academicYear"]
            if "branch" in data and not data.get("branch"):
                data["branch"] = "Tarabai Park"
            if not data.get("chapter"):
                data["chapter"] = "Curriculum Chapter"
            if not data.get("standard"):
                data["standard"] = "Class 12th"
            if not data.get("teacher_name"):
                data["teacher_name"] = "Senior Faculty"
            if not data.get("topic_name"):
                data["topic_name"] = "Topic Plan"
        return data

class TopicDurationCreate(TopicDurationBase):
    pass

class TopicDurationUpdate(BaseModel):
    topic_id: Optional[str] = None
    standard: Optional[str] = None
    branch: Optional[str] = None
    batch: Optional[str] = None
    subject: Optional[str] = None
    teacher_name: Optional[str] = None
    chapter: Optional[str] = None
    topic_name: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    target_date: Optional[str] = None
    required_periods: Optional[int] = None
    period_duration_mins: Optional[int] = None
    completed_periods: Optional[int] = None
    status: Optional[str] = None
    academic_year: Optional[str] = None
    month: Optional[str] = None
    remarks: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_update_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "topicName" in data and not data.get("topic_name"):
                data["topic_name"] = data["topicName"]
            if "requiredPeriods" in data and not data.get("required_periods"):
                data["required_periods"] = data["requiredPeriods"]
            if "periodDurationMins" in data and not data.get("period_duration_mins"):
                data["period_duration_mins"] = data["periodDurationMins"]
            if "completedPeriods" in data and not data.get("completed_periods"):
                data["completed_periods"] = data["completedPeriods"]
            if "targetDate" in data and not data.get("end_date"):
                data["end_date"] = data["targetDate"]
            if "targetDate" in data and not data.get("target_date"):
                data["target_date"] = data["targetDate"]
            if "target_date" in data and not data.get("end_date"):
                data["end_date"] = data["target_date"]
            if "end_date" in data and not data.get("target_date"):
                data["target_date"] = data["end_date"]
            if "teacherName" in data and not data.get("teacher_name"):
                data["teacher_name"] = data["teacherName"]
            if "teacher" in data and not data.get("teacher_name"):
                data["teacher_name"] = data["teacher"]
        return data

class TopicDurationResponse(TopicDurationBase):
    id: str

class TopicDurationMatrixSummary(BaseModel):
    subject: str
    teacher_name: str
    batch: str
    total_topics: int
    total_planned_periods: int
    total_completed_periods: int
    completion_percentage: float
    completed_count: int
    in_progress_count: int
    upcoming_count: int
    topics: List[TopicDurationResponse]
