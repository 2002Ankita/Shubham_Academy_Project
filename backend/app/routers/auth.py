from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.schemas.auth import UserCreate, UserResponse, Token, UserLogin
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
    # JWT is stateless, so we just return success.
    # To actually invalidate, a token blacklist would be needed.
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def get_me(token: str = Depends(oauth2_scheme)):
    from app.services.auth_service import get_current_user
    user = await get_current_user(token)
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active
    }
