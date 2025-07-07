#!/bin/bash

# Docker Hub Build and Push Script for Vitaena
# This script builds and pushes the Docker image to Docker Hub

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_REGISTRY="docker.io"
DOCKER_USERNAME="ahs12"
IMAGE_NAME="vitaena"
DEFAULT_TAG="latest"
DOCKERFILE_PATH="../Dockerfile"
BUILD_CONTEXT="../"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if logged in to Docker Hub
check_docker_login() {
    # Try to get auth info from docker config
    local config_path="$HOME/.docker/config.json"
    if [ -f "$config_path" ]; then
        if grep -q "auths" "$config_path" && grep -q "docker.io\|index.docker.io" "$config_path"; then
            return 0
        fi
    fi
    
    # Fallback: try docker info method
    if docker info 2>/dev/null | grep -q "Username"; then
        return 0
    fi
    
    # Final check: try a simple docker command that requires auth
    if docker search --limit 1 hello-world >/dev/null 2>&1; then
        return 0
    fi
    
    print_warning "Not logged in to Docker Hub. Please login first:"
    echo "docker login"
    exit 1
}

# Function to get version from package.json
get_version() {
    if command -v node &> /dev/null && [ -f "../package.json" ]; then
        node -p "require('../package.json').version" 2>/dev/null || echo "unknown"
    else
        echo "unknown"
    fi
}

# Function to build Docker image
build_image() {
    local tag=$1
    local full_image_name="${DOCKER_USERNAME}/${IMAGE_NAME}:${tag}"
    
    print_header "Building Docker Image"
    print_status "Building: $full_image_name"
    print_status "Context: $BUILD_CONTEXT"
    print_status "Dockerfile: $DOCKERFILE_PATH"
    
    docker build \
        -f "$DOCKERFILE_PATH" \
        -t "$full_image_name" \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        --build-arg VCS_REF="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" \
        --build-arg VERSION="$(get_version)" \
        "$BUILD_CONTEXT"
    
    print_status "✓ Build completed: $full_image_name"
    
    # Also tag as latest if not already latest
    if [ "$tag" != "latest" ]; then
        docker tag "$full_image_name" "${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
        print_status "✓ Tagged as latest: ${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
    fi
}

# Function to push Docker image
push_image() {
    local tag=$1
    local full_image_name="${DOCKER_USERNAME}/${IMAGE_NAME}:${tag}"
    
    print_header "Pushing Docker Image"
    print_status "Pushing: $full_image_name"
    
    docker push "$full_image_name"
    print_status "✓ Push completed: $full_image_name"
    
    # Also push latest if not already latest
    if [ "$tag" != "latest" ]; then
        docker push "${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
        print_status "✓ Push completed: ${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
    fi
}

# Function to show image info
show_image_info() {
    local tag=$1
    local full_image_name="${DOCKER_USERNAME}/${IMAGE_NAME}:${tag}"
    
    print_header "Image Information"
    
    # Check if image exists with more flexible matching
    if docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^${DOCKER_USERNAME}/${IMAGE_NAME}:${tag}$"; then
        print_status "Image: $full_image_name"
        docker images "${DOCKER_USERNAME}/${IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
        
        # Show image layers
        print_status "Image layers:"
        docker history "$full_image_name" --format "table {{.Size}}\t{{.CreatedBy}}" | head -10
    else
        print_warning "Image not found locally: $full_image_name"
        
        # Try to show all images with this name to help debug
        print_status "Available images for ${DOCKER_USERNAME}/${IMAGE_NAME}:"
        docker images "${DOCKER_USERNAME}/${IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" || print_warning "No images found with name ${DOCKER_USERNAME}/${IMAGE_NAME}"
    fi
}

# Function to test image locally
test_image() {
    local tag=$1
    local full_image_name="${DOCKER_USERNAME}/${IMAGE_NAME}:${tag}"
    
    print_header "Testing Docker Image"
    print_status "Testing: $full_image_name"
    
    # Run a quick test
    docker run --rm --name vitaena-test -d -p 3001:3000 "$full_image_name"
    
    print_status "Container started on port 3001"
    print_status "Waiting for container to be ready..."
    
    # Wait for container to be ready
    sleep 5
    
    # Test if container is responding
    if curl -f http://localhost:3001 > /dev/null 2>&1; then
        print_status "✓ Container is responding"
    else
        print_warning "Container may not be responding properly"
    fi
    
    # Stop test container
    docker stop vitaena-test
    print_status "✓ Test container stopped"
}

# Function to clean up old images
cleanup() {
    print_header "Cleaning Up"
    
    # Remove dangling images
    if docker images -f "dangling=true" -q | grep -q .; then
        print_status "Removing dangling images..."
        docker rmi $(docker images -f "dangling=true" -q)
    fi
    
    # Remove old versions (keep last 3)
    print_status "Cleaning up old image versions..."
    docker images "${DOCKER_USERNAME}/${IMAGE_NAME}" --format "{{.Tag}}" | grep -v "latest" | tail -n +4 | xargs -r docker rmi "${DOCKER_USERNAME}/${IMAGE_NAME}:" 2>/dev/null || true
    
    print_status "✓ Cleanup completed"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [options] [tag]"
    echo "Options:"
    echo "  --build-only    Build image only (don't push)"
    echo "  --push-only     Push existing image only (don't build)"
    echo "  --test          Test image locally after build"
    echo "  --cleanup       Clean up old images after push"
    echo "  --info          Show image information"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                          # Build and push with version tag + latest"
    echo "  $0 v1.0.0                   # Build and push with custom tag"
    echo "  $0 --build-only             # Build only, don't push"
    echo "  $0 --test v1.0.0            # Build, test, and push"
    echo "  $0 --cleanup                # Build, push, and cleanup"
}

# Main function
main() {
    local tag=""
    local build_only=false
    local push_only=false
    local test_image_flag=false
    local cleanup_flag=false
    local info_only=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --build-only)
                build_only=true
                shift
                ;;
            --push-only)
                push_only=true
                shift
                ;;
            --test)
                test_image_flag=true
                shift
                ;;
            --cleanup)
                cleanup_flag=true
                shift
                ;;
            --info)
                info_only=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            --*)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                tag=$1
                shift
                ;;
        esac
    done
    
    # Set default tag if not provided
    if [ -z "$tag" ]; then
        version=$(get_version)
        if [ "$version" != "unknown" ]; then
            tag="v$version"
        else
            tag="$DEFAULT_TAG"
        fi
    fi
    
    print_header "Docker Hub Build and Push for Vitaena"
    print_status "Image: ${DOCKER_USERNAME}/${IMAGE_NAME}:${tag}"
    print_status "Registry: $DOCKER_REGISTRY"
    
    # Check prerequisites
    check_docker
    
    if [ "$info_only" = true ]; then
        show_image_info "$tag"
        exit 0
    fi
    
    if [ "$push_only" = false ]; then
        build_image "$tag"
        
        if [ "$test_image_flag" = true ]; then
            test_image "$tag"
        fi
        
        show_image_info "$tag"
    fi
    
    if [ "$build_only" = false ]; then
        check_docker_login
        push_image "$tag"
        
        print_status "✓ Image successfully pushed to Docker Hub!"
        print_status "  Pull with: docker pull ${DOCKER_USERNAME}/${IMAGE_NAME}:${tag}"
        print_status "  Docker Hub: https://hub.docker.com/r/${DOCKER_USERNAME}/${IMAGE_NAME}"
    fi
    
    if [ "$cleanup_flag" = true ]; then
        cleanup
    fi
    
    print_status "✓ All operations completed successfully!"
}

# Run main function
main "$@"
