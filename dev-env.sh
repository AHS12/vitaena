#!/bin/bash

echo "Vitaena Development Environment"

case "$1" in
  start)
    echo "Starting development environment with hot reload..."
    docker-compose -f docker-compose.dev.yml --env-file .env up --build
    ;;
  stop)
    echo "Stopping development environment..."
    docker-compose -f docker-compose.dev.yml down
    ;;
  restart)
    echo "Restarting development environment..."
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.dev.yml --env-file .env up --build
    ;;
  rebuild)
    echo "Completely rebuilding development environment..."
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.dev.yml build --no-cache
    docker-compose -f docker-compose.dev.yml --env-file .env up --remove-orphans
    ;;
  logs)
    echo "Showing development environment logs..."
    docker-compose -f docker-compose.dev.yml logs -f
    ;;
  pwa)
    echo "Starting development environment with PWA enabled..."
    docker-compose -f docker-compose.dev.yml down
    docker exec -it vitaena-dev sh -c "pnpm dev:docker:pwa"
    ;;
  *)
    echo "Usage:"
    echo "  ./dev-env.sh start   - Start development environment with hot reload"
    echo "  ./dev-env.sh pwa     - Start development environment with PWA enabled"
    echo "  ./dev-env.sh stop    - Stop development environment"
    echo "  ./dev-env.sh restart - Restart development environment"
    echo "  ./dev-env.sh rebuild - Completely rebuild the development environment"
    echo "  ./dev-env.sh logs    - Show logs from the development environment"
    ;;
esac
