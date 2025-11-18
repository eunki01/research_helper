# schemas/recommendation.py
from pydantic import BaseModel
from typing import List
from schemas.paper import PaperResponse


class RecommendationResponse(BaseModel):
    paper: PaperResponse
    score: float
    reason: str


class RecommendationParams(BaseModel):
    limit: int = 20
    algorithm: str = "co_citation"  # co_citation, bibliographic_coupling, etc.