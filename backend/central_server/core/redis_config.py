from redis.asyncio import Redis
from typing import Optional
from central_server.core.config import settings

redis_client: Optional[Redis] = None

async def get_redis_client() -> Redis:
  global redis_client
  if redis_client is None:
    redis_client = Redis.from_url(settings.REDIS_URL)
  return redis_client

async def close_redis_client():
  if redis_client:
    redis_client.close()