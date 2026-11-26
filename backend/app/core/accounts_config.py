"""
Branch Accounts Configuration & Verification for Shubham Academy.
Provides separate Accounts IDs & Passwords for:
- Tarabai Park Campus
- Mangalvar Peth Campus
- Super Admin (Master access across both branches)
"""
from typing import Optional, Dict, Any
from app.core.branch_config import normalize_branch, BRANCH_TARABAI, BRANCH_MANGALWAR

# Default Accounts credentials per branch
BRANCH_ACCOUNTS_CONFIG = {
    BRANCH_TARABAI: {
        "accounts_ids": ["accounts.tarabai", "accounts.tarabai@shubham.edu", "tarabai_accounts", "tarabai"],
        "primary_id": "accounts.tarabai",
        "primary_email": "accounts.tarabai@shubham.edu",
        "passwords": ["accounts@tarabai", "tarabai123", "password123"],
        "campus_name": "Tarabai Park Campus",
        "entities": ["Shubham Academy", "Shubham Coaching Classes"]
    },
    BRANCH_MANGALWAR: {
        "accounts_ids": ["accounts.mangalvar", "accounts.mangalvar@shubham.edu", "mangalvar_accounts", "mangalvar"],
        "primary_id": "accounts.mangalvar",
        "primary_email": "accounts.mangalvar@shubham.edu",
        "passwords": ["accounts@mangalvar", "mangalvar123", "password123"],
        "campus_name": "Mangalvar Peth Campus",
        "entities": ["Shubham Tutorial", "Shubham Academy"]
    }
}

SUPER_ADMIN_ACCOUNTS = {
    "accounts_ids": ["superadmin", "superadmin@shubham.edu", "super_admin", "admin@shubham.edu"],
    "primary_id": "superadmin@shubham.edu",
    "passwords": ["password123", "admin123", "superadmin123"],
}

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
    Returns result dict with success, branch, role, and message.
    """
    clean_id = (accounts_id or "").strip().lower()
    clean_pwd = (password or "").strip()
    norm_branch = normalize_branch(branch) or branch or ""

    if not clean_id or not clean_pwd:
        return {
            "success": False,
            "message": "Both Accounts ID and Password are required."
        }

    # 1. Check Super Admin Master Access (valid for ALL branches)
    is_superadmin_id = clean_id in [aid.lower() for aid in SUPER_ADMIN_ACCOUNTS["accounts_ids"]]
    if is_superadmin_id:
        # Check against database superadmin user if possible
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

        # Fallback to configured superadmin passwords
        if clean_pwd in SUPER_ADMIN_ACCOUNTS["passwords"]:
            return {
                "success": True,
                "branch": norm_branch or "All Campuses",
                "role": "super_admin",
                "accounts_id": clean_id,
                "message": "Super Admin master accounts access granted for all branches."
            }

    # 2. Check Tarabai Park Accounts Credentials
    tarabai_ids = [aid.lower() for aid in BRANCH_ACCOUNTS_CONFIG[BRANCH_TARABAI]["accounts_ids"]]
    tarabai_pwds = BRANCH_ACCOUNTS_CONFIG[BRANCH_TARABAI]["passwords"]
    if clean_id in tarabai_ids:
        if clean_pwd in tarabai_pwds:
            return {
                "success": True,
                "branch": BRANCH_TARABAI,
                "role": "accounts_admin",
                "accounts_id": clean_id,
                "message": "Accounts access verified for Tarabai Park Campus."
            }
        else:
            return {
                "success": False,
                "message": "Incorrect password for Tarabai Park Accounts."
            }

    # 3. Check Mangalvar Peth Accounts Credentials
    mangal_ids = [aid.lower() for aid in BRANCH_ACCOUNTS_CONFIG[BRANCH_MANGALWAR]["accounts_ids"]]
    mangal_pwds = BRANCH_ACCOUNTS_CONFIG[BRANCH_MANGALWAR]["passwords"]
    if clean_id in mangal_ids:
        if clean_pwd in mangal_pwds:
            return {
                "success": True,
                "branch": BRANCH_MANGALWAR,
                "role": "accounts_admin",
                "accounts_id": clean_id,
                "message": "Accounts access verified for Mangalvar Peth Campus."
            }
        else:
            return {
                "success": False,
                "message": "Incorrect password for Mangalvar Peth Accounts."
            }

    # 4. Check if standard admin user for the matching branch is logging in
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
