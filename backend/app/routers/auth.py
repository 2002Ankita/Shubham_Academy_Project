from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.schemas.auth import UserCreate, UserResponse, Token, UserLogin, UserUpdate
from app.services.auth_service import create_user, authenticate

router = APIRouter(prefix="/auth", tags=["Auth"])

# OAuth2 scheme for Swagger UI
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")

@router.post("/register", response_model=UserResponse)
async def register(user_in: UserCreate):
    user = await create_user(user_in)
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "branch": getattr(user, "branch", None),
        "is_active": user.is_active
    }

@router.post("/login", response_model=Token)
async def login(user_in: UserLogin):
    access_token = await authenticate(user_in)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/token", response_model=Token)
async def login_swagger(form_data: OAuth2PasswordRequestForm = Depends()):
    user_in = UserLogin(email=form_data.username, password=form_data.password)
    access_token = await authenticate(user_in)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    from app.services.auth_service import get_current_user
    try:
        user = await get_current_user(token)
        if user and (user.role or "").upper() == "TEACHER":
            from app.services.attendance_service import auto_record_teacher_logout
            await auto_record_teacher_logout(str(user.id))
    except Exception as e:
        print("Auto teacher logout error:", e)
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def get_me(token: str = Depends(oauth2_scheme)):
    from app.services.auth_service import get_current_user
    user = await get_current_user(token)

    branch_val = getattr(user, "branch", None)
    batch_val = None
    acad_batch_val = None
    session_val = None
    student_id_val = None

    if (user.role or "").upper() == "STUDENT":
        from app.models.student import Student
        st = await Student.find_one({
            "$or": [{"user.$id": user.id}, {"user.id": user.id}, {"user": user.id}]
        })
        if st:
            branch_val = st.branch or branch_val
            batch_val = st.batch or st.academic_batch
            acad_batch_val = st.academic_batch or st.batch
            session_val = st.session
            student_id_val = st.student_id
            if user.branch != branch_val:
                user.branch = branch_val
                await user.save()

    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "branch": branch_val,
        "batch": batch_val,
        "academic_batch": acad_batch_val,
        "session": session_val,
        "student_id": student_id_val,
        "is_active": user.is_active
    }

@router.put("/me", response_model=UserResponse)
async def update_me(user_update: UserUpdate, token: str = Depends(oauth2_scheme)):
    from app.services.auth_service import get_current_user
    from app.core.security import get_password_hash
    user = await get_current_user(token)
    
    if user_update.full_name is not None:
        user.full_name = user_update.full_name
    if user_update.email is not None:
        user.email = user_update.email
    if user_update.branch is not None:
        user.branch = user_update.branch
    if user_update.password is not None and user_update.password != "":
        user.hashed_password = get_password_hash(user_update.password)
        
    await user.save()
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "branch": getattr(user, "branch", None),
        "is_active": user.is_active
    }
