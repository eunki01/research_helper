from central_server.utils.encoder import hash_password
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from central_server.models.user_model import User
from central_server.schemas.user_create import UserCreate

async def create_user(db: AsyncSession, user: UserCreate):
  hashed_password = hash_password(user.Password)
  db_user = User(email=user.Email, hashed_password=hashed_password)
  db.add(db_user)
  await db.commit()
  await db.refresh(db_user)
  return db_user

async def get_user_by_id(db: AsyncSession, user_id: int):
    return await db.get(User, user_id)

async def get_user_by_email(db: AsyncSession, email: str):
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def update_user(db: AsyncSession, db_user: User, user_update: UserCreate):
    update_data = user_update.model_dump(exclude_unset=True) 

    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user
  
async def set_user_active_status(db: AsyncSession, db_user: User, new_status: bool) -> User:
  db_user.is_active = new_status
  db.add(db_user)
  await db.commit()
  await db.refresh(db_user)
  
  return db_user

async def delete_user(db: AsyncSession, db_user: User):
    await db.delete(db_user)
    await db.commit()
    return {"ok": True}
