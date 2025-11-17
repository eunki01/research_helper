# 학제 연구 보조 및 멀티모달 리소스 관계형 시각화 시스템
[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.12-green)](https://fastapi.tiangolo.com)


## 주요 기능
- **다중 데이터 형식 지원**: PDF, TXT, DOCX, JPG, MP3, MP4 등
- **크로스모달 검색**: 텍스트-논문 파일 간 유사도 검색
- **실시간 시각화**: 벡터 공간에서의 자료 관계 그래프 표현
- **확장 가능 아키텍처**: 모듈화 설계로 기능 추가 용이

## 기술 스택
- **백엔드**: FastAPI, Weaviate, Langchain

## 시작하기

### 필수 조건
- Docker 24.0+
- Python 3.10+
  
### 의존성 설치
```
pip install -r requirements.txt
```

## 실행 방법

### 1. Weaviate 서버 실행
```
docker run -p 8080:8080 -p 50051:50051 semitechnologies/weaviate:latest
```

### 2. FastAPI 서버 실행
```
python -m uvicorn main:app --reload --port 8000
```

## API
- [**Swagger UI**](http://localhost:8000/docs)
