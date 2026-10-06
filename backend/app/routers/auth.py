from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models import User, Profile
from app.schemas import UserRegister, UserLogin, Token, UserOut
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])
direct_router = APIRouter(tags=["Authentication (Direct)"])

def handle_register(user_in: UserRegister, db: Session) -> Token:
    clean_email = str(user_in.email).strip().lower()
    clean_name = str(user_in.name).strip() if user_in.name else "Candidate"
    
    existing = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists. Please sign in instead."
        )
    
    hashed = hash_password(user_in.password)
    new_user = User(
        email=clean_email,
        password_hash=hashed,
        name=clean_name
    )
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Automatically create default initial profile
        profile = Profile(
            user_id=new_user.id,
            target_role="Software Developer",
            headline=f"{new_user.name} | Software Developer",
            skills=["Python", "JavaScript", "React", "FastAPI"],
            links={"email": new_user.email}
        )
        db.add(profile)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

    token = create_access_token(data={"sub": str(new_user.id), "email": new_user.email})
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(new_user)
    )

def handle_login(credentials: UserLogin, db: Session) -> Token:
    clean_email = str(credentials.email).strip().lower()
    user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )

# Routes under /api/auth
@router.post("/register", response_model=Token)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    return handle_register(user_in, db)

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    return handle_login(credentials, db)

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)

# Direct routes under /api (e.g. /api/register, /api/login, /api/me)
@direct_router.post("/register", response_model=Token, include_in_schema=False)
def direct_register(user_in: UserRegister, db: Session = Depends(get_db)):
    return handle_register(user_in, db)

@direct_router.post("/login", response_model=Token, include_in_schema=False)
def direct_login(credentials: UserLogin, db: Session = Depends(get_db)):
    return handle_login(credentials, db)

@direct_router.get("/me", response_model=UserOut, include_in_schema=False)
def direct_get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)

