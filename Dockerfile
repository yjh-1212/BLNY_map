FROM node:22-alpine

WORKDIR /app

COPY package.json server.mjs ./
COPY public ./public

ENV HOST=0.0.0.0
ENV PORT=8080

EXPOSE 8080

USER node

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/api/health || exit 1

CMD ["node", "server.mjs"]
