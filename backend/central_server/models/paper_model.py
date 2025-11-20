from typing import List, Optional
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from core.database import Base

# Forward references for type hints
if False:  # TYPE_CHECKING
    from .paper_author_model import PaperAuthor
    from .citation_model import Citation
    from .collection_paper_model import CollectionPaper


class Paper(Base):
    __tablename__ = 'paper'
    
    PaperId: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    Title: Mapped[str] = mapped_column(String, nullable=False)
    Abstract: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    PublicationYear: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    JournalName: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    Pages: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    PDF_URL: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    MetaData: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    CitationCount: Mapped[int] = mapped_column(Integer, nullable=True)

    authors: Mapped[List['PaperAuthor']] = relationship(back_populates="paper") 
    
    cited_by: Mapped[List['Citation']] = relationship(
        foreign_keys="[Citation.CitedPaperId]",
        back_populates="cited_paper"
    )
    cites: Mapped[List['Citation']] = relationship(
        foreign_keys="[Citation.CitingPaperId]",
        back_populates="citing_paper"
    )
    
    collections: Mapped[List['CollectionPaper']] = relationship(back_populates="paper")