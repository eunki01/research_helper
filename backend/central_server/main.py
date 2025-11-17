# main.py
from fastapi import FastAPI, HTTPException
from central_server.routers import users, search

app = FastAPI(
    title="Central Processing Server",
    description="중앙에서 검색 및 LLM 처리를 담당하는 서버",
    version="1.0.0"
)

app.include_router(users.router)
app.include_router(search.router)

@app.get("/")
async def root():
    return {"message": "중앙 처리 서버가 실행 중입니다."}

