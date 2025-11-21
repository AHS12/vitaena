# Multi-stage build for better security and smaller image size
FROM node:20-alpine AS base

# Install system dependencies including Chromium
RUN apk update && apk upgrade && apk add --no-cache \
    # System dependencies
    ca-certificates \
    fontconfig \
    dumb-init \
    libc6-compat \
    # Chromium dependencies
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont \
    && mkdir -p /tmp \
    && chmod 1777 /tmp \
    && rm -rf /var/cache/apk/*

# Enable corepack for pnpm
RUN corepack enable pnpm

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PUPPETEER_ARGS='--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-accelerated-2d-canvas --no-first-run --no-zygote --disable-gpu --single-process'

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json ./
COPY pnpm-lock.yaml ./
RUN pnpm i --frozen-lockfile

# Rebuild the source code only when needed (for production)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN pnpm build

# Development stage
FROM base AS development
WORKDIR /app

# Set development environment
ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Copy package files and install all dependencies (including dev)
COPY package.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# Expose port
EXPOSE 3000

# Start development server
CMD ["pnpm", "dev"]

# Production stage - ultra-optimized for minimal size
FROM node:20-alpine AS production
WORKDIR /app

# Set production environment
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Install only minimal runtime dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    ca-certificates \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PUPPETEER_ARGS='--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-accelerated-2d-canvas --no-first-run --no-zygote --disable-gpu --single-process'

# Enable pnpm
RUN corepack enable pnpm

# Copy built application
COPY --from=builder /app/public ./public

# Create .next directory
RUN mkdir -p .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy package.json and pnpm-lock.yaml for production dependencies
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Install only production dependencies and clean up aggressively
RUN pnpm install --prod --frozen-lockfile --ignore-scripts && \
    pnpm store prune && \
    rm -rf ~/.local/share/pnpm && \
    rm -rf ~/.cache && \
    rm -rf /tmp/* && \
    rm -rf /var/tmp/* && \
    rm -rf /usr/share/man && \
    rm -rf /usr/share/doc

# Expose port
EXPOSE 3000

# Health check using built-in Node.js capabilities
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "http.get('http://localhost:3000/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]
