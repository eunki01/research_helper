from pydantic import BaseModel
from datetime import datetime

class UserDto(BaseModel):
  email: str
  SignUpDate: datetime