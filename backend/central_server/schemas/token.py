from pydantic import BaseModel

class UserInToken(BaseModel):
    id: str
    email: str
    name: str
    
class Token(BaseModel):
  access_token: str
  refresh_token: str
  token_type: str
  user: UserInToken