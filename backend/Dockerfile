FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
FROM base AS build
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci
COPY backend backend
RUN npm run build -w backend
FROM base AS dependencies
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY backend/prisma backend/prisma
RUN npm ci --omit=dev --workspace backend --include-workspace-root=false && npm run prisma:generate -w backend
FROM base AS runner
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3001
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/backend/dist ./backend/dist
COPY --from=build --chown=node:node /app/backend/prisma ./backend/prisma
USER node
EXPOSE 3001
CMD ["node", "backend/dist/main.js"]
