from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class NoticeCreate(BaseModel):
    title: str
    content: str
    target_audiences: List[str]
    target_batches: Optional[List[str]] = []
    category: Optional[str] = "General"
    priority: Optional[str] = "Normal"

class NoticeResponse(NoticeCreate):
    id: str
    created_at: datetime
    created_by_name: str
