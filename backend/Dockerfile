# Caminho: /backend/Dockerfile
# Imagem de produção da API (usada por deploy/docker-compose.prod.yml).
#   build   -> dependências completas + Prisma CLI + código compilado. Também
#              serve de "caixa de ferramentas" (migrações e importador SINAPI).
#   runtime -> só dependências de produção + dist/, rodando como usuário sem root.

# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS build
WORKDIR /app

# O Prisma precisa do OpenSSL para carregar a engine.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && apt-get clean

# Mesmo padrão do CI: sem lifecycle scripts de terceiros; só os dois nativos
# necessários (binário do bcrypt e engines do Prisma) são preparados.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts \
  && npm rebuild bcrypt @prisma/engines

COPY prisma.config.ts tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

RUN npm run prisma:generate \
  && npm run build

# As ferramentas (migrate/sinapi) também rodam sem root.
RUN chown -R node:node /app
USER node

# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && apt-get clean

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts \
  && npm rebuild bcrypt \
  && npm cache clean --force

# Prisma Client gerado (inclui a engine) e o código compilado.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist

USER node
EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3333)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "dist/server.js"]
