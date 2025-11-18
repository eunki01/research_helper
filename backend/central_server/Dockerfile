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
USER root

# 필요한 유틸리티 설치 및 GPG 키 관리를 위한 패키지 설치
# lsb-release를 추가하여 배포판 정보가 정상적으로 인식되도록 합니다.
RUN apt-get update && apt-get install -y \
    curl \
    debhelper \
    lsb-release \
    apt-transport-https 

# Caddy 공식 설치 스크립트 실행 (가장 안정적)
# 이 스크립트는 GPG 키를 추가하고 Caddy APT 리스트를 설정합니다.
RUN curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/cfg/setup/bash.deb.sh' | bash

# 최종적으로 Caddy 클라이언트 설치
RUN apt-get update && apt-get install -y caddy

# Caddyfile 복사 및 사용자 전환은 그대로 유지
COPY Caddyfile /etc/caddy/Caddyfile 

USER root
RUN mkdir -p /app/caddy_data /app/caddy_config
# 비루트 사용자(UID 1000)가 이 디렉토리에 쓸 수 있도록 소유권 변경
RUN chown -R 1000:0 /app/caddy_data /app/caddy_config
USER 1000

################################################################

# 7. 컨테이너 노출 포트
# Caddy가 HTTPS(443) 및 HTTP(80) 트래픽을 처리하도록 노출합니다.
EXPOSE 80 443

# 8. 컨테이너 실행 명령어 정의 (CMD)
# Uvicorn (FastAPI)과 Caddy를 동시에 백그라운드(&)로 실행합니다.
# Uvicorn은 Caddy와의 내부 통신을 위해 127.0.0.1 (localhost)에 바인딩됩니다.
# Caddy는 설정 파일을 로드하고 실행됩니다.
CMD uvicorn main:app --host 0.0.0.0 --port 8000 & caddy run --config /etc/caddy/Caddyfile --adapter caddyfile

# 참고: 프로덕션 환경에서는 쉘의 & 대신 Supervisor나 forego를 사용하여 
# 두 프로세스를 안정적으로 관리하는 것이 좋습니다.