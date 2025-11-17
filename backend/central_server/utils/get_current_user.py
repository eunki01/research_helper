from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from central_server.services.authentication_service import verify_token
from central_server.crud.user import get_user_by_id
from central_server.core.database import AsyncSessionLocal, get_db


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
  payload = verify_token(token)
  if payload is None:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Token", headers={"WWW-Authenticate": "Bearer"})
  user_id = payload.get("sub")
  if not user_id:
    raise HTTPException(status_code=401, detail="token payload is not valid")
  
  user = get_user_by_id(user_id)
  if not user:
    raise HTTPException(status_code=401, detail="user not found")
  
  return user