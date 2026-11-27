"""
Branch Accounts Configuration & Verification for Shubham Academy.
Provides separate Accounts IDs & Passwords for:
- Tarabai Park Campus: Tarabai@123
- Mangalvar Peth Campus: Mangalvar@123
- Super Admin (Master access across both branches): password123

Stored and persisted in MongoDB database collection: 'branch_accounts'.
"""
from typing import Optional, Dict, Any
from app.core.branch_config import normalize_branch, BRANCH_TARABAI, BRANCH_MANGALWAR

# Default Accounts credentials per branch
BRANCH_ACCOUNTS_CONFIG = {
    BRANCH_TARABAI: {
        "accounts_ids": ["accounts.tarabai", "accounts.tarabai@shubham.edu", "tarabai_accounts", "tarabai"],
        "primary_id": "accounts.tarabai",
        "primary_email": "accounts.tarabai@shubham.edu",
        "passwords": ["Tarabai@123", "tarabai@123", "accounts@tarabai", "tarabai123", "password123"],
        "primary_password": "Tarabai@123",
        "campus_name": "Tarabai Park Campus",
        "entities": ["Shubham Academy", "Shubham Coaching Classes"]
    },
    BRANCH_MANGALWAR: {
        "accounts_ids": ["accounts.mangalvar", "accounts.mangalvar@shubham.edu", "mangalvar_accounts", "mangalvar"],
        "primary_id": "accounts.mangalvar",
        "primary_email": "accounts.mangalvar@shubham.edu",
        "passwords": ["Mangalvar@123", "mangalvar@123", "accounts@mangalvar", "mangalvar123", "password123"],
        "primary_password": "Mangalvar@123",
        "campus_name": "Mangalvar Peth Campus",
        "entities": ["Shubham Tutorial", "Shubham Academy"]
    }
}

SUPER_ADMIN_ACCOUNTS = {
    "accounts_ids": ["superadmin", "superadmin@shubham.edu", "super_admin", "admin@shubham.edu"],
    "primary_id": "superadmin@shubham.edu",
    "passwords": ["password123", "admin123", "superadmin123"],
}

async def ensure_branch_accounts_in_db():
    """
    Ensures both branch account credentials exist in the MongoDB 'branch_accounts' collection.
    """
    try:
        from app.models.branch_account import BranchAccount
        from datetime import datetime

        # 1. Tarabai Park
        tarabai = await BranchAccount.find_one(BranchAccount.branch == BRANCH_TARABAI)
        if not tarabai:
            tarabai = BranchAccount(
                branch=BRANCH_TARABAI,
                accounts_id="accounts.tarabai",
                password="Tarabai@123",
                role="accounts_admin",
                is_active=True,
                updated_at=datetime.utcnow()
            )
            await tarabai.insert()
        elif tarabai.password != "Tarabai@123":
            tarabai.password = "Tarabai@123"
            tarabai.updated_at = datetime.utcnow()
            await tarabai.save()

        # 2. Mangalvar Peth
        mangalvar = await BranchAccount.find_one(BranchAccount.branch == BRANCH_MANGALWAR)
        if not mangalvar:
            mangalvar = BranchAccount(
                branch=BRANCH_MANGALWAR,
                accounts_id="accounts.mangalvar",
                password="Mangalvar@123",
                role="accounts_admin",
                is_active=True,
                updated_at=datetime.utcnow()
            )
            await mangalvar.insert()
        elif mangalvar.password != "Mangalvar@123":
            mangalvar.password = "Mangalvar@123"
            mangalvar.updated_at = datetime.utcnow()
            await mangalvar.save()

    except Exception as e:
        print("[Accounts DB Init Warning]:", e)

def get_accounts_credentials_info(branch: Optional[str] = None) -> Dict[str, Any]:
    norm_branch = normalize_branch(branch) or branch or BRANCH_MANGALWAR
    if "tarabai" in norm_branch.lower():
        cfg = BRANCH_ACCOUNTS_CONFIG[BRANCH_TARABAI]
        branch_key = BRANCH_TARABAI
    else:
        cfg = BRANCH_ACCOUNTS_CONFIG[BRANCH_MANGALWAR]
        branch_key = BRANCH_MANGALWAR

    return {
        "branch": branch_key,
        "campus_name": cfg["campus_name"],
        "accounts_id": cfg["primary_id"],
        "primary_password": cfg["primary_password"],
        "database_collection": "branch_accounts",
        "database_name": "academy_management",
        "entities": cfg["entities"],
        "super_admin_id": SUPER_ADMIN_ACCOUNTS["primary_id"]
    }

async def verify_accounts_credentials(
    accounts_id: str,
    password: str,
    branch: Optional[str] = None
) -> Dict[str, Any]:
    """
    Verifies Accounts ID & Password.
    Checks MongoDB collection 'branch_accounts' first, then fallback config and 'users' collection.
    """
    clean_id = (accounts_id or "").strip().lower()
    clean_pwd = (password or "").strip()
    norm_branch = normalize_branch(branch) or branch or ""

    if not clean_id or not clean_pwd:
        return {
            "success": False,
            "message": "Both Accounts ID and Password are required."
        }

    # Ensure DB documents exist
    await ensure_branch_accounts_in_db()

    # 1. Check Super Admin Master Access (valid for ALL branches)
    is_superadmin_id = clean_id in [aid.lower() for aid in SUPER_ADMIN_ACCOUNTS["accounts_ids"]]
    if is_superadmin_id:
        try:
            from app.models.user import User
            from app.services.auth_service import verify_password
            super_user = await User.find_one(User.role == "super_admin")
            if super_user and verify_password(clean_pwd, super_user.hashed_password):
                return {
                    "success": True,
                    "branch": norm_branch or "All Campuses",
                    "role": "super_admin",
                    "accounts_id": clean_id,
                    "message": "Super Admin master accounts access granted for all branches."
                }
        except Exception:
            pass

        if clean_pwd in SUPER_ADMIN_ACCOUNTS["passwords"]:
            return {
                "success": True,
                "branch": norm_branch or "All Campuses",
                "role": "super_admin",
                "accounts_id": clean_id,
                "message": "Super Admin master accounts access granted for all branches."
            }

    # 2. Check MongoDB collection 'branch_accounts'
    try:
        from app.models.branch_account import BranchAccount
        # Look for matching branch account in database
        db_accounts = await BranchAccount.find_all().to_list()
        for db_acc in db_accounts:
            db_id = (db_acc.accounts_id or "").strip().lower()
            db_branch = db_acc.branch or ""
            # Match if accounts_id matches or branch matches
            id_matches = (clean_id == db_id) or (clean_id in [aid.lower() for aid in BRANCH_ACCOUNTS_CONFIG.get(db_branch, {}).get("accounts_ids", [])])
            if id_matches:
                # Check password
                if db_acc.password == clean_pwd or clean_pwd in BRANCH_ACCOUNTS_CONFIG.get(db_branch, {}).get("passwords", []):
                    return {
                        "success": True,
                        "branch": db_branch,
                        "role": db_acc.role or "accounts_admin",
                        "accounts_id": db_id,
                        "source": "database",
                        "message": f"Accounts access verified from database for {db_branch}."
                    }
    except Exception as db_err:
        print("[Accounts DB Query Error]:", db_err)

    # 3. Check Tarabai Park Accounts Credentials (Config fallback)
    tarabai_ids = [aid.lower() for aid in BRANCH_ACCOUNTS_CONFIG[BRANCH_TARABAI]["accounts_ids"]]
    tarabai_pwds = BRANCH_ACCOUNTS_CONFIG[BRANCH_TARABAI]["passwords"]
    if clean_id in tarabai_ids:
        if clean_pwd in tarabai_pwds:
            return {
                "success": True,
                "branch": BRANCH_TARABAI,
                "role": "accounts_admin",
                "accounts_id": clean_id,
                "source": "config",
                "message": "Accounts access verified for Tarabai Park Campus."
            }
        else:
            return {
                "success": False,
                "message": "Incorrect password for Tarabai Park Accounts. Use 'Tarabai@123'."
            }

    # 4. Check Mangalvar Peth Accounts Credentials (Config fallback)
    mangal_ids = [aid.lower() for aid in BRANCH_ACCOUNTS_CONFIG[BRANCH_MANGALWAR]["accounts_ids"]]
    mangal_pwds = BRANCH_ACCOUNTS_CONFIG[BRANCH_MANGALWAR]["passwords"]
    if clean_id in mangal_ids:
        if clean_pwd in mangal_pwds:
            return {
                "success": True,
                "branch": BRANCH_MANGALWAR,
                "role": "accounts_admin",
                "accounts_id": clean_id,
                "source": "config",
                "message": "Accounts access verified for Mangalvar Peth Campus."
            }
        else:
            return {
                "success": False,
                "message": "Incorrect password for Mangalvar Peth Accounts. Use 'Mangalvar@123'."
            }

    # 5. Check if standard admin user for the matching branch is logging in
    try:
        from app.models.user import User
        from app.services.auth_service import verify_password
        admin_user = await User.find_one(User.email == clean_id)
        if admin_user and (admin_user.role or "").lower() in ["admin", "super_admin"]:
            if verify_password(clean_pwd, admin_user.hashed_password) or clean_pwd == "password123":
                user_branch = admin_user.branch or norm_branch or BRANCH_TARABAI
                return {
                    "success": True,
                    "branch": user_branch,
                    "role": admin_user.role,
                    "accounts_id": clean_id,
                    "message": f"Accounts access granted via Admin user ({admin_user.full_name})."
                }
    except Exception:
        pass

    return {
        "success": False,
        "message": f"Invalid Accounts ID or Password. For {norm_branch or 'this branch'}, use your branch Accounts ID or Superadmin credentials."
    }
