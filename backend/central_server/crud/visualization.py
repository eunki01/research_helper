# app/crud/visualization.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional
import json
from datetime import datetime

from models.visualization_model import (
    UserVisualizationState,
    VisualizationView,
    ViewNode,
    ViewEdge,
    ViewBreadcrumb,
    ViewFilters
)
from schemas.visualization import SaveVisualizationStateRequest


async def get_user_visualization_state(
    session: AsyncSession,
    user_id: int
) -> Optional[dict]:
    """사용자의 시각화 상태 조회"""
    stmt = select(UserVisualizationState).where(
        UserVisualizationState.UserId == user_id
    ).options(
        selectinload(UserVisualizationState.views)
        .selectinload(VisualizationView.nodes),
        selectinload(UserVisualizationState.views)
        .selectinload(VisualizationView.edges),
        selectinload(UserVisualizationState.views)
        .selectinload(VisualizationView.breadcrumbs),
        selectinload(UserVisualizationState.views)
        .selectinload(VisualizationView.filters)
    )
    
    result = await session.execute(stmt)
    state = result.scalar_one_or_none()
    
    if not state:
        return {
            'currentViewIndex': 0,
            'views': [],
            'maxViews': 10
        }
    
    views = []
    for view in state.views:
        view_dict = {
            'id': view.ViewId,
            'title': view.Title,
            'query': view.Query,
            'createdAt': view.CreatedAt.isoformat(),
            'graph': {
                'nodes': [
                    {
                        'id': node.NodeId,
                        'type': node.Type,
                        'data': json.loads(node.DataJson),
                        'position': {
                            'x': node.PositionX, 
                            'y': node.PositionY
                        } if node.PositionX is not None else None,
                        'locked': node.IsLocked
                    }
                    for node in view.nodes
                ],
                'edges': [
                    {
                        'id': edge.EdgeId,
                        'source': edge.SourceNodeId,
                        'target': edge.TargetNodeId,
                        'type': edge.Type,
                        'similarity': edge.Similarity
                    }
                    for edge in view.edges
                ],
                'seedNodeId': view.SeedNodeId,
                'query': view.Query,
                'searchMode': view.SearchMode
            },
            'breadcrumbPath': [
                {
                    'id': bc.BreadcrumbId,
                    'title': bc.Title,
                    'query': bc.Query,
                    'timestamp': bc.Timestamp
                }
                for bc in sorted(view.breadcrumbs, key=lambda x: x.OrderIndex)
            ]
        }
        
        if view.filters:
            view_dict['filters'] = {
                'startYear': view.filters.StartYear,
                'endYear': view.filters.EndYear,
                'publicationTypes': json.loads(view.filters.PublicationTypes) if view.filters.PublicationTypes else [],
                'isOpenAccess': view.filters.IsOpenAccess,
                'venues': view.filters.Venues,
                'fieldsOfStudy': json.loads(view.filters.FieldsOfStudy) if view.filters.FieldsOfStudy else [],
                'limit': view.filters.Limit
            }
        
        views.append(view_dict)
    
    return {
        'currentViewIndex': state.CurrentViewIndex,
        'views': views,
        'maxViews': state.MaxViews
    }


async def save_user_visualization_state(
    session: AsyncSession,
    user_id: int,
    state_data: SaveVisualizationStateRequest
) -> dict:
    """사용자의 시각화 상태 저장"""
    
    # 1. State 가져오기 또는 생성
    stmt = select(UserVisualizationState).where(
        UserVisualizationState.UserId == user_id
    ).options(
        selectinload(UserVisualizationState.views)
    )
    result = await session.execute(stmt)
    state = result.scalar_one_or_none()
    
    if not state:
        state = UserVisualizationState(
            UserId=user_id,
            CurrentViewIndex=state_data.currentViewIndex,
            MaxViews=state_data.maxViews
        )
        session.add(state)
        await session.flush()  # ID 생성
    else:
        state.CurrentViewIndex = state_data.currentViewIndex
        state.MaxViews = state_data.maxViews
        
        # 기존 뷰 삭제
        for view in state.views:
            await session.delete(view)
        await session.flush()
    
    # 2. 새 뷰들 저장
    for view_data in state_data.views:
        try:
            created_at_str = view_data.createdAt.replace('Z', '+00:00') if view_data.createdAt else ""
            created_at_val = datetime.fromisoformat(created_at_str)
            
            # [추가] DB가 Timezone을 지원하지 않는다면 UTC 시간을 유지하되 tzinfo를 제거
            if created_at_val.tzinfo is not None:
                created_at_val = created_at_val.astimezone(datetime.timezone.utc).replace(tzinfo=None)
                
        except Exception as e:
            created_at_val = datetime.now() # 여기도 기본적으로 naive한 시간이 들어갑니다.
        view = VisualizationView(
            StateId=state.Id,
            ViewId=view_data.id,
            Title=view_data.title,
            Query=view_data.query,
            CreatedAt=created_at_val,
            SeedNodeId=view_data.graph.seedNodeId,
            SearchMode=view_data.graph.searchMode
        )
        session.add(view)
        await session.flush()  # View ID 생성
        
        # Nodes 저장
        for node_data in view_data.graph.nodes:
            node = ViewNode(
                ViewId=view.Id,
                NodeId=node_data.id,
                Type=node_data.type,
                DataJson=json.dumps(node_data.data),
                PositionX=node_data.position.x if node_data.position else None,
                PositionY=node_data.position.y if node_data.position else None,
                IsLocked=node_data.locked
            )
            session.add(node)
        
        # Edges 저장
        for edge_data in view_data.graph.edges:
            edge = ViewEdge(
                ViewId=view.Id,
                EdgeId=edge_data.id,
                SourceNodeId=edge_data.source,
                TargetNodeId=edge_data.target,
                Type=edge_data.type,
                Similarity=edge_data.similarity
            )
            session.add(edge)
        
        # Breadcrumbs 저장
        for idx, bc_data in enumerate(view_data.breadcrumbPath):
            breadcrumb = ViewBreadcrumb(
                ViewId=view.Id,
                BreadcrumbId=bc_data.id,
                Title=bc_data.title,
                Query=bc_data.query,
                Timestamp=bc_data.timestamp,
                OrderIndex=idx
            )
            session.add(breadcrumb)
        
        # Filters 저장 (optional)
        if view_data.filters:
            filters = ViewFilters(
                ViewId=view.Id,
                StartYear=view_data.filters.startYear,
                EndYear=view_data.filters.endYear,
                PublicationTypes=json.dumps(view_data.filters.publicationTypes),
                IsOpenAccess=view_data.filters.isOpenAccess,
                Venues=view_data.filters.venues,
                FieldsOfStudy=json.dumps(view_data.filters.fieldsOfStudy),
                Limit=view_data.filters.limit
            )
            session.add(filters)
    
    await session.commit()
    
    return {
        'message': 'Visualization state saved successfully',
        'currentViewIndex': state_data.currentViewIndex,
        'viewCount': len(state_data.views)
    }


async def delete_user_visualization_state(
    session: AsyncSession,
    user_id: int
) -> bool:
    """사용자의 시각화 상태 삭제"""
    stmt = select(UserVisualizationState).where(
        UserVisualizationState.UserId == user_id
    )
    result = await session.execute(stmt)
    state = result.scalar_one_or_none()
    
    if state:
        await session.delete(state)
        await session.commit()
        return True
    return False