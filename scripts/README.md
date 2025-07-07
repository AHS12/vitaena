# Docker Scripts for Vitaena

This directory contains scripts to help you build, push, and secure your Vitaena Docker images.

## Scripts Overview

### 🐳 Build & Push Scripts

- `docker-build-push.sh` - Bash script for building and pushing to Docker Hub

### 🔒 Security Scanning Scripts

- `security-scan.sh` - Bash script for comprehensive security scanning

## Prerequisites

### Required Tools

- **Docker Desktop** - Make sure Docker is running
- **Git** - For version control information
- **Node.js** - For reading package.json version

### Optional Security Tools

- **Docker Scout** - `docker scout version` (built into Docker Desktop)
- **Trivy** - [Installation Guide](https://aquasecurity.github.io/trivy/latest/getting-started/installation/)
- **Snyk** - `npm install -g snyk` (requires account)

## Docker Hub Setup

Before pushing to Docker Hub, you need to:

1. **Create a Docker Hub account** at https://hub.docker.com
2. **Login to Docker Hub** from your terminal:
   ```bash
   docker login
   ```
3. **Update the username** in the scripts if needed (currently set to `ahs12`)

## Usage Examples

### 🚀 Quick Start - Build and Push

```bash
# Navigate to scripts directory
cd scripts

# Make script executable
chmod +x docker-build-push.sh

# Build and push with automatic version tagging
./docker-build-push.sh

# Build and push with custom tag
./docker-build-push.sh v2.0.0

# Build only (don't push)
./docker-build-push.sh --build-only

# Build, test, and push
./docker-build-push.sh --test

# Build, push, and cleanup old images
./docker-build-push.sh --cleanup
```

### 🔒 Security Scanning

```bash
# Make script executable
chmod +x security-scan.sh

# Run all security scans
./security-scan.sh

# Run specific scan type
./security-scan.sh --trivy

# Run Docker Scout only
./security-scan.sh --scout
```

## Script Features

### 🔨 Build & Push Features

- ✅ Automatic version detection from package.json
- ✅ Multi-arch support preparation
- ✅ Automatic tagging (version + latest)
- ✅ Local testing before push
- ✅ Image cleanup after push
- ✅ Build metadata (build date, Git commit)
- ✅ Colored output for better visibility

### 🛡️ Security Features

- ✅ Docker Scout vulnerability scanning
- ✅ Trivy comprehensive security analysis
- ✅ Snyk container security monitoring
- ✅ Best practices compliance check
- ✅ Detailed security reporting
- ✅ Image layer analysis

## Configuration

### Updating Docker Hub Username

If you want to use a different Docker Hub username, update this variable in the script:

**In `docker-build-push.sh`:**

```bash
DOCKER_USERNAME="your-username"
```

### Customizing Image Name

To use a different image name:

**In `docker-build-push.sh`:**

```bash
IMAGE_NAME="your-app-name"
```

## Output and Results

### Build Results

- Built Docker images tagged with version and latest
- Image information display (size, layers, etc.)
- Push confirmation with Docker Hub links

### Security Results

All security scan results are saved to `../security-scans/` directory:

- `scout-*.txt` - Docker Scout results
- `trivy-*.txt` - Trivy vulnerability reports
- `snyk-*.json` - Snyk security analysis
- `image-*.txt` - Image analysis and history
- `security-report-*.md` - Comprehensive security report

## Troubleshooting

### Common Issues

**1. Docker not running**

```
[ERROR] Docker is not running. Please start Docker and try again.
```

_Solution: Start Docker Desktop_

**2. Not logged in to Docker Hub**

```
[WARNING] Not logged in to Docker Hub. Please login first:
```

_Solution: Run `docker login`_

**3. Build context errors**

```
[ERROR] Build failed
```

_Solution: Ensure you're running from the project root and Dockerfile exists_

**4. Permission denied**

```
bash: ./docker-build-push.sh: Permission denied
```

_Solution: Run `chmod +x docker-build-push.sh`_

### Getting Help

For script usage help:

```bash
./docker-build-push.sh --help
./security-scan.sh --help
```

## CI/CD Integration

These scripts are designed to be easily integrated into CI/CD pipelines:

### GitHub Actions Example

```yaml
- name: Build and Push Docker Image
  run: |
    cd scripts
    ./docker-build-push.sh --cleanup
    ./security-scan.sh --all
```

### Manual Deployment Workflow

1. **Build locally**: `./docker-build-push.sh --build-only --test`
2. **Run security scan**: `./security-scan.sh --all`
3. **Review security report**: Check `../security-scans/security-report-*.md`
4. **Push to Docker Hub**: `./docker-build-push.sh --push-only`

## Security Best Practices

1. **Regular Scanning**: Run security scans regularly, especially before production deployments
2. **Update Dependencies**: Keep base images and dependencies updated
3. **Monitor Vulnerabilities**: Use Snyk monitoring for ongoing security alerts
4. **Review Reports**: Always review security reports before deployment
5. **Clean Images**: Use `--cleanup` flag to remove old, potentially vulnerable images

## Support

For issues related to:

- **Docker**: Check [Docker Documentation](https://docs.docker.com/)
- **Docker Hub**: Check [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
- **Security Tools**: Check respective tool documentation
- **Scripts**: Create an issue in the project repository
