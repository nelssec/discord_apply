FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY bot/package*.json ./bot/
COPY web/package*.json ./web/

WORKDIR /app/bot
RUN npm install --build-from-source

WORKDIR /app/web
RUN npm install --build-from-source

WORKDIR /app

COPY bot ./bot
COPY web ./web

WORKDIR /app/bot
RUN npm run build

WORKDIR /app/web
RUN npm run build

WORKDIR /app

COPY start.sh ./
RUN chmod +x start.sh

ENV DATABASE_PATH=/data/guild_apps.db

CMD ["./start.sh"]
