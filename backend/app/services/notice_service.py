from app.models.notices import Notice
from app.models.user import User
from app.schemas.notices import NoticeCreate

async def create_notice(notice_in: NoticeCreate, current_user: User) -> Notice:
    notice = Notice(
        title=notice_in.title,
        content=notice_in.content,
        target_audiences=notice_in.target_audiences,
        target_batches=notice_in.target_batches,
        created_by=current_user
    )
    await notice.insert()
    return notice

async def get_notices() -> list[Notice]:
    return await Notice.find_all(fetch_links=True).to_list()
