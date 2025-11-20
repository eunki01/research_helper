# schemas/collection.py
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class CollectionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)


class CollectionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None


class CollectionResponse(BaseModel):
    id: int = Field(..., alias="CollectionId") 
    
    name: str = Field(..., alias="CollectionName")
    
    description: Optional[str] = Field(None, alias="Description")
    
    user_id: int = Field(..., alias="UserId")
    
    paper_count: int = 0
    
    created_at: datetime = Field(..., alias="CreatedAt")
    
    updated_at: Optional[datetime] = Field(None, alias="UpdatedAt")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True 
    )


class AddPaperToCollection(BaseModel):
    paper_id: int


class RemovePaperFromCollection(BaseModel):
    paper_id: int