FROM node:20-alpine

WORKDIR /app

# РЎРЅР°С‡Р°Р»Р° С‚РѕР»СЊРєРѕ Р·Р°РІРёСЃРёРјРѕСЃС‚Рё вЂ” РґР»СЏ РєСЌС€Р° СЃР»РѕСЏ
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Р—Р°С‚РµРј СЃРѕСЂС†С‹ Рё entrypoint
COPY src ./src
COPY entrypoint.sh ./entrypoint.sh
RUN sed -i 's/\r//' entrypoint.sh && chmod +x entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Healthcheck РїРѕ /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

# Entrypoint: Р¶РґС‘С‚ postgres, Р°РІС‚Рѕ-bootstrap, РїРѕС‚РѕРј Р·Р°РїСѓСЃРєР°РµС‚ СЃРµСЂРІРµСЂ
ENTRYPOINT ["sh", "entrypoint.sh"]

