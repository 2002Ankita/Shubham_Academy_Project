from beanie import Document, Indexed
from typing import Optional, Annotated
from datetime import datetime

class BranchAccount(Document):
    branch: Annotated[str, Indexed(unique=True)]  # "Tarabai Park", "Mangalvar Peth"
    accounts_id: str                              # "accounts.tarabai", "accounts.mangalvar"
    password: str                                 # "Tarabai@123", "Mangalvar@123"
    hashed_password: Optional[str] = None
    role: str = "accounts_admin"
    is_active: bool = True
    updated_at: datetime = datetime.utcnow()

    class Settings:
        name = "branch_accounts"
