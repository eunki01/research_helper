# schemas/collection.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CollectionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)


class CollectionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None


class CollectionResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    user_id: int
    paper_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class AddPaperToCollection(BaseModel):
    paper_id: str


class RemovePaperFromCollection(BaseModel):
    paper_id: str