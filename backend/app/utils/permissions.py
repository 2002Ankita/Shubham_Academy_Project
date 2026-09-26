from fastapi import HTTPException, status
from typing import List

# These are placeholders. In a real app, we would verify the user's role from their JWT token or DB record.
def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: dict): # We will replace dict with actual User schema later
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return current_user
    return role_checker
