from pydantic import BaseModel
from datetime import datetime

class UserDto(BaseModel):
  Email: str
  SignUpDate: datetime