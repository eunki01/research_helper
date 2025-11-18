from typing import List, Optional
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean, Date
from sqlalchemy.orm import relationship, Mapped, mapped_column
from core.database import Base
  
class User(Base):
    
    __tablename__ = 'user'
    
    # Mapped Columns
    UserId: Mapped[int] = mapped_column(Integer, primary_key=True)
    Email: Mapped[str] = mapped_column(String(255), unique=True)
    PasswordHash: Mapped[str] = mapped_column(String(255))
    Name: Mapped[str] = mapped_column(String(255))
    SignUpDate: Mapped[Optional[datetime.date]] = mapped_column(Date, nullable=True)
    
    # Relationships
    collections: Mapped[List['Collection']] = relationship(back_populates="user")
    collected_papers: Mapped[List['CollectionPaper']] = relationship(back_populates="user")