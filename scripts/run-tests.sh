#!/bin/bash

# RWS Application Test Execution Script
# This script runs all tests for the RWS (React Web Service) application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"

print_status "Starting RWS Application Test Suite"
print_status "Project root: $PROJECT_ROOT"

# Check dependencies
print_status "Checking dependencies..."

if ! command_exists "node"; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists "npm"; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

if ! command_exists "php"; then
    print_error "PHP is not installed. Please install PHP first."
    exit 1
fi

if ! command_exists "composer"; then
    print_error "Composer is not installed. Please install Composer first."
    exit 1
fi

print_success "All required dependencies are installed"

# Parse command line arguments
RUN_FRONTEND=true
RUN_BACKEND=true
RUN_E2E=false
RUN_SECURITY=false
COVERAGE=false
WATCH=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --frontend-only)
            RUN_FRONTEND=true
            RUN_BACKEND=false
            shift
            ;;
        --backend-only)
            RUN_FRONTEND=false
            RUN_BACKEND=true
            shift
            ;;
        --e2e)
            RUN_E2E=true
            shift
            ;;
        --security)
            RUN_SECURITY=true
            shift
            ;;
        --coverage)
            COVERAGE=true
            shift
            ;;
        --watch)
            WATCH=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --frontend-only    Run only frontend tests"
            echo "  --backend-only     Run only backend tests"
            echo "  --e2e             Run end-to-end tests"
            echo "  --security        Run security tests"
            echo "  --coverage        Generate coverage reports"
            echo "  --watch           Run tests in watch mode"
            echo "  --help            Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Create test results directories
mkdir -p "$PROJECT_ROOT/test-results"
mkdir -p "$FRONTEND_DIR/test-results"
mkdir -p "$BACKEND_DIR/test-results"

# Frontend tests
if [ "$RUN_FRONTEND" = true ]; then
    print_status "Running Frontend Tests..."
    cd "$FRONTEND_DIR"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install --legacy-peer-deps
    fi
    
    # Run linting
    print_status "Running frontend linting..."
    npm run lint
    
    # Run type checking
    print_status "Running TypeScript type checking..."
    npm run type-check
    
    # Run unit tests
    if [ "$WATCH" = true ]; then
        print_status "Running frontend tests in watch mode..."
        npm run test:watch
    elif [ "$COVERAGE" = true ]; then
        print_status "Running frontend tests with coverage..."
        npm run test:coverage
    else
        print_status "Running frontend unit tests..."
        npm run test
    fi
    
    print_success "Frontend tests completed"
fi

# Backend tests
if [ "$RUN_BACKEND" = true ]; then
    print_status "Running Backend Tests..."
    cd "$BACKEND_DIR"
    
    # Check if vendor directory exists
    if [ ! -d "vendor" ]; then
        print_status "Installing backend dependencies..."
        composer install --no-dev --optimize-autoloader
    fi
    
    # Set up test environment
    if [ ! -f ".env.testing" ]; then
        print_status "Creating test environment file..."
        cp .env.example .env.testing
        php artisan key:generate --env=testing
    fi
    
    # Run database migrations for testing
    print_status "Setting up test database..."
    php artisan migrate:fresh --env=testing --seed
    
    # Run PHPUnit tests
    if [ "$COVERAGE" = true ]; then
        print_status "Running backend tests with coverage..."
        ./vendor/bin/phpunit --coverage-html coverage-html --coverage-clover coverage-clover.xml
    else
        print_status "Running backend tests..."
        ./vendor/bin/phpunit
    fi
    
    print_success "Backend tests completed"
fi

# End-to-end tests
if [ "$RUN_E2E" = true ]; then
    print_status "Running End-to-End Tests..."
    cd "$FRONTEND_DIR"
    
    # Check if both servers are running
    if ! port_in_use 3000; then
        print_warning "Frontend server not running on port 3000. Starting it..."
        npm run dev &
        FRONTEND_PID=$!
        sleep 10
    fi
    
    if ! port_in_use 8000; then
        print_warning "Backend server not running on port 8000. Starting it..."
        cd "$BACKEND_DIR"
        php artisan serve --port=8000 &
        BACKEND_PID=$!
        sleep 5
        cd "$FRONTEND_DIR"
    fi
    
    # Wait for servers to be ready
    print_status "Waiting for servers to be ready..."
    sleep 15
    
    # Run Playwright tests
    print_status "Running Playwright E2E tests..."
    npx playwright test
    
    # Cleanup background processes
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    print_success "End-to-end tests completed"
fi

# Security tests
if [ "$RUN_SECURITY" = true ]; then
    print_status "Running Security Tests..."
    
    if ! command_exists "docker"; then
        print_warning "Docker is not installed. Skipping OWASP ZAP security tests."
        print_warning "To run security tests, please install Docker and try again."
    else
        print_status "Starting OWASP ZAP security scan..."
        
        # Ensure servers are running
        if ! port_in_use 3000; then
            print_warning "Frontend server not running. Starting it..."
            cd "$FRONTEND_DIR"
            npm run dev &
            FRONTEND_PID=$!
            sleep 10
        fi
        
        if ! port_in_use 8000; then
            print_warning "Backend server not running. Starting it..."
            cd "$BACKEND_DIR"
            php artisan serve --port=8000 &
            BACKEND_PID=$!
            sleep 5
        fi
        
        # Wait for servers to be ready
        sleep 15
        
        # Create ZAP reports directory
        mkdir -p "$PROJECT_ROOT/security-tests/zap-reports"
        
        # Run OWASP ZAP baseline scan
        docker run -v "$PROJECT_ROOT/security-tests":/zap/wrk/:rw \
            -t owasp/zap2docker-stable zap-baseline.py \
            -t http://host.docker.internal:3000 \
            -g gen.conf \
            -r zap-reports/baseline-report.html \
            -J zap-reports/baseline-report.json \
            -x zap-reports/baseline-report.xml
        
        # Cleanup background processes
        if [ ! -z "$FRONTEND_PID" ]; then
            kill $FRONTEND_PID 2>/dev/null || true
        fi
        if [ ! -z "$BACKEND_PID" ]; then
            kill $BACKEND_PID 2>/dev/null || true
        fi
        
        print_success "Security tests completed"
    fi
fi

# Generate combined test report
print_status "Generating test report summary..."

REPORT_FILE="$PROJECT_ROOT/test-results/test-summary.txt"
echo "RWS Application Test Summary" > "$REPORT_FILE"
echo "===========================" >> "$REPORT_FILE"
echo "Generated on: $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ "$RUN_FRONTEND" = true ]; then
    echo "✓ Frontend tests executed" >> "$REPORT_FILE"
fi

if [ "$RUN_BACKEND" = true ]; then
    echo "✓ Backend tests executed" >> "$REPORT_FILE"
fi

if [ "$RUN_E2E" = true ]; then
    echo "✓ End-to-end tests executed" >> "$REPORT_FILE"
fi

if [ "$RUN_SECURITY" = true ]; then
    echo "✓ Security tests executed" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"
echo "Test artifacts are available in:" >> "$REPORT_FILE"
echo "- Frontend: $FRONTEND_DIR/test-results/" >> "$REPORT_FILE"
echo "- Backend: $BACKEND_DIR/test-results/" >> "$REPORT_FILE"

if [ "$COVERAGE" = true ]; then
    echo "- Coverage reports:" >> "$REPORT_FILE"
    echo "  - Frontend: $FRONTEND_DIR/coverage/" >> "$REPORT_FILE"
    echo "  - Backend: $BACKEND_DIR/coverage-html/" >> "$REPORT_FILE"
fi

if [ "$RUN_SECURITY" = true ]; then
    echo "- Security reports: $PROJECT_ROOT/security-tests/zap-reports/" >> "$REPORT_FILE"
fi

print_success "All tests completed successfully!"
print_status "Test summary written to: $REPORT_FILE"
print_status "Thank you for using the RWS test suite!"