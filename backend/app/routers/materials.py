from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from typing import List, Optional
from datetime import datetime
import os
import shutil
from app.models.material import Material
from app.services.auth_service import get_current_user
from app.routers.auth import oauth2_scheme
from pydantic import BaseModel

router = APIRouter(prefix="/materials", tags=["Materials"])

class MaterialResponse(BaseModel):
    id: str
    title: str
    standard: str
    subject: str
    fileType: str
    size: str
    description: Optional[str] = None
    teacherName: Optional[str] = None
    uploadDate: str

UPLOAD_DIR = "uploads/materials"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("", response_model=MaterialResponse)
async def upload_material(
    title: str = Form(...),
    standard: str = Form(...),
    subject: str = Form(...),
    fileType: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    token: str = Depends(oauth2_scheme)
):
    user = await get_current_user(token)
    from app.services.teacher_service import resolve_teacher
    teacher = await resolve_teacher(str(user.id))
    
    import uuid
    safe_filename = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Calculate size
    size_bytes = os.path.getsize(file_path)
    size_mb = f"{size_bytes / (1024 * 1024):.1f} MB"
    
    mat = Material(
        title=title,
        standard=standard,
        subject=subject,
        file_type=fileType,
        size=size_mb,
        description=description,
        file_path=file_path,
        teacher=teacher if teacher else None,
        teacher_name=user.full_name,
        upload_date=datetime.utcnow()
    )
    await mat.insert()
    
    return MaterialResponse(
        id=str(mat.id),
        title=mat.title,
        standard=mat.standard,
        subject=mat.subject,
        fileType=mat.file_type,
        size=mat.size,
        description=mat.description,
        teacherName=mat.teacher_name,
        uploadDate=mat.upload_date.strftime("%Y-%m-%d")
    )

@router.get("", response_model=List[MaterialResponse])
async def list_materials(token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    mats = await Material.find_all().sort("-upload_date").to_list()
    return [
        MaterialResponse(
            id=str(m.id),
            title=m.title,
            standard=m.standard,
            subject=m.subject,
            fileType=m.file_type,
            size=m.size,
            description=m.description,
            teacherName=m.teacher_name,
            uploadDate=m.upload_date.strftime("%Y-%m-%d")
        ) for m in mats
    ]

@router.get("/{id}/download")
async def download_material(id: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    from bson import ObjectId
    mat = await Material.get(ObjectId(id))
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
    if not os.path.exists(mat.file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    filename = os.path.basename(mat.file_path)
    if "_" in filename and len(filename.split("_")[0]) == 32:
        filename = filename[33:]
    return FileResponse(mat.file_path, filename=filename)
