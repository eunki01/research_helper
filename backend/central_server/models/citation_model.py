from typing import List, Optional
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from core.database import Base

class Citation(Base):
    __tablename__ = 'citation'

    # 복합 기본 키: 두 논문 ID로 구성
    CitingPaperId: Mapped[int] = mapped_column(ForeignKey('paper.PaperId'), primary_key=True)
    CitedPaperId: Mapped[int] = mapped_column(ForeignKey('paper.PaperId'), primary_key=True)

    RelationshipType: Mapped[Optional[str]] = mapped_column(String(50))
    SimilarityScore: Mapped[Optional[float]] = mapped_column(Float)

    # Relationship: N:1 관계 (두 개의 다른 관계로 Paper 테이블과 연결)
    citing_paper: Mapped["Paper"] = relationship(
        foreign_keys=[CitingPaperId], back_populates="citing_citations"
    )
    cited_paper: Mapped["Paper"] = relationship(
        foreign_keys=[CitedPaperId], back_populates="cited_citations"
    )