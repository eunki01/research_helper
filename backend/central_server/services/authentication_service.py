from jose import JWTError, jwt
from fastapi import Depends
from datetime import datetime, timedelta
from typing import Optional, Dict
from core.config import settings
from core.redis_config import get_redis_client
from redis.asyncio import Redis
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

def create_access_token_and_refresh_token(user_id: str) -> Dict[str, str]:
  jti = str(uuid.uuid4())
  
  access_token = create_token(data={"sub":user_id}, token_type="access")
  
  refresh_token = create_token(data={"sub":user_id, "jti": jti}, token_type="refresh")
  
  save_refresh_token_jti(jti=jti, user_id=user_id)
  
  return {
    "access_token": access_token,
    "refresh_token": refresh_token,
    "token_type": "Bearer",
    
  }

def verify_token(token: str):
  try:
    payload =  jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    return payload
  except JWTError:
    return None

async def save_refresh_token_jti(jti: str, user_id: str, client: Redis=Depends(get_redis_client)):
    key = f"{{ {JTI_PREFIX}{jti} }}"
    ttl_seconds = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES).total_seconds()
    await client.setex(key, ttl_seconds, user_id)
    return True
  
async def is_jti_exists(jti: str, client: Redis=Depends(get_redis_client)):
  key = f"{JTI_PREFIX}{jti}"
  return client.exists(key)

async def revoke_refresh_token(jti: str, client: Redis=Depends(get_redis_client)):
  key = f"{JTI_PREFIX}{jti}"
  return client.delete(key)

async def generate_verification_code(email: str) -> str:
  code = ''.join(random.choices(string.digits, k=6))
  
  await get_redis_client().setex(f"verification:{email}", 300, code)
  return code

async def verify_code(email: str, code: str) -> bool:
  redis_client = await get_redis_client()
  stored_code = await redis_client.get(f"verification:{email}")
  if stored_code and stored_code.decode() == code:
    await redis_client.delete(f"verification:{email}")
    await redis_client.set(f"verified:{email}", "true", ex=3600)
    return True
  return False
  