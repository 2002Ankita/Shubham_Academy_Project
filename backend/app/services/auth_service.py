from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin
from app.core.security import get_password_hash, verify_password, create_access_token

async def create_user(user_in: UserCreate) -> User:
    user = await User.find_one(User.email == user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role
    )
    await user.insert()
    return user

async def authenticate(user_in: UserLogin) -> str:
    clean_identifier = user_in.email.strip()
    user = await User.find_one(User.email == clean_identifier)
    
    # If not found by email, search if this identifier is a student's mobile number
    if not user:
        from app.models.student import Student
        clean_mobile = "".join(filter(str.isdigit, clean_identifier))
        student = await Student.find_one(Student.mobile_number == clean_identifier)
        if not student and clean_mobile:
            student = await Student.find_one(Student.mobile_number == clean_mobile)
            
        if student and student.user:
            if isinstance(student.user, User):
                user = student.user
            else:
                user = await User.get(student.user.ref.id)

    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email, mobile number, or password")
    if not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email, mobile number, or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    return create_access_token(subject=user.email)


async def get_current_user(token: str) -> User:
    # Basic mockup, real implementation requires decoding JWT and fetching from DB
    import jwt
    from jwt.exceptions import PyJWTError as JWTError
    from app.core.config import settings
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await User.find_one(User.email == email)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user
