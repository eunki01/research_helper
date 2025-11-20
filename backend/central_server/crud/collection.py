# crud/collection.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, delete
from typing import List, Optional
from models import Collection, CollectionPaper, Paper
from datetime import datetime


async def create_collection(
    db: AsyncSession,
    user_id: int,
    name: str,
    description: Optional[str] = None
) -> Collection:
    """컬렉션 생성"""
    collection = Collection(
        UserId=user_id,
        CollectionName=name,
        Description=description,
        CreatedAt=datetime.utcnow()
    )
    db.add(collection)
    await db.commit()
    await db.refresh(collection)
    return collection


async def get_collection_by_id(
    db: AsyncSession,
    collection_id: int,
    user_id: Optional[int] = None
) -> Optional[Collection]:
    """컬렉션 조회"""
    query = select(Collection).where(Collection.CollectionId == collection_id)
    
    if user_id:
        query = query.where(Collection.UserId == user_id)
    
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_user_collections(
    db: AsyncSession,
    user_id: int
) -> List[tuple[Collection, int]]:
    """사용자의 모든 컬렉션 조회 (논문 수 포함)"""
    result = await db.execute(
        select(
            Collection,
            func.count(CollectionPaper.PaperId).label("paper_count")
        )
        .outerjoin(CollectionPaper, Collection.CollectionId == CollectionPaper.CollectionId)
        .where(Collection.UserId == user_id)
        .group_by(Collection.CollectionId)
        .order_by(Collection.CreatedAt.desc())
    )
    return result.all()


async def update_collection(
    db: AsyncSession,
    collection_id: int,
    user_id: int,
    name: Optional[str] = None,
    description: Optional[str] = None
) -> Optional[Collection]:
    """컬렉션 수정"""
    collection = await get_collection_by_id(db, collection_id, user_id)
    if not collection:
        return None
    
    if name is not None:
        collection.CollectionName = name
    if description is not None:
        collection.Description = description
    
    collection.UpdatedAt = datetime.utcnow()
    
    await db.commit()
    await db.refresh(collection)
    return collection


async def delete_collection(
    db: AsyncSession,
    collection_id: int,
    user_id: int
) -> bool:
    """컬렉션 삭제"""
    collection = await get_collection_by_id(db, collection_id, user_id)
    if not collection:
        return False
    
    # 먼저 CollectionPaper 관계 삭제
    await db.execute(
        delete(CollectionPaper).where(CollectionPaper.CollectionId == collection_id)
    )
    
    # 컬렉션 삭제
    await db.delete(collection)
    await db.commit()
    return True


async def add_paper_to_collection(
    db: AsyncSession,
    collection_id: int,
    paper_id: int,
    user_id: int
) -> bool:
    """컬렉션에 논문 추가"""
    # 중복 확인
    existing = await db.execute(
        select(CollectionPaper).where(
            and_(
                CollectionPaper.CollectionId == collection_id,
                CollectionPaper.PaperId == paper_id
            )
        )
    )
    if existing.scalar_one_or_none():
        return False
    
    collection_paper = CollectionPaper(
        CollectionId=collection_id,
        PaperId=paper_id,
        UserId=user_id
    )
    db.add(collection_paper)
    await db.commit()
    return True


async def remove_paper_from_collection(
    db: AsyncSession,
    collection_id: int,
    paper_id: str
) -> bool:
    """컬렉션에서 논문 제거"""
    result = await db.execute(
        delete(CollectionPaper).where(
            and_(
                CollectionPaper.CollectionId == collection_id,
                CollectionPaper.PaperId == paper_id
            )
        )
    )
    await db.commit()
    return result.rowcount > 0


async def get_collection_papers(
    db: AsyncSession,
    collection_id: int
) -> List[Paper]:
    """컬렉션의 모든 논문 조회"""
    result = await db.execute(
        select(Paper)
        .join(CollectionPaper, Paper.PaperId == CollectionPaper.PaperId)
        .where(CollectionPaper.CollectionId == collection_id)
        .order_by(CollectionPaper.PaperId)
    )
    return result.scalars().all()


async def get_collection_paper_ids(
    db: AsyncSession,
    collection_id: int
) -> List[str]:
    """컬렉션의 논문 ID 목록"""
    result = await db.execute(
        select(CollectionPaper.PaperId)
        .where(CollectionPaper.CollectionId == collection_id)
    )
    return [paper_id for paper_id, in result]


async def is_paper_in_collection(
    db: AsyncSession,
    collection_id: int,
    paper_id: int
) -> bool:
    """논문이 컬렉션에 있는지 확인"""
    result = await db.execute(
        select(CollectionPaper).where(
            and_(
                CollectionPaper.CollectionId == collection_id,
                CollectionPaper.PaperId == paper_id
            )
        )
    )
    return result.scalar_one_or_none() is not None