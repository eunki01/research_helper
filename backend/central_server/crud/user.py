from utils.encoder import hash_password
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.user_model import User
from schemas.user_dto import UserDto
from schemas.user_create import RegisterRequest

async def create_user(db: AsyncSession, user: RegisterRequest):
    hashed_password = hash_password(user.Password)
    
    db_user = User(
        Email=user.Email, 
        PasswordHash=hashed_password,
        Name=user.Name,
        IsActive=False
    )
    
    db.add(db_user)
    await db.flush()
    await db.refresh(db_user)
    
    user_dto = UserDto(
        Email = db_user.Email,
        SignUpDate = db_user.SignUpDate
    )
    return user_dto

async def get_user_by_id(db: AsyncSession, user_id: int):
    result = await db.get(User, user_id)
    return result

async def get_user_by_email(db: AsyncSession, email: str):
    stmt = select(User).where(User.Email == email)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def update_user(db: AsyncSession, db_user: User, user_update: RegisterRequest):
    update_data = user_update.model_dump(exclude_unset=True) 

    for key, value in update_data.items():
        if key == 'Password':
            setattr(db_user, 'PasswordHash', hash_password(value))
        elif key == 'Email':
            setattr(db_user, 'Email', value)
        elif key == 'Name':
            setattr(db_user, 'Name', value)
        elif key == 'IsActive':
            setattr(db_user, 'IsActive', value)

    await db.commit()
    await db.refresh(db_user)
    return db_user
    
async def set_user_active_status(db: AsyncSession, db_user: User, new_status: bool) -> User:
    db_user.IsActive = new_status
    await db.commit()
    await db.refresh(db_user)
    
    return db_user

async def delete_user(db: AsyncSession, db_user: User):
    await db.delete(db_user)
    await db.commit()
    return {"ok": True}