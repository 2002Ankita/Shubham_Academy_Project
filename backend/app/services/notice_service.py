from typing import Optional, List
from app.models.notices import Notice
from app.models.user import User
from app.schemas.notices import NoticeCreate

async def create_notice(notice_in: NoticeCreate, current_user: User) -> Notice:
    notice = Notice(
        title=notice_in.title,
        content=notice_in.content,
        target_audiences=notice_in.target_audiences,
        target_batches=notice_in.target_batches or [],
        category=notice_in.category or "General",
        priority=notice_in.priority or "Normal",
        branch=notice_in.branch,
        batch=notice_in.batch,
        standard=notice_in.standard,
        created_by=current_user
    )
    await notice.insert()
    return notice

async def get_notices(
    branch: Optional[str] = None,
    batch: Optional[str] = None,
    audience: Optional[str] = None,
    current_user: Optional[User] = None
) -> list[dict]:
    notices = await Notice.find_all().sort("-created_at").to_list()
    res = []
    
    user_role = (getattr(current_user, "role", "") or "").lower().replace("-", "_")
    is_super = user_role in ["super_admin", "superadmin"]
    user_branch = getattr(current_user, "branch", None)

    for n in notices:
        # Branch filtering
        n_branch = getattr(n, "branch", None)
        if branch and branch.upper() != "ALL":
            if n_branch and n_branch.upper() not in ["ALL", "ALL CAMPUSES"] and branch.lower() not in n_branch.lower():
                continue
        elif not is_super and user_branch and user_branch.upper() not in ["ALL", "ALL CAMPUSES"]:
            if n_branch and n_branch.upper() not in ["ALL", "ALL CAMPUSES"] and user_branch.lower() not in n_branch.lower():
                continue

        # Batch filtering
        if batch and batch.upper() != "ALL":
            n_batch = getattr(n, "batch", None)
            n_target_batches = getattr(n, "target_batches", []) or []
            matches_batch = False
            if n_batch and batch.lower() in n_batch.lower():
                matches_batch = True
            elif any(batch.lower() in tb.lower() for tb in n_target_batches):
                matches_batch = True
            elif not n_batch and not n_target_batches:
                matches_batch = True
            if not matches_batch:
                continue

        # Target audience filtering
        if audience and audience.upper() != "ALL":
            audiences = [a.upper() for a in (getattr(n, "target_audiences", []) or [])]
            if "ALL" not in audiences and audience.upper() not in audiences:
                continue

        d = n.dict()
        if n.created_by:
            try:
                user = await User.get(n.created_by.ref.id)
                d["created_by"] = {"full_name": user.full_name, "email": user.email} if user else None
            except Exception:
                d["created_by"] = None
        d["id"] = str(n.id)
        d["branch"] = getattr(n, "branch", None)
        d["batch"] = getattr(n, "batch", None)
        d["standard"] = getattr(n, "standard", None)
        res.append(d)
    return res

async def delete_notice(id: str):
    from bson.errors import InvalidId
    from bson import ObjectId
    try:
        notice = await Notice.get(ObjectId(id))
        if notice:
            await notice.delete()
    except InvalidId:
        pass
