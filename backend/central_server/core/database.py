from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import AsyncGenerator
from central_server.core.config import settings

async_engine = create_async_engine(settings.DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(
  autocommit=False, autoflush=False, bind=async_engine, class_=AsyncSession
)
Base = declarative_base()

async def get_db() -> AsyncGenerator:
  async with AsyncSessionLocal() as db:
    try:
      yield db
      await db.commit()
    except:
      await db.rollback()
      raise
    finally:
      await db.close()

async def init_db():
  async with async_engine.begin() as conn:
    await conn.run_sync(Base.metadata.create_all)
    
