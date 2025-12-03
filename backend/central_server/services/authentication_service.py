import jwt
from jwt.exceptions import (
    ExpiredSignatureError,
    InvalidSignatureError,
    DecodeError,
    InvalidAlgorithmError,
    InvalidKeyError,
    PyJWTError # 모든 JWT 오류의 기본 클래스
)
from fastapi import Depends, HTTPException
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from core.config import settings
from core.redis_config import get_redis_client
from redis.asyncio import Redis
from starlette import status
from models.user_model import User
import random
import string
import uuid

JTI_PREFIX = "refresh_token:jti:"

def create_token(data: dict, expires_delta: Optional[timedelta] = None, token_type: str = "access") -> str:
  to_encode = data.copy()
  
  if expires_delta:
    expire = datetime.now() + expires_delta
  else:
    if token_type == "access":
      expire = datetime.now() + timedelta(minutes=int(settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    else:
      expire = datetime.now() + timedelta(minutes=int(settings.REFRESH_TOKEN_EXPIRE_MINUTES))
  to_encode.update({"exp": expire})
  to_encode.update({"type": token_type})
  
  encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
  return encoded_jwt

async def create_access_token_and_refresh_token(user: User) -> Dict[str, Any]:
  jti = str(uuid.uuid4())
  
  user_id_str = str(user.UserId)
  
  access_token = create_token(data={"sub":user_id_str}, token_type="access")
  print(access_token)
  
  refresh_token = create_token(data={"sub":user_id_str, "jti": jti}, token_type="refresh")
  print(jti, user_id_str)
  await save_refresh_token_jti(jti=jti, user_id=user_id_str)
  
  return {
    "access_token": access_token,
    "refresh_token": refresh_token,
    "token_type": "Bearer",
    "user": {
      "id": user_id_str,
      "email": user.Email,
      "name": user.Name,
    }
  }

def verify_token(token: str):
  print(f"{token} {settings.SECRET_KEY} {settings.ALGORITHM}")
  try:
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    print(payload)
    return payload
  except ExpiredSignatureError:
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token has expired. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

  except InvalidSignatureError:
      raise HTTPException(
          status_code=status.HTTP_401_UNAUTHORIZED,
          detail="Invalid token signature. Token may be corrupted or key is incorrect.",
          headers={"WWW-Authenticate": "Bearer"},
      )

  except (InvalidAlgorithmError, InvalidKeyError, DecodeError):
      raise HTTPException(
          status_code=status.HTTP_401_UNAUTHORIZED,
          detail="Token decoding failed. Invalid format or algorithm.",
          headers={"WWW-Authenticate": "Bearer"},
      )

  except PyJWTError as e:
      print(f"DEBUG: Uncaught PyJWTError details: {e}")
      raise HTTPException(
          status_code=status.HTTP_401_UNAUTHORIZED,
          detail="Could not validate credentials.",
          headers={"WWW-Authenticate": "Bearer"},
      )

  except Exception as e:
      print(f"Unexpected error during token processing: {e}")
      raise HTTPException(
          status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
          detail="Internal server error during authentication.",
      )

async def save_refresh_token_jti(jti: str, user_id: str):
    key = f"{{ {JTI_PREFIX}{jti} }}"
    ttl_seconds = timedelta(minutes=int(settings.REFRESH_TOKEN_EXPIRE_MINUTES)).total_seconds()
    client = await get_redis_client()
    await client.setex(key, int(ttl_seconds), user_id)
    return True
  
async def is_jti_exists(jti: str, client: Redis):
  key = f"{JTI_PREFIX}{jti}"
  return await client.exists(key)

async def revoke_refresh_token(jti: str, client: Redis):
  key = f"{JTI_PREFIX}{jti}"
  return await client.delete(key)

async def generate_verification_token(email: str) -> str:
  token = create_token({"email":email}, token_type="access")
  
  db = await get_redis_client()
  await db.setex(f"verification:{email}", 300, token)
  return token

async def verify_verification_token(token: str) -> str:
  redis_client = await get_redis_client()
  payload = verify_token(token)
  print(payload)
  email = payload.get("email")
  stored_code = await redis_client.get(f"verification:{email}")
  if stored_code:
    await redis_client.delete(f"verification:{email}")
    await redis_client.set(f"verified:{email}", "true", ex=3600)
    return email
  return None