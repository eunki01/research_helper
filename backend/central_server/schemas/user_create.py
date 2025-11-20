from pydantic import BaseModel

class UserCreate(BaseModel):
  Email: str
  Name: str
  Password: str