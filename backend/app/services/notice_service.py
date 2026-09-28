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

async def get_notices() -> list[dict]:
    notices = await Notice.find_all().to_list()
    res = []
    for n in notices:
        d = n.dict()
        if n.created_by:
            user = await User.get(n.created_by.ref.id)
            d["created_by"] = {"full_name": user.full_name, "email": user.email} if user else None
        d["id"] = str(n.id)
        res.append(d)
    return res
