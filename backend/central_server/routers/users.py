from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from central_server.core.database import get_db
from central_server.models import user_model
from central_server.utils.email import send_email
from fastapi.security import OAuth2PasswordRequestForm
from central_server.services.authentication_service import create_access_token_and_refresh_token, verify_token, generate_verification_code, verify_code
from central_server.crud.user import get_user_by_email, create_user, set_user_active_status
from central_server.utils.encoder import verify_password
from central_server.schemas.token import Token
from central_server.schemas.user_dto import UserDto
from central_server.schemas.user_create import UserCreate
from central_server.models.user_model import User

router = APIRouter(
  prefix="/users",
  tags=["users"]
)

@router.post("/send-verification-code")
async def send_verification_code(email: str, db: AsyncSession =Depends(get_db)):
  stmt = select(user_model.User).where(user_model.User.email == email)
  result = await db.execute(stmt)
  existing_user = result.scalars().first()
  if existing_user.is_active:
    raise HTTPException(status_code=400, detail="이미 인증된 이메일입니다.")
  verification_code = generate_verification_code(email)
  
  send_email(
    to_email=email,
    subject="이메일 인증번호",
    body=f"mychat 인증번호는 {verification_code}입니다. 5분 내에 입력해주세요."
  )
  
  return {"message": "인증번호가 이메일로 전송되었습니다."}

@router.post("/verify-code")
async def verfiy_code(email: str, code: str, db: AsyncSession = Depends(get_db)):
  db_user: User = await get_user_by_email(db, email=email) 
    
  if not db_user:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
  if not verify_code(email, code):
    raise HTTPException(status_code=400, detail="인증번호가 올바르지 않습니다.")
  
  await set_user_active_status(db, db_user=db_user, new_status=True)
  return {"message":"인증 성공"}

@router.post("/register", response_model=UserDto, status_code=status.HTTP_201_CREATED)
async def create_new_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    db_user = await get_user_by_email(db, email=user.Email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email already registered"
        )
   
    return await create_user(db=db, user=user)

@router.post("/login", response_model=Token)
async def login(db: AsyncSession = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
  user = await get_user_by_email(db, form_data.username)
  if not user:
    raise HTTPException(status_code=400, detail="Incorrect email or password")
  if not verify_password(form_data.password, user.hashed_password):
    raise HTTPException(status_code=400, detail="Incorrect email or password")
  return create_access_token_and_refresh_token(user_id=user.id)