from fastapi import APIRouter, Depends
from app.services.report_service import generate_dashboard_report
from app.services.auth_service import get_current_user
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("")
async def get_reports(token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await generate_dashboard_report()
