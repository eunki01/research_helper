from typing import List, Optional
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean, Date
from sqlalchemy.orm import relationship, Mapped, mapped_column
from core.database import Base

class UserVisualizationState(Base):
    """사용자의 시각화 상태 (1:1)"""
    __tablename__ = 'user_visualization_state'
    
    Id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    UserId: Mapped[int] = mapped_column(Integer, ForeignKey('user.UserId'), unique=True)
    CurrentViewIndex: Mapped[int] = mapped_column(Integer, default=0)
    MaxViews: Mapped[int] = mapped_column(Integer, default=10)
    UpdatedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="visualization_state")
    views: Mapped[List["VisualizationView"]] = relationship(
        back_populates="state", cascade="all, delete-orphan", order_by="VisualizationView.CreatedAt"
    )


class VisualizationView(Base):
    """개별 시각화 뷰"""
    __tablename__ = 'visualization_view'
    
    Id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    StateId: Mapped[int] = mapped_column(Integer, ForeignKey('user_visualization_state.Id'))
    ViewId: Mapped[str] = mapped_column(String(255), unique=True)  # UUID
    Title: Mapped[str] = mapped_column(String(500))
    Query: Mapped[str] = mapped_column(Text)
    CreatedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    SeedNodeId: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    SearchMode: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # 'internal' | 'external'
    
    # Relationships
    state: Mapped["UserVisualizationState"] = relationship(back_populates="views")
    nodes: Mapped[List["ViewNode"]] = relationship(
        back_populates="view", cascade="all, delete-orphan"
    )
    edges: Mapped[List["ViewEdge"]] = relationship(
        back_populates="view", cascade="all, delete-orphan"
    )
    breadcrumbs: Mapped[List["ViewBreadcrumb"]] = relationship(
        back_populates="view", cascade="all, delete-orphan", order_by="ViewBreadcrumb.OrderIndex"
    )
    filters: Mapped[Optional["ViewFilters"]] = relationship(
        back_populates="view", uselist=False, cascade="all, delete-orphan"
    )


class ViewNode(Base):
    """그래프 노드"""
    __tablename__ = 'view_node'
    
    Id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ViewId: Mapped[int] = mapped_column(Integer, ForeignKey('visualization_view.Id'))
    NodeId: Mapped[str] = mapped_column(String(255))
    Type: Mapped[str] = mapped_column(String(50))  # 'paper' | 'author'
    DataJson: Mapped[str] = mapped_column(Text)  # Paper or LibraryPaper JSON
    PositionX: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    PositionY: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    IsLocked: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationships
    view: Mapped["VisualizationView"] = relationship(back_populates="nodes")


class ViewEdge(Base):
    """그래프 엣지"""
    __tablename__ = 'view_edge'
    
    Id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ViewId: Mapped[int] = mapped_column(Integer, ForeignKey('visualization_view.Id'))
    EdgeId: Mapped[str] = mapped_column(String(255))
    SourceNodeId: Mapped[str] = mapped_column(String(255))
    TargetNodeId: Mapped[str] = mapped_column(String(255))
    Type: Mapped[str] = mapped_column(String(50))  # 'citation' | 'similarity'
    Similarity: Mapped[float] = mapped_column(Float)
    
    # Relationships
    view: Mapped["VisualizationView"] = relationship(back_populates="edges")


class ViewBreadcrumb(Base):
    """탐색 경로 breadcrumb"""
    __tablename__ = 'view_breadcrumb'
    
    Id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ViewId: Mapped[int] = mapped_column(Integer, ForeignKey('visualization_view.Id'))
    BreadcrumbId: Mapped[str] = mapped_column(String(255))
    Title: Mapped[str] = mapped_column(String(500))
    Query: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    Timestamp: Mapped[str] = mapped_column(String(100))
    OrderIndex: Mapped[int] = mapped_column(Integer)  # 순서 보장
    
    # Relationships
    view: Mapped["VisualizationView"] = relationship(back_populates="breadcrumbs")


class ViewFilters(Base):
    """검색 필터"""
    __tablename__ = 'view_filters'
    
    Id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ViewId: Mapped[int] = mapped_column(Integer, ForeignKey('visualization_view.Id'), unique=True)
    StartYear: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    EndYear: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    PublicationTypes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array
    IsOpenAccess: Mapped[bool] = mapped_column(Boolean, default=False)
    Venues: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    FieldsOfStudy: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array
    Limit: Mapped[int] = mapped_column(Integer, default=50)
    
    # Relationships
    view: Mapped["VisualizationView"] = relationship(back_populates="filters")