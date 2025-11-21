# Vitaena Development Environment Makefile

.PHONY: start stop restart rebuild logs pwa

start:
	@echo "Starting development environment with hot reload and PWA support..."
	docker-compose -f docker-compose.yml --env-file .env up --build

stop:
	@echo "Stopping development environment..."
	docker-compose -f docker-compose.yml down

restart:
	@echo "Restarting development environment..."
	docker-compose -f docker-compose.yml down
	docker-compose -f docker-compose.yml --env-file .env up --build

rebuild:
	@echo "Completely rebuilding development environment..."
	docker-compose -f docker-compose.yml down
	docker-compose -f docker-compose.yml build --no-cache
	docker-compose -f docker-compose.yml --env-file .env up --remove-orphans

logs:
	@echo "Showing development environment logs..."
	docker-compose -f docker-compose.yml logs -f

pwa:
	@echo "Starting development environment with PWA enabled..."
	docker-compose -f docker-compose.yml down
	docker exec -it vitaena-dev sh -c "pnpm dev:docker:pwa"

# Usage:
#   make start   - Start development environment with hot reload
#   make pwa     - Start development environment with PWA enabled
#   make stop    - Stop development environment
#   make restart - Restart development environment
#   make rebuild - Completely rebuild the development environment
#   make logs    - Show logs from the development environment
