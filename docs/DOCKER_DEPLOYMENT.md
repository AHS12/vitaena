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

2. **Build and run locally:**

   ```bash
   # Build the Docker image
   docker-compose build

   # Start the application
   docker-compose up -d

   # Check status
   docker-compose ps
   ```

3. **Access the application:**
   - Application: http://localhost:3000
   - Health check: http://localhost:3000/api/health

### Production Deployment

1. **Build and push to Docker Hub:**

   ```bash
   # Using the deployment script
   ./scripts/docker-build-push.sh

   # Build and push with custom tag
   ./scripts/docker-build-push.sh v1.0.0

   # Manual build and push
   docker build -t ahs12/vitaena:latest .
   docker push ahs12/vitaena:latest
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

### Complete Setup with Caddy

1. **Use the combined setup:**

   ```bash
   # Copy Caddyfile.example to Caddyfile and edit with your domain
   cp Caddyfile.example Caddyfile

   # Edit domain in Caddyfile
   nano Caddyfile

   # Start everything with Caddy
   docker-compose -f docker-compose.caddy.yml up -d
   ```

## File Structure

```
vitaena/
├── Dockerfile                 # Main Docker configuration
├── docker-compose.yml         # Local development setup
├── docker-compose.prod.yml    # Production setup
├── docker-compose.caddy.yml   # Complete setup with Caddy
├── .dockerignore             # Docker build exclusions
├── Caddyfile.example         # Caddy reverse proxy config
├── scripts/
│   ├── docker-build-push.sh  # Docker build and push script
│   └── security-scan.sh      # Security scanning script
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions CI/CD
└── src/
    └── app/
        └── api/
            └── health/
                └── route.ts  # Health check endpoint
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

## Caddy Configuration

### Simple Setup

1. **Use the combined Docker Compose:**

   ```bash
   # Copy and edit Caddyfile
   cp Caddyfile.example Caddyfile
   nano Caddyfile  # Replace yourdomain.com with your domain

   # Start complete setup
   docker-compose -f docker-compose.caddy.yml up -d
   ```

2. **Alternative: Separate Caddy setup:**

   ```bash
   # Create Caddy network
   docker network create caddy_web

   # Start Vitaena
   docker-compose -f docker-compose.prod.yml up -d

   # Start Caddy (separate setup)
   # See Caddyfile.example for configuration
   ```

### Domain Configuration

Replace `yourdomain.com` in the Caddyfile with your actual domain:

```caddyfile
vitaena.yourdomain.com {
    reverse_proxy vitaena-app:3000

    # Security headers and optimizations
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
    }

    encode gzip
}
```

## Deployment Scripts

### Build and Push Script (scripts/docker-build-push.sh)

```bash
# Navigate to scripts directory
cd scripts

# Make script executable
chmod +x docker-build-push.sh

# Available commands
./docker-build-push.sh                    # Build and push with version tag + latest
./docker-build-push.sh v1.0.0            # Build and push with custom tag
./docker-build-push.sh --build-only      # Build only (don't push)
./docker-build-push.sh --test            # Test image locally after build
./docker-build-push.sh --cleanup         # Build, push, and cleanup old images
./docker-build-push.sh --info            # Show image information
./docker-build-push.sh --help            # Show help message
```

## CI/CD with GitHub Actions

### Setup

1. **Add repository secrets:**

   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Your Docker Hub password
   - `HOST`: Server IP address
   - `USERNAME`: Server username
   - `SSH_KEY`: Private SSH key for server access
   - `PORT`: SSH port (default: 22)

2. **Enable GitHub Actions:**
   - Push to `main` branch triggers build and deployment
   - Pull requests trigger tests only

### Workflow Features

- **Automated testing** with linting and build validation
- **Multi-platform builds** (linux/amd64)
- **Zero-downtime deployment** with health checks
- **Automatic rollback** on deployment failure
- **Docker layer caching** for faster builds

## Monitoring and Maintenance

### Health Checks

```bash
# Check application health
curl http://localhost:3000/api/health

# Check container health
docker-compose ps

# Monitor resource usage
docker stats
```

### Logs

```bash
# View application logs
docker-compose logs -f vitaena-app

# View logs with timestamp
docker-compose logs -f -t vitaena-app

# View specific number of lines
docker-compose logs --tail=100 vitaena-app
```

### Updates

```bash
# Update application using docker-compose
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --force-recreate

# Or build and push new version
cd scripts
./docker-build-push.sh --cleanup
```

## Security Considerations

### Docker Security

- **Non-root user** execution
- **Read-only root filesystem** in production
- **Dropped capabilities** for minimal permissions
- **Security headers** via Caddy
- **Regular base image updates**

### Network Security

- **Isolated Docker networks**
- **Firewall configuration** (ports 80, 443, 22)
- **SSL/TLS termination** at Caddy
- **Rate limiting** capabilities

## Troubleshooting

### Common Issues

1. **Container won't start:**

   ```bash
   # Check logs
   docker-compose logs vitaena-app

   # Check container status
   docker-compose ps

   # Restart container
   docker-compose restart vitaena-app
   ```

2. **PDF generation fails:**

   ```bash
   # Check Chromium installation
   docker-compose exec vitaena-app chromium-browser --version

   # Check Puppeteer configuration
   docker-compose exec vitaena-app node -e "console.log(require('puppeteer').executablePath())"
   ```

3. **High memory usage:**

   ```bash
   # Check memory limits
   docker stats

   # Adjust resources in docker-compose.yml
   deploy:
     resources:
       limits:
         memory: 2G
   ```

4. **SSL certificate issues:**

   ```bash
   # Check Caddy logs
   docker-compose -f ~/caddy/docker-compose.yml logs

   # Verify SSL certificate
   openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
   ```

### Performance Optimization

1. **Image optimization:**

   ```bash
   # Use multi-stage builds
   # Enable Docker layer caching
   # Regular cleanup of unused images
   docker image prune -f
   ```

2. **Container resources:**

   ```yaml
   deploy:
     resources:
       limits:
         cpus: "1.0"
         memory: 1G
       reservations:
         cpus: "0.5"
         memory: 512M
   ```

3. **Database optimization:**
   - Use Redis for caching
   - Optimize database queries
   - Regular database maintenance

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.prod.yml
services:
  vitaena-app:
    deploy:
      replicas: 3
    # ... other config
```

### Load Balancing

```caddyfile
# Caddyfile
vitaena.yourdomain.com {
    reverse_proxy vitaena-app-1:3000 vitaena-app-2:3000 vitaena-app-3:3000 {
        lb_policy round_robin
        health_uri /api/health
        health_interval 30s
    }
}
```

## Support

For issues and questions:

- Check the troubleshooting section
- Review Docker and container logs
- Verify network connectivity
- Check resource utilization

## License

This project is licensed under the MIT License.
