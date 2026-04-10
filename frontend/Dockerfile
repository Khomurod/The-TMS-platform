# ── Stage 1: Dependencies ────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# ── Stage 2: Build ───────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args for runtime env — NEXT_PUBLIC_ vars are baked at build time
ARG NEXT_PUBLIC_API_URL=/api/mock
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Ensure public/ exists even if Git didn't track the empty dir
RUN mkdir -p /app/public

# Build the Next.js app
RUN npm run build

# ── Stage 3: Production ─────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
