from typing import List, Optional
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from core.database import Base

class Collection(Base):
    __tablename__ = 'collection'

    CollectionId: Mapped[int] = mapped_column(primary_key=True)
    UserId: Mapped[int] = mapped_column(ForeignKey('user.UserId'))
    CollectionName: Mapped[str] = mapped_column(String(255))
    Description: Mapped[Optional[str]] = mapped_column(Text)
    CreatedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    UpdatedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="collections")
    collection_papers: Mapped[List["CollectionPaper"]] = relationship(back_populates="collection")