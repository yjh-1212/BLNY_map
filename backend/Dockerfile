FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
RUN mkdir -p /app/data && chown node:node /app/data

ENV HOST=0.0.0.0
ENV PORT=8080
ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/beiliang-nanyun.db
ENV ENABLE_DATABASE_ADMIN=false

EXPOSE 8080
USER node

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
