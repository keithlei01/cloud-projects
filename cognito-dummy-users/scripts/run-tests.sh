#!/bin/bash

# Test runner script for Cognito Dummy Users CDK project
# Supports running unit tests, integration tests, or both

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_TYPE=${1:-all}
SKIP_CLEANUP=${SKIP_CLEANUP:-false}
SKIP_INTEGRATION_TESTS=${SKIP_INTEGRATION_TESTS:-false}

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [unit|integration|all|validate] [options]"
    echo ""
    echo "Test Types:"
    echo "  unit         - Run only unit tests"
    echo "  integration  - Run only integration tests"
    echo "  all          - Run both unit and integration tests (default)"
    echo "  validate     - Run deployment validation only"
    echo ""
    echo "Environment Variables:"
    echo "  SKIP_CLEANUP              - Set to 'true' to skip cleanup after integration tests"
    echo "  SKIP_INTEGRATION_TESTS    - Set to 'true' to skip integration tests entirely"
    echo "  AWS_REGION                - AWS region for integration tests (default: ap-east-1)"
    echo "  STACK_NAME                - Stack name for validation (default: CognitoDummyUsersStack)"
    echo ""
    echo "Examples:"
    echo "  $0 unit                   # Run only unit tests"
    echo "  $0 integration            # Run only integration tests"
    echo "  SKIP_CLEANUP=true $0 all  # Run all tests but skip cleanup"
    echo "  $0 validate --stack-name MyStack  # Validate specific stack"
}

# Function to check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check Node.js and npm
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "jest.config.js" ]; then
        print_error "Not in CDK project directory"
        exit 1
    fi
    
    print_info "Prerequisites check passed"
}

# Function to install dependencies
install_dependencies() {
    print_step "Installing dependencies..."
    
    npm install
    
    print_info "Dependencies installed"
}

# Function to build project
build_project() {
    print_step "Building project..."
    
    npm run build
    
    print_info "Project built successfully"
}

# Function to run unit tests
run_unit_tests() {
    print_step "Running unit tests..."
    
    if npm run test:unit; then
        print_info "✓ Unit tests passed"
        return 0
    else
        print_error "✗ Unit tests failed"
        return 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    if [ "$SKIP_INTEGRATION_TESTS" = "true" ]; then
        print_warning "Skipping integration tests (SKIP_INTEGRATION_TESTS=true)"
        return 0
    fi
    
    print_step "Running integration tests..."
    
    # Check AWS credentials for integration tests
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI not installed - required for integration tests"
        print_info "Install AWS CLI or set SKIP_INTEGRATION_TESTS=true"
        return 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured - required for integration tests"
        print_info "Configure AWS credentials using 'aws configure' or set SKIP_INTEGRATION_TESTS=true"
        return 1
    fi
    
    # Set environment variables for integration tests
    export SKIP_CLEANUP="$SKIP_CLEANUP"
    
    if npm run test:integration; then
        print_info "✓ Integration tests passed"
        return 0
    else
        print_error "✗ Integration tests failed"
        return 1
    fi
}

# Function to run deployment validation
run_validation() {
    print_step "Running deployment validation..."
    
    local stack_name="${STACK_NAME:-CognitoDummyUsersStack}"
    local region="${AWS_REGION:-ap-east-1}"
    
    # Parse additional arguments for validation
    shift # Remove the 'validate' argument
    while [[ $# -gt 0 ]]; do
        case $1 in
            --stack-name)
                stack_name="$2"
                shift 2
                ;;
            --region)
                region="$2"
                shift 2
                ;;
            *)
                print_warning "Unknown validation option: $1"
                shift
                ;;
        esac
    done
    
    print_info "Validating stack: $stack_name in region: $region"
    
    if command -v ts-node &> /dev/null; then
        if ts-node test/validate-deployment.ts --stack-name "$stack_name" --region "$region"; then
            print_info "✓ Deployment validation passed"
            return 0
        else
            print_error "✗ Deployment validation failed"
            return 1
        fi
    else
        print_error "ts-node not available - install with: npm install -g ts-node"
        return 1
    fi
}

# Function to run all tests
run_all_tests() {
    local results=()
    
    print_info "Running complete test suite..."
    
    run_unit_tests
    results+=($?)
    
    run_integration_tests
    results+=($?)
    
    # Calculate results
    local total_suites=${#results[@]}
    local failed_suites=0
    
    for result in "${results[@]}"; do
        if [ $result -ne 0 ]; then
            ((failed_suites++))
        fi
    done
    
    print_info "Test suite summary:"
    print_info "Total test suites: $total_suites"
    print_info "Passed: $((total_suites - failed_suites))"
    print_info "Failed: $failed_suites"
    
    if [ $failed_suites -eq 0 ]; then
        print_info "🎉 All test suites passed!"
        return 0
    else
        print_error "❌ Some test suites failed"
        return 1
    fi
}

# Main execution
main() {
    local start_time=$(date +%s)
    
    case "$TEST_TYPE" in
        "unit")
            check_prerequisites
            install_dependencies
            build_project
            run_unit_tests
            ;;
        "integration")
            check_prerequisites
            install_dependencies
            build_project
            run_integration_tests
            ;;
        "all")
            check_prerequisites
            install_dependencies
            build_project
            run_all_tests
            ;;
        "validate")
            run_validation "$@"
            ;;
        "help"|"-h"|"--help")
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown test type: $TEST_TYPE"
            show_usage
            exit 1
            ;;
    esac
    
    local exit_code=$?
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    print_info "Test execution completed in ${duration}s"
    exit $exit_code
}

# Handle script interruption
trap 'print_warning "Test execution interrupted"; exit 130' INT TERM

# Run main function with all arguments
main "$@"