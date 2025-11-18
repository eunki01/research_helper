# 1. Base Image 설정 (가볍고 안전한 Python Slim 버전을 권장)
FROM python:3.11-slim

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 파이썬 종속성 파일 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. FastAPI 애플리케이션 코드 복사
COPY . .

################################################################
# CADDY 설치 및 설정 (HTTPS 역방향 프록시)
################################################################

# 5. Caddy 설치에 필요한 유틸리티 및 Caddy 설치
# Caddy를 설치하기 전에 root 권한으로 전환합니다.
USER root
RUN apt-get update && apt-get install -y wget ca-certificates

# Caddy 최신 버전을 다운로드하여 /usr/bin/caddy에 저장합니다.
RUN wget -q -O /usr/bin/caddy "https://caddyserver.com/api/download?os=linux&arch=amd64&id=0f52b997c72f1225&p=deb"
RUN chmod +x /usr/bin/caddy

# Caddyfile을 컨테이너 내부의 표준 경로에 복사합니다.
# (이 Caddyfile 파일은 Dockerfile과 같은 디렉토리에 있어야 합니다.)
COPY Caddyfile /etc/caddy/Caddyfile 

# 6. 비루트 사용자 전환
# 보안을 위해 'python' 이미지가 제공하는 기본 사용자(root가 아님)로 다시 전환하거나,
# 새 사용자(appuser)를 생성하는 것이 좋습니다. 여기서는 기본 'python' 유저로 가정합니다.
# RUN useradd -m appuser  <-- 새 사용자 생성 예시
# USER appuser
USER 1000 # python:3.11-slim의 기본 사용자 UID로 전환합니다 (보안 권장)

################################################################

# 7. 컨테이너 노출 포트
# Caddy가 HTTPS(443) 및 HTTP(80) 트래픽을 처리하도록 노출합니다.
EXPOSE 80 443

# 8. 컨테이너 실행 명령어 정의 (CMD)
# Uvicorn (FastAPI)과 Caddy를 동시에 백그라운드(&)로 실행합니다.
# Uvicorn은 Caddy와의 내부 통신을 위해 127.0.0.1 (localhost)에 바인딩됩니다.
# Caddy는 설정 파일을 로드하고 실행됩니다.
CMD uvicorn main:app --host 127.0.0.1 --port 80 & caddy run --config /etc/caddy/Caddyfile --adapter caddyfile

# 참고: 프로덕션 환경에서는 쉘의 & 대신 Supervisor나 forego를 사용하여 
# 두 프로세스를 안정적으로 관리하는 것이 좋습니다.