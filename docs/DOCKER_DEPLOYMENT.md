# Vitaena Docker Deployment Guide

This guide provides comprehensive instructions for deploying Vitaena using Docker with Caddy reverse proxy.

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for development)
- pnpm package manager

### Local Development with Docker

1. **Clone the repository:**

   ```bash
   git clone <your-repo-url>
   cd vitaena
   ```

2. **Copy environment file:**

   ```bash
   cp .env.example .env
   ```

3. **Start the development environment:**

   ```bash
   # On Windows
   ./dev-env.bat start

   # On Linux/macOS
   ./dev-env.sh start
   ```

   This uses `docker-compose.dev.yml` for hot reload and local development.

4. **Access the application:**
   - Application: http://localhost:3000
   - Health check: http://localhost:3000/api/health

### Production Deployment

1. **Build and push to Docker Hub:**

   ```bash
   # Using the deployment script
   cd scripts
   chmod +x docker-build-push.sh
   ./docker-build-push.sh

   # Build and push with custom tag
   ./docker-build-push.sh v1.0.0
   ```

2. **Deploy to production server:**

   ```bash
   # Copy files to server
   scp docker-compose.prod.yml user@server:~/vitaena-app/
   scp Caddyfile.example user@server:~/vitaena-app/Caddyfile

   # On the server
   cd ~/vitaena-app
   docker-compose -f docker-compose.prod.yml up -d
   ```

## File Structure

```
vitaena/
├── Dockerfile                # Main Docker configuration
├── Dockerfile.dev            # Development Dockerfile
├── docker-compose.dev.yml    # Local development setup
├── docker-compose.prod.yml   # Production setup
├── .dockerignore             # Docker build exclusions
├── Caddyfile.example         # Caddy reverse proxy config
├── dev-env.bat               # Windows Docker dev script
├── dev-env.sh                # Linux/macOS Docker dev script
├── scripts/
│   ├── docker-build-push.sh  # Docker build and push script
│   └── security-scan.sh      # Security scanning script
├── docs/
│   ├── DOCKER_DEPLOYMENT.md  # This guide
│   └── DOCKER_ENV_CONFIG.md  # Docker env config reference
├── src/                      # Application source code
│   ├── app/                  # Next.js App Router
│   ├── components/           # Reusable React components
│   ├── templates/            # Resume templates
│   ├── lib/                  # Utilities and DB
│   ├── stores/               # Zustand stores
│   └── types/                # TypeScript types
└── ...
```

## Docker Configuration

### Dockerfile Features

- **Multi-stage build** for optimized image size
- **Alpine Linux** with **Node.js 20** for latest features and performance
- **Chromium installation** for Puppeteer PDF generation
- **Non-root user** for security
- **Health checks** for container monitoring
- **Standalone Next.js build** for better performance

### Environment Variables

```bash
# Production environment
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

## Deployment Scripts

### Build and Push Script (scripts/docker-build-push.sh)

```bash
cd scripts
chmod +x docker-build-push.sh
./docker-build-push.sh
```

### Security Scan Script (scripts/security-scan.sh)

```bash
cd scripts
chmod +x security-scan.sh
./security-scan.sh
```

---

For more details, see the README and scripts/README.md.
