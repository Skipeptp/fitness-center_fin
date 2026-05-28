FROM node:20-alpine

WORKDIR /app

# Сначала только зависимости — для кэша слоя
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Затем сорцы и entrypoint
COPY src ./src
COPY entrypoint.sh ./entrypoint.sh
RUN sed -i 's/\r//' entrypoint.sh && chmod +x entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Healthcheck по /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

# Entrypoint: ждёт postgres, авто-bootstrap, потом запускает сервер
ENTRYPOINT ["sh", "entrypoint.sh"]

