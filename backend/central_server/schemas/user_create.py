from pydantic import BaseModel

class RegisterRequest(BaseModel):
  Email: str
  Name: str
  Password: str