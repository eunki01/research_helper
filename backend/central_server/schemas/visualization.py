# app/schemas/visualization.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Position(BaseModel):
    x: float
    y: float

class SearchFilters(BaseModel):
    startYear: Optional[str] = None
    endYear: Optional[str] = None
    publicationTypes: List[str] = Field(default_factory=list)
    isOpenAccess: bool = False
    venues: Optional[str] = None
    fieldsOfStudy: List[str] = Field(default_factory=list)
    limit: int = 50

class PaperNode(BaseModel):
    id: str
    type: str  # 'paper' | 'author'
    data: dict  # Paper or LibraryPaper data
    position: Optional[Position] = None
    locked: bool = False

class PaperEdge(BaseModel):
    id: str
    source: str
    target: str
    type: str  # 'citation' | 'similarity'
    similarity: float

class PaperGraph(BaseModel):
    nodes: List[PaperNode]
    edges: List[PaperEdge]
    seedNodeId: Optional[str] = None
    query: Optional[str] = None
    searchMode: Optional[str] = None  # 'internal' | 'external'

class BreadcrumbItem(BaseModel):
    id: str
    title: str
    query: Optional[str] = None
    timestamp: str

class VisualizationView(BaseModel):
    id: str
    title: str
    graph: PaperGraph
    query: str
    createdAt: str
    breadcrumbPath: List[BreadcrumbItem]
    filters: Optional[SearchFilters] = None

class VisualizationState(BaseModel):
    currentViewIndex: int
    views: List[VisualizationView]
    maxViews: int

# Request/Response schemas
class VisualizationStateResponse(BaseModel):
    currentViewIndex: int
    views: List[VisualizationView]
    maxViews: int
    
    class Config:
        from_attributes = True

class SaveVisualizationStateRequest(BaseModel):
    currentViewIndex: int
    views: List[VisualizationView]
    maxViews: int = 10

class SaveVisualizationStateResponse(BaseModel):
    message: str
    currentViewIndex: int
    viewCount: int