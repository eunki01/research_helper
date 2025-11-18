from typing import List, Optional
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from core.database import Base

class Paper(Base):
    
    __tablename__ = 'paper'
    
    # Mapped Columns
    PaperId: Mapped[int] = mapped_column(Integer, primary_key=True)
    Title: Mapped[str] = mapped_column(String)
    Abstract: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    PublicationYear: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    JournalName: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    DOI_URL: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    Pdf_URL: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    MetaData: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    # Many-to-Many through paper_author
    authors: Mapped[List['PaperAuthor']] = relationship(back_populates="paper")
    
    # Self-Referential Relationship (Citation)
    cited_by: Mapped[List['Citation']] = relationship(
        foreign_keys="[Citation.CitedPaperId]",
        back_populates="cited_paper"
    )
    cites: Mapped[List['Citation']] = relationship(
        foreign_keys="[Citation.CitingPaperId]",
        back_populates="citing_paper"
    )
    
    # One-to-Many: collection_paper
    collections: Mapped[List['CollectionPaper']] = relationship(back_populates="paper")