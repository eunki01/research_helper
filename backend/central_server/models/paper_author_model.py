from typing import List, Optional
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from core.database import Base

class PaperAuthor(Base):
    
    __tablename__ = 'paper_author'
    
    # Composite Primary Key
    AuthorId: Mapped[int] = mapped_column(ForeignKey('author.AuthorId'), primary_key=True)
    PaperId: Mapped[int] = mapped_column(ForeignKey('paper.PaperId'), primary_key=True)
    
    # Relationships
    author: Mapped['Author'] = relationship(back_populates="paper_authors")
    paper: Mapped['Paper'] = relationship(back_populates="authors")