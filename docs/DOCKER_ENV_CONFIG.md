# Docker Environment Configuration

This directory contains Docker configurations for running Vitaena in different environments.

## Environment Variables (.env file)

Vitaena now uses a `.env` file for Docker environment configuration. This makes it easy to maintain consistent settings across different environments.

1. Copy the example configuration:

   ```bash
   cp .env.example .env
   ```

2. Modify the `.env` file as needed for your specific environment.

## Docker Configuration Files

- `docker-compose.yml`: Standard development Docker configuration
- `docker-compose.prod.yml`: Production Docker configuration


