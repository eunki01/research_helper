from typing import List, Optional
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from core.database import Base

class Author(Base):
    __tablename__ = 'author'

    AuthorId: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    Name: Mapped[str] = mapped_column(String(255))
    Affiliation: Mapped[Optional[str]] = mapped_column(String(255))

    paper_authors: Mapped[List["PaperAuthor"]] = relationship(back_populates="author")