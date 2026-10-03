from fastapi import APIRouter, Depends
from typing import List
from app.schemas.notices import NoticeCreate, NoticeResponse
from app.services.notice_service import create_notice, get_notices, delete_notice
from app.services.auth_service import get_current_user
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/notices", tags=["Notices"])

@router.post("", response_model=NoticeResponse)
async def add_notice(notice_in: NoticeCreate, token: str = Depends(oauth2_scheme)):
    user = await get_current_user(token)
    notice = await create_notice(notice_in, user)
    return NoticeResponse(
        id=str(notice.id),
        title=notice.title,
        content=notice.content,
        target_audiences=notice.target_audiences,
        target_batches=notice.target_batches,
        category=notice.category,
        priority=notice.priority,
        created_at=notice.created_at,
        created_by_name=user.full_name
    )

@router.get("", response_model=List[NoticeResponse])
async def list_notices(token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    notices = await get_notices()
    return [
        NoticeResponse(
            id=str(n.get("id")),
            title=n.get("title"),
            content=n.get("content"),
            target_audiences=n.get("target_audiences", []),
            target_batches=n.get("target_batches", []),
            category=n.get("category", "General"),
            priority=n.get("priority", "Normal"),
            created_at=n.get("created_at"),
            created_by_name=n.get("created_by", {}).get("full_name") if n.get("created_by") else "Admin"
        ) for n in notices
    ]

@router.delete("/{notice_id}")
async def delete_notice_endpoint(notice_id: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    await delete_notice(notice_id)
    return {"message": "Notice deleted successfully"}
