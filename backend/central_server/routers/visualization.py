# app/routers/visualization.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from schemas.visualization import (
    VisualizationStateResponse,
    SaveVisualizationStateRequest,
    SaveVisualizationStateResponse
)
from crud import visualization as crud
from utils.get_current_user import get_current_user
from models.user_model import User

router = APIRouter(
    prefix="/visualization",
    tags=["visualization"]
)


@router.get(
    "/state",
    response_model=VisualizationStateResponse,
    summary="Get user's visualization state"
)
async def get_visualization_state(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    현재 사용자의 시각화 상태를 가져옵니다.
    
    - **currentViewIndex**: 현재 보고 있는 뷰의 인덱스
    - **views**: 저장된 시각화 뷰 리스트
    - **maxViews**: 최대 저장 가능한 뷰 개수
    """
    try:
        state = await crud.get_user_visualization_state(db, current_user.UserId)
        return state
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve visualization state: {str(e)}"
        )


@router.post(
    "/state",
    response_model=SaveVisualizationStateResponse,
    summary="Save user's visualization state"
)
async def save_visualization_state(
    state_data: SaveVisualizationStateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    현재 사용자의 시각화 상태를 저장합니다.
    
    - 기존 상태를 덮어씁니다
    - 최대 maxViews 개수만큼 뷰를 저장할 수 있습니다
    """
    try:
        # maxViews 검증
        if len(state_data.views) > state_data.maxViews:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Number of views ({len(state_data.views)}) exceeds maxViews ({state_data.maxViews})"
            )
        
        result = await crud.save_user_visualization_state(
            db, 
            current_user.UserId, 
            state_data
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save visualization state: {str(e)}"
        )


@router.delete(
    "/state",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete user's visualization state"
)
async def delete_visualization_state(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    현재 사용자의 시각화 상태를 삭제합니다.
    """
    try:
        deleted = await crud.delete_user_visualization_state(db, current_user.UserId)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No visualization state found"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete visualization state: {str(e)}"
        )