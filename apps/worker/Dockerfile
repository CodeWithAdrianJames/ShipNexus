# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ── Stage 3: Production image ─────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs \
 && adduser  -S worker -u 1001 -G nodejs

COPY --from=deps    --chown=worker:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=worker:nodejs /app/dist         ./dist
COPY --chown=worker:nodejs package*.json ./

USER worker

# Worker has no HTTP server — createApplicationContext starts the poll loop
CMD ["node", "dist/main"]
