FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

USER root

RUN apt-get update && apt-get install -y \
    curl \
    debhelper \
    lsb-release \
    apt-transport-https 

RUN curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/cfg/setup/bash.deb.sh' | bash

RUN apt-get update && apt-get install -y caddy

USER root
RUN mkdir -p /var/lib/caddy /var/log/caddy /etc/caddy 
RUN chown -R 1000:0 /var/lib/caddy /var/log/caddy
USER 1000

COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80 443

CMD uvicorn main:app --host 0.0.0.0 --port 8000 & caddy run --config /etc/caddy/Caddyfile --adapter caddyfile