# Multi-stage build for better security and smaller image size
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Update packages first for security
RUN apk update && apk upgrade && apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json ./
COPY pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Enable corepack for pnpm
RUN corepack enable pnpm

# Build the application
RUN pnpm build

# Production image with latest security updates
FROM node:20-alpine AS runner
WORKDIR /app

# Update all packages to latest versions for security and install Puppeteer dependencies
RUN apk update && apk upgrade && apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    ttf-dejavu \
    fontconfig \
    dumb-init \
    # Additional dependencies that help with Chrome/Puppeteer
    libstdc++ \
    libx11 \
    libxcomposite \
    libxdamage \
    libxi \
    libxtst \
    libc6-compat \
    && mkdir -p /tmp \
    && chmod 1777 /tmp \
    && rm -rf /var/cache/apk/* \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Tell Puppeteer to skip installing Chromium. We'll be using the installed package.
# These can be overridden by .env files and docker-compose environment settings
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PUPPETEER_ARGS='--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-accelerated-2d-canvas --no-first-run --no-zygote --disable-gpu'

# Set default environment variables
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Copy built application
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy package.json for runtime dependencies
COPY --from=builder /app/package.json ./package.json

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check using built-in Node.js capabilities
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "http.get('http://localhost:3000/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]
