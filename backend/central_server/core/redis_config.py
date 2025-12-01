from redis.asyncio import Redis
from typing import Optional
from core.config import settings

redis_client: Optional[Redis] = None

async def get_redis_client() -> Redis:
  global redis_client
  if redis_client is None:
    redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)
    
    try:
        await redis_client.ping()
        print("INFO: Redis connection established successfully.")
    except Exception as e:
        print(f"ERROR: Could not connect to Redis: {e}")
        raise RuntimeError(f"Redis connection failed: {e}")
          
  return redis_client

async def close_redis_client():
  if redis_client:
    await redis_client.close()