from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from central_server.core.database import Base

class User(Base):
  __tablename__ = "users"
  
  id = Column(Integer, primary_key=True, index=True)
  email = Column(String, unique=True, index=True, nullable=False)
  hashed_password = Column(String, nullable=False)
  is_active = Column(Boolean, default=False)
  SignUpDate = Column(DateTime, server_default=func.now())
  
  def __repr__(self):
    return f"<User(id={self.id}, email='{self.email})>"