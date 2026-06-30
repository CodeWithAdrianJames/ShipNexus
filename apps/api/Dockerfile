# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy manifests only — maximises layer cache hits
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

# Non-root user — defence in depth
RUN addgroup -g 1001 -S nodejs \
 && adduser  -S nestjs -u 1001 -G nodejs

# Only copy what the runtime needs — no source, no devDependencies
COPY --from=deps    --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist         ./dist
COPY --chown=nestjs:nodejs package*.json ./

USER nestjs

EXPOSE 3000

# Drizzle migrations run separately in CI before the container starts.
# The API never auto-migrates — that's a deployment step, not a startup step.
CMD ["node", "dist/main"]
