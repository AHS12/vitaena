#!/bin/bash

# Docker Security Scanning Script for Vitaena
# This script helps scan for vulnerabilities in your Docker images

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="ahs12/vitaena:latest"
SCAN_RESULTS_DIR="../security-scans"

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

# Function to create scan results directory
create_scan_dir() {
    mkdir -p "$SCAN_RESULTS_DIR"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Security scan started" >> "$SCAN_RESULTS_DIR/scan.log"
}

# Function to scan with Docker Scout (if available)
scan_with_docker_scout() {
    print_header "Docker Scout Security Scan"
    
    if command -v docker scout &> /dev/null; then
        print_status "Running Docker Scout vulnerability scan..."
        
        # Quick scan
        docker scout quickview "$IMAGE_NAME" 2>&1 | tee "$SCAN_RESULTS_DIR/scout-quickview.txt"
        
        # Detailed CVE scan
        docker scout cves "$IMAGE_NAME" 2>&1 | tee "$SCAN_RESULTS_DIR/scout-cves.txt"
        
        # Recommendations
        docker scout recommendations "$IMAGE_NAME" 2>&1 | tee "$SCAN_RESULTS_DIR/scout-recommendations.txt"
        
        print_status "Docker Scout scan completed. Results saved to $SCAN_RESULTS_DIR/"
    else
        print_warning "Docker Scout not available. Install with: docker scout version"
    fi
}

# Function to scan with Trivy (if available)
scan_with_trivy() {
    print_header "Trivy Security Scan"
    
    if command -v trivy &> /dev/null; then
        print_status "Running Trivy vulnerability scan..."
        
        # Scan for vulnerabilities
        trivy image --format table "$IMAGE_NAME" 2>&1 | tee "$SCAN_RESULTS_DIR/trivy-vulnerabilities.txt"
        
        # Scan for secrets
        trivy image --scanners secret "$IMAGE_NAME" 2>&1 | tee "$SCAN_RESULTS_DIR/trivy-secrets.txt"
        
        # Scan for misconfigurations
        trivy image --scanners config "$IMAGE_NAME" 2>&1 | tee "$SCAN_RESULTS_DIR/trivy-config.txt"
        
        # JSON format for detailed analysis
        trivy image --format json --output "$SCAN_RESULTS_DIR/trivy-full-report.json" "$IMAGE_NAME"
        
        print_status "Trivy scan completed. Results saved to $SCAN_RESULTS_DIR/"
    else
        print_warning "Trivy not available. Install with: curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin"
    fi
}

# Function to scan with Snyk (if available)
scan_with_snyk() {
    print_header "Snyk Security Scan"
    
    if command -v snyk &> /dev/null; then
        print_status "Running Snyk vulnerability scan..."
        
        # Test for vulnerabilities
        snyk container test "$IMAGE_NAME" --json > "$SCAN_RESULTS_DIR/snyk-report.json" 2>&1 || true
        
        # Monitor for ongoing security
        snyk container monitor "$IMAGE_NAME" --project-name="vitaena-docker" 2>&1 | tee "$SCAN_RESULTS_DIR/snyk-monitor.txt" || true
        
        print_status "Snyk scan completed. Results saved to $SCAN_RESULTS_DIR/"
    else
        print_warning "Snyk not available. Install with: npm install -g snyk"
    fi
}

# Function to analyze image layers
analyze_image_layers() {
    print_header "Docker Image Analysis"
    
    print_status "Analyzing image layers..."
    docker history "$IMAGE_NAME" > "$SCAN_RESULTS_DIR/image-history.txt"
    
    print_status "Image size analysis..."
    docker images "$IMAGE_NAME" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" > "$SCAN_RESULTS_DIR/image-size.txt"
    
    print_status "Image inspection..."
    docker inspect "$IMAGE_NAME" > "$SCAN_RESULTS_DIR/image-inspect.json"
}

# Function to check for best practices
check_best_practices() {
    print_header "Docker Best Practices Check"
    
    print_status "Checking Dockerfile best practices..."
    
    # Check if running as non-root user
    if docker inspect "$IMAGE_NAME" --format='{{.Config.User}}' | grep -q "nextjs"; then
        print_status "✓ Running as non-root user"
    else
        print_warning "⚠ Not running as non-root user"
    fi
    
    # Check for health check
    if docker inspect "$IMAGE_NAME" --format='{{.Config.Healthcheck}}' | grep -q "Test"; then
        print_status "✓ Health check configured"
    else
        print_warning "⚠ No health check configured"
    fi
    
    # Check for proper labels
    if docker inspect "$IMAGE_NAME" --format='{{.Config.Labels}}' | grep -q "maintainer\|version"; then
        print_status "✓ Labels configured"
    else
        print_warning "⚠ Consider adding labels for better maintenance"
    fi
}

# Function to generate security report
generate_security_report() {
    print_header "Generating Security Report"
    
    local report_file="$SCAN_RESULTS_DIR/security-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# Docker Security Scan Report

**Image:** $IMAGE_NAME  
**Scan Date:** $(date '+%Y-%m-%d %H:%M:%S')

## Summary

This report contains the results of various security scans performed on the Vitaena Docker image.

## Scan Results

### Files Generated:
- \`scout-*.txt\` - Docker Scout scan results
- \`trivy-*.txt\` - Trivy vulnerability scan results  
- \`snyk-*.json\` - Snyk security analysis
- \`image-*.txt\` - Image analysis and history
- \`image-inspect.json\` - Detailed image inspection

## Recommendations

1. **Regular Updates**: Keep base images updated with latest security patches
2. **Minimal Base**: Use minimal base images when possible
3. **Non-root User**: Always run containers as non-root user
4. **Health Checks**: Implement proper health checks
5. **Secrets Management**: Never embed secrets in images
6. **Regular Scanning**: Perform regular vulnerability scans

## Next Steps

1. Review all scan results in the \`$SCAN_RESULTS_DIR\` directory
2. Address any high/critical vulnerabilities found
3. Update dependencies and base images as needed
4. Re-scan after making changes

EOF

    print_status "Security report generated: $report_file"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  --scout     Run Docker Scout scan only"
    echo "  --trivy     Run Trivy scan only"
    echo "  --snyk      Run Snyk scan only"
    echo "  --analyze   Run image analysis only"
    echo "  --all       Run all scans (default)"
    echo "  --help      Show this help message"
}

# Main function
main() {
    local scan_type="all"
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --scout)
                scan_type="scout"
                shift
                ;;
            --trivy)
                scan_type="trivy"
                shift
                ;;
            --snyk)
                scan_type="snyk"
                shift
                ;;
            --analyze)
                scan_type="analyze"
                shift
                ;;
            --all)
                scan_type="all"
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    print_header "Docker Security Scanner for Vitaena"
    print_status "Image: $IMAGE_NAME"
    print_status "Scan type: $scan_type"
    
    # Check prerequisites
    check_docker
    create_scan_dir
    
    # Run scans based on selection
    case $scan_type in
        "scout")
            scan_with_docker_scout
            ;;
        "trivy")
            scan_with_trivy
            ;;
        "snyk")
            scan_with_snyk
            ;;
        "analyze")
            analyze_image_layers
            check_best_practices
            ;;
        "all")
            analyze_image_layers
            check_best_practices
            scan_with_docker_scout
            scan_with_trivy
            scan_with_snyk
            ;;
    esac
    
    generate_security_report
    
    print_status "Security scan completed! Check $SCAN_RESULTS_DIR for detailed results."
}

# Run main function
main "$@"
