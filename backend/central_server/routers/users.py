from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from models import user_model
from utils.email import send_email
from fastapi.security import OAuth2PasswordRequestForm
from services.authentication_service import create_access_token_and_refresh_token, verify_token, generate_verification_token, verify_verification_token
from crud.user import get_user_by_email, create_user, set_user_active_status
from utils.encoder import verify_password
from schemas.token import Token
from schemas.user_dto import UserDto
from schemas.user_create import RegisterRequest
from models.user_model import User

router = APIRouter(
  prefix="/users",
  tags=["users"]
)

@router.post("/resend-verification-email")
async def send_verification_code(email: str, db: AsyncSession = Depends(get_db)):
  success, status_code = await _send_verification_email_logic(db, email)
    
  if not success and status_code == "already_active":
      raise HTTPException(status_code=400, detail="이미 인증된 이메일입니다.")
      
  return {"message": "인증 링크가 이메일로 전송되었습니다."}

@router.get("/verify-email")
async def verfiy_code(token: str, db: AsyncSession = Depends(get_db)):
  email = await verify_verification_token(token)
  if not email:
      raise HTTPException(status_code=400, detail="유효하지 않거나 만료된 인증 링크입니다.")
  
  db_user: User = await get_user_by_email(db, email=email)
  
  if not db_user:
      raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
  
  if db_user.IsActive:
      raise HTTPException(status_code=400, detail="이미 인증된 이메일입니다.")
  
  await set_user_active_status(db, db_user=db_user, new_status=True)
  
  # 프론트엔드로 리다이렉트하거나 성공 메시지 반환
  return {"message": "인증 성공"}

@router.post("/register", response_model=UserDto, status_code=status.HTTP_201_CREATED)
async def create_new_user(user: RegisterRequest, db: AsyncSession = Depends(get_db)):
    db_user = await get_user_by_email(db, email=user.Email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email already registered"
        )
    new_user = await create_user(db=db, user=user)
    if new_user:
      await _send_verification_email_logic(db, new_user.Email)
      await db.commit()
      await db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
async def login(db: AsyncSession = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
  user = await get_user_by_email(db, form_data.username)
  if not user:
    raise HTTPException(status_code=400, detail="Incorrect email or password")
  if not verify_password(form_data.password, user.PasswordHash):
    raise HTTPException(status_code=400, detail="Incorrect email or password")
  return await create_access_token_and_refresh_token(user_id=user.UserId)

async def _send_verification_email_logic(db: AsyncSession, email: str):
    stmt = select(user_model.User).where(user_model.User.Email == email)
    result = await db.execute(stmt)
    existing_user = result.scalars().first()
    
    if existing_user and existing_user.IsActive:
        return False, "already_active"
        
    verification_token = await generate_verification_token(email)
    verification_link = f"http://localhost:5173//verify-email?token={verification_token}"
    
    send_email(
        to_email=email,
        subject="이메일 인증",
        body=f"mychat 이메일 인증을 위해 아래 링크를 클릭해주세요.\n\n{verification_link}\n\n이 링크는 5분 동안 유효합니다."
    )
    return True, "success"