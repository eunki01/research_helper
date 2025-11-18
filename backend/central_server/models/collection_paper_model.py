from typing import List, Optional
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from core.database import Base

class CollectionPaper(Base):
    __tablename__ = 'collection_paper'

    # 복합 기본 키
    CollectionId: Mapped[int] = mapped_column(ForeignKey('collection.CollectionId'), primary_key=True)
    PaperId: Mapped[int] = mapped_column(ForeignKey('paper.PaperId'), primary_key=True)
    UserId: Mapped[int] = mapped_column(ForeignKey('user.UserId')) # Key22 (사용자 ID)
    IsSeed: Mapped[bool] = mapped_column(Boolean, default=False)
    Abstract: Mapped[Optional[str]] = mapped_column(Text)
    UserNote: Mapped[Optional[str]] = mapped_column(Text)
    
    # Relationship: N:1 관계
    collection: Mapped["Collection"] = relationship(back_populates="collection_papers")
    paper: Mapped["Paper"] = relationship(back_populates="collection_papers")
    user: Mapped["User"] = relationship(back_populates="collection_papers")