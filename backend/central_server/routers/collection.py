# routers/collection.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from core.database import get_db
from utils.get_current_user import get_current_user
from models import User
from schemas.collection import (
    CollectionCreate,
    CollectionUpdate,
    CollectionResponse,
    AddPaperToCollection
)
from schemas.paper import PaperResponse
from schemas.recommendation import RecommendationResponse
from services.collection_service import CollectionService
from crud import collection as collection_crud

router = APIRouter(prefix="/collections", tags=["collections"])


@router.post("", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
async def create_collection(
    collection: CollectionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """새 컬렉션 생성"""
    new_collection = await CollectionService.create_user_collection(
        db,
        current_user.id,
        collection.name,
        collection.description
    )
    
    return {
        **new_collection.__dict__,
        "paper_count": 0
    }


@router.get("", response_model=List[CollectionResponse])
async def get_user_collections(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """사용자의 모든 컬렉션 조회"""
    collections_with_count = await collection_crud.get_user_collections(
        db, current_user.id
    )
    
    return [
        {
            **collection.__dict__,
            "paper_count": paper_count
        }
        for collection, paper_count in collections_with_count
    ]


@router.get("/{collection_id}", response_model=CollectionResponse)
async def get_collection(
    collection_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """특정 컬렉션 조회"""
    collection_data = await CollectionService.get_collection_with_papers(
        db, collection_id, current_user.id
    )
    
    if not collection_data:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    collection = collection_data["collection"]
    paper_count = collection_data["paper_count"]
    
    return {
        **collection.__dict__,
        "paper_count": paper_count
    }


@router.patch("/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: int,
    collection_update: CollectionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """컬렉션 수정"""
    updated_collection = await collection_crud.update_collection(
        db,
        collection_id,
        current_user.id,
        collection_update.name,
        collection_update.description
    )
    
    if not updated_collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # paper_count 조회
    papers = await collection_crud.get_collection_papers(db, collection_id)
    
    return {
        **updated_collection.__dict__,
        "paper_count": len(papers)
    }


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(
    collection_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """컬렉션 삭제"""
    success = await collection_crud.delete_collection(
        db, collection_id, current_user.id
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    return None


@router.post("/{collection_id}/papers", status_code=status.HTTP_201_CREATED)
async def add_paper_to_collection(
    collection_id: int,
    paper_data: AddPaperToCollection,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """컬렉션에 논문 추가"""
    return await CollectionService.add_paper_to_collection_with_validation(
        db, collection_id, paper_data.paper_id, current_user.id
    )


@router.delete("/{collection_id}/papers/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_paper_from_collection(
    collection_id: int,
    paper_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """컬렉션에서 논문 제거"""
    await CollectionService.remove_paper_with_validation(
        db, collection_id, paper_id, current_user.id
    )
    return None


@router.get("/{collection_id}/papers", response_model=List[PaperResponse])
async def get_collection_papers(
    collection_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """컬렉션의 모든 논문 조회"""
    collection_data = await CollectionService.get_collection_with_papers(
        db, collection_id, current_user.id
    )
    
    if not collection_data:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    return collection_data["papers"]


@router.get("/{collection_id}/recommendations", response_model=List[RecommendationResponse])
async def get_collection_recommendations(
    collection_id: int,
    limit: int = Query(20, le=100, description="Maximum results"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """컬렉션 기반 논문 추천"""
    recommendations = await CollectionService.get_collection_recommendations(
        db, collection_id, current_user.id, limit
    )
    return recommendations


@router.get("/{collection_id}/stats")
async def get_collection_stats(
    collection_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """컬렉션 통계"""
    stats = await CollectionService.get_collection_stats(
        db, collection_id, current_user.id
    )
    
    if stats is None:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    return stats