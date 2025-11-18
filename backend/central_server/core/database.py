from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import AsyncGenerator
from core.config import settings
from contextlib import asynccontextmanager
from fastapi import FastAPI

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
    
@asynccontextmanager
async def lifespan(app: FastAPI):
  from models import (
      User, Author, Paper, Citation, 
      Collection, PaperAuthor, CollectionPaper
  )
  print("Registered tables:", list(Base.metadata.tables.keys()))
  
  async with async_engine.begin() as conn:
    await conn.run_sync(Base.metadata.create_all)
  yield