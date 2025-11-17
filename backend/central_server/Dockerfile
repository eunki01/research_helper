# 1. Base Image 설정 (가볍고 안전한 Python Slim 버전을 권장)
FROM python:3.11-slim

# 2. 작업 디렉토리 설정
# 모든 이후 명령어는 이 디렉토리 내에서 실행됩니다.
WORKDIR /app

# 3. 파이썬 종속성 파일 복사 및 설치
# 캐시를 사용하지 않아 이미지 크기를 줄입니다.
# requirements.txt에 uvicorn, fastapi 등이 포함되어 있어야 합니다.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. FastAPI 애플리케이션 코드 복사
# 프로젝트의 모든 파일과 폴더를 /app으로 복사합니다.
COPY . .

# 5. 애플리케이션 실행 포트 노출 (선택 사항, 컨테이너 네트워크에만 영향)
# 이 포트는 docker run -p 옵션으로 호스트에 연결됩니다.
EXPOSE 80

# 6. 컨테이너 실행 명령어 정의 (CMD)
# Uvicorn을 사용하여 애플리케이션을 구동합니다.
# main:app은 보통 main.py 파일의 app 객체를 의미합니다.
# --host 0.0.0.0은 컨테이너 외부에서 접근 가능하도록 합니다.
# --port 80은 EXPOSE 80과 일치합니다.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]

# ⚠️ ENV 명령어는 사용하지 않습니다.
# JWT_SECRET_KEY, DATABASE_URL 등은 
# Jenkins 파이프라인에서 'docker run -e'로 실행 시점에 주입됩니다.