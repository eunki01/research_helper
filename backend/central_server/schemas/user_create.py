from pydantic import BaseModel

class UserCreate(BaseModel):
  Email: str
  Password: str