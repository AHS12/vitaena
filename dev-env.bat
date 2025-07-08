@echo off
echo Vitaena Development Environment

if "%1" == "start" (
    echo Starting development environment with hot reload and PWA support...
    docker-compose -f docker-compose.dev.yml --env-file .env up --build
) else if "%1" == "stop" (
    echo Stopping development environment...
    docker-compose -f docker-compose.dev.yml down
) else if "%1" == "restart" (
    echo Restarting development environment...
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.dev.yml --env-file .env up --build
) else if "%1" == "rebuild" (
    echo Completely rebuilding development environment...
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.dev.yml build --no-cache
    docker-compose -f docker-compose.dev.yml --env-file .env up --remove-orphans
) else if "%1" == "logs" (
    echo Showing development environment logs...
    docker-compose -f docker-compose.dev.yml logs -f
) else if "%1" == "pwa" (
    echo Starting development environment with PWA enabled...
    docker-compose -f docker-compose.dev.yml down
    docker exec -it vitaena-dev sh -c "pnpm dev:docker:pwa"
) else (
    echo Usage:
    echo   dev-env.bat start   - Start development environment with hot reload
    echo   dev-env.bat pwa     - Start development environment with PWA enabled
    echo   dev-env.bat stop    - Stop development environment
    echo   dev-env.bat restart - Restart development environment
    echo   dev-env.bat rebuild - Completely rebuild the development environment
    echo   dev-env.bat logs    - Show logs from the development environment
)
