from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from fastapi.responses import StreamingResponse
from typing import Optional
import io
from app.services.report_service import generate_dashboard_report, generate_excel_export
from app.services.auth_service import get_current_user
from app.routers.auth import oauth2_scheme
from app.models.user import User

router = APIRouter(prefix="/reports", tags=["Reports"])

def check_report_access(user: User):
    role_norm = (user.role or "").lower().replace("-", "_")
    if role_norm not in ["super_admin", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: The official Academy Report is accessible only to Super Admin, Admin, and Branch-level authorized users."
        )

@router.get("")
async def get_reports(
    branch: Optional[str] = Query(None, description="Optional branch filter for Super Admin"),
    token: str = Depends(oauth2_scheme)
):
    current_user = await get_current_user(token)
    check_report_access(current_user)
    return await generate_dashboard_report(current_user, branch_filter=branch)

@router.get("/export/excel")
async def export_excel_report(
    module: str = Query("students", description="Module to export: students, fees, salary"),
    branch: Optional[str] = Query(None, description="Branch scope for export"),
    token: str = Depends(oauth2_scheme)
):
    current_user = await get_current_user(token)
    check_report_access(current_user)
    
    excel_bytes = await generate_excel_export(module=module, current_user=current_user, branch_filter=branch)
    
    filename = f"Shubham_Classes_Kolhapur_{module.capitalize()}_Report.xlsx"
    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
