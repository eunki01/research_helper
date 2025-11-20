from typing import List, Optional
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from core.database import Base

class CollectionPaper(Base):
    __tablename__ = 'collection_paper'

    CollectionId: Mapped[int] = mapped_column(ForeignKey('collection.CollectionId'), primary_key=True)
    PaperId: Mapped[int] = mapped_column(ForeignKey('paper.PaperId'), primary_key=True)
    UserId: Mapped[int] = mapped_column(ForeignKey('user.UserId'))
    IsSeed: Mapped[bool] = mapped_column(Boolean, default=False)
    Abstract: Mapped[Optional[str]] = mapped_column(Text)
    UserNote: Mapped[Optional[str]] = mapped_column(Text)
    
    collection: Mapped["Collection"] = relationship(back_populates="collection_papers")
    paper: Mapped["Paper"] = relationship(back_populates="collections")
    user: Mapped["User"] = relationship(back_populates="collected_papers")