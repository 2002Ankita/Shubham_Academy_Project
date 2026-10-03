from fastapi import APIRouter, Depends
from typing import List
from app.schemas.marks import ExamCreate, ExamResponse
from app.services.mark_service import create_exam, get_all_exams
from app.services.auth_service import get_current_user
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/exams", tags=["Exams"])

@router.post("", response_model=ExamResponse)
async def add_exam(exam_in: ExamCreate, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    return await create_exam(exam_in)

@router.get("", response_model=List[ExamResponse])
async def list_exams(token: str = Depends(oauth2_scheme)):
    user = await get_current_user(token)
    exams = await get_all_exams()
    if user.role.upper() == "STUDENT":
        from app.services.student_service import resolve_student
        student = await resolve_student(str(user.id))
        if student:
            matched_exams = []
            s_batch = (student.batch or "").lower()
            s_std = (student.standard or "").lower()
            s_parts = s_batch.split(" ")
            s_std_prefix = s_parts[0] if len(s_parts) > 0 else ""
            s_stream = s_parts[1] if len(s_parts) > 1 else ""
            
            for e in exams:
                e_batch = (e.get("batch") or "").lower()
                e_standard = (e.get("standard") or "").lower()
                e_subj = (e.get("subject") or "").lower()
                
                # Direct match
                if e_standard == s_batch and e_standard != "":
                    matched_exams.append(e)
                    continue
                
                # Subject overlap match
                e_std_prefix = e_standard.split(" ")[0] if " " in e_standard else (e_standard or e_batch)
                
                if s_std_prefix and e_std_prefix == s_std_prefix and s_stream:
                    has_subject_check = False
                    subject_matched = False
                    
                    if "physics" in e_subj:
                        has_subject_check = True
                        if "p" in s_stream: subject_matched = True
                    if "chemistry" in e_subj:
                        has_subject_check = True
                        if "c" in s_stream: subject_matched = True
                    if "math" in e_subj:
                        has_subject_check = True
                        if "m" in s_stream: subject_matched = True
                    if "biology" in e_subj:
                        has_subject_check = True
                        if "b" in s_stream: subject_matched = True
                        
                    if has_subject_check:
                        if subject_matched:
                            matched_exams.append(e)
                        continue
                        
                    if ("pcmb" in s_stream and ("pcm" in e_standard or "pcb" in e_standard)) or \
                       ("pcmb" in e_standard and ("pcm" in s_stream or "pcb" in s_stream)):
                        matched_exams.append(e)
                        continue
                
                # Generic fallback if not already matched
                if (e_standard == s_std or e_batch == s_std) and e_standard != "" and "pcm" not in e_standard and "pcb" not in e_standard:
                    matched_exams.append(e)
                        
            return matched_exams
    return exams

@router.delete("/{id}")
async def delete_exam_endpoint(id: str, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    from app.services.mark_service import delete_exam
    from fastapi import HTTPException
    try:
        await delete_exam(id)
        return {"message": "Exam deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/{id}", response_model=ExamResponse)
async def update_exam_endpoint(id: str, exam_in: dict, token: str = Depends(oauth2_scheme)):
    await get_current_user(token)
    from app.services.mark_service import update_exam
    from fastapi import HTTPException
    try:
        return await update_exam(id, exam_in)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
