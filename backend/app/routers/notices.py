from fastapi import APIRouter, Depends
from typing import List
from app.schemas.notices import NoticeCreate, NoticeResponse
from app.services.notice_service import create_notice, get_notices
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
        created_at=notice.created_at,
        created_by_name=user.full_name
    )

@router.get("", response_model=List[NoticeResponse])
async def list_notices(token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    notices = await get_notices()
    return [
        NoticeResponse(
            id=str(n.id),
            title=n.title,
            content=n.content,
            target_audiences=n.target_audiences,
            target_batches=n.target_batches,
            created_at=n.created_at,
            created_by_name=n.created_by.full_name
        ) for n in notices
    ]
