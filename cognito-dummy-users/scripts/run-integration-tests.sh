#!/bin/bash

# Comprehensive integration test runner for Cognito Dummy Users CDK project
# This script runs both shell-based and Jest-based integration tests

set -e

# Enable debug mode if DEBUG=1
if [ "${DEBUG:-0}" = "1" ]; then
    set -x
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_SUITE=${1:-"all"}  # all, shell, jest, or validation
CLEANUP=${CLEANUP:-true}
PARALLEL=${PARALLEL:-false}

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
    echo "Usage: $0 [TEST_SUITE]"
    echo ""
    echo "TEST_SUITE options:"
    echo "  all        - Run all integration tests (default)"
    echo "  shell      - Run shell-based integration tests only"
    echo "  jest       - Run Jest-based integration tests only"
    echo "  validation - Run validation tests only"
    echo "  help       - Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  CLEANUP    - Set to 'false' to skip cleanup (default: true)"
    echo "  PARALLEL   - Set to 'true' to run tests in parallel (default: false)"
    echo "  DEBUG      - Set to '1' to enable debug output"
    echo ""
    echo "Examples:"
    echo "  $0 all                    # Run all tests"
    echo "  $0 shell                  # Run shell tests only"
    echo "  CLEANUP=false $0 jest     # Run Jest tests without cleanup"
    echo "  DEBUG=1 $0 validation     # Run validation with debug output"
}

# Function to check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites for integration tests..."
    
    local missing_deps=()
    
    # Check required commands
    for cmd in aws node npm jq; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
        fi
    done
    
    # Check CDK availability (either global or via npx)
    if ! command -v cdk &> /dev/null && ! npx cdk --version &> /dev/null; then
        missing_deps+=("cdk")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        print_info "Please install the missing dependencies and try again"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured or invalid"
        print_info "Please configure AWS credentials using 'aws configure' or environment variables"
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "cdk.json" ]; then
        print_error "Not in CDK project directory"
        print_info "Please run this script from the cognito-dummy-users directory"
        exit 1
    fi
    
    print_info "Prerequisites check passed"
}

# Function to build project
build_project() {
    print_step "Building project..."
    
    npm install
    npm run build
    
    print_info "Project built successfully"
}

# Function to run shell-based integration tests
run_shell_tests() {
    print_step "Running shell-based integration tests..."
    
    local start_time=$(date +%s)
    
    if CLEANUP="$CLEANUP" ./scripts/integration-test.sh run; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        print_info "✅ Shell integration tests passed (${duration}s)"
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        print_error "❌ Shell integration tests failed (${duration}s)"
        return 1
    fi
}

# Function to run Jest-based integration tests
run_jest_tests() {
    print_step "Running Jest-based integration tests..."
    
    local start_time=$(date +%s)
    local jest_env=""
    
    # Set environment variables for Jest
    if [ "$CLEANUP" = "false" ]; then
        jest_env="SKIP_CLEANUP=true"
    fi
    
    if eval "$jest_env npm run test:integration"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        print_info "✅ Jest integration tests passed (${duration}s)"
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        print_error "❌ Jest integration tests failed (${duration}s)"
        return 1
    fi
}

# Function to run validation tests
run_validation_tests() {
    print_step "Running validation tests..."
    
    local start_time=$(date +%s)
    
    # Check if there's a deployed stack to validate
    local stack_name="CognitoDummyUsersStack"
    if aws cloudformation describe-stacks --stack-name "$stack_name" &> /dev/null; then
        print_info "Found existing stack, running validation..."
        
        if npm run test:validate; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            print_info "✅ Validation tests passed (${duration}s)"
            return 0
        else
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            print_error "❌ Validation tests failed (${duration}s)"
            return 1
        fi
    else
        print_warning "No deployed stack found for validation"
        print_info "Deploy a stack first using: npm run deploy"
        return 0
    fi
}

# Function to run tests in parallel
run_parallel_tests() {
    print_step "Running integration tests in parallel..."
    
    local pids=()
    local results=()
    local start_time=$(date +%s)
    
    # Start shell tests in background
    (
        print_info "Starting shell tests in background..."
        if run_shell_tests; then
            echo "shell:success" > /tmp/shell_test_result
        else
            echo "shell:failure" > /tmp/shell_test_result
        fi
    ) &
    pids+=($!)
    
    # Start Jest tests in background
    (
        print_info "Starting Jest tests in background..."
        if run_jest_tests; then
            echo "jest:success" > /tmp/jest_test_result
        else
            echo "jest:failure" > /tmp/jest_test_result
        fi
    ) &
    pids+=($!)
    
    # Wait for all background processes
    print_info "Waiting for parallel tests to complete..."
    for pid in "${pids[@]}"; do
        wait "$pid"
    done
    
    # Collect results
    local shell_result=$(cat /tmp/shell_test_result 2>/dev/null || echo "shell:unknown")
    local jest_result=$(cat /tmp/jest_test_result 2>/dev/null || echo "jest:unknown")
    
    # Clean up temp files
    rm -f /tmp/shell_test_result /tmp/jest_test_result
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Report results
    print_info "Parallel test results:"
    if [[ "$shell_result" == "shell:success" ]]; then
        print_info "  ✅ Shell tests: PASSED"
    else
        print_error "  ❌ Shell tests: FAILED"
    fi
    
    if [[ "$jest_result" == "jest:success" ]]; then
        print_info "  ✅ Jest tests: PASSED"
    else
        print_error "  ❌ Jest tests: FAILED"
    fi
    
    print_info "Total parallel execution time: ${duration}s"
    
    # Return success only if both passed
    if [[ "$shell_result" == "shell:success" && "$jest_result" == "jest:success" ]]; then
        return 0
    else
        return 1
    fi
}

# Function to run all tests sequentially
run_sequential_tests() {
    print_step "Running integration tests sequentially..."
    
    local test_results=()
    local start_time=$(date +%s)
    
    # Run shell tests
    run_shell_tests
    test_results+=($?)
    
    # Run Jest tests
    run_jest_tests
    test_results+=($?)
    
    # Run validation tests
    run_validation_tests
    test_results+=($?)
    
    # Calculate results
    local total_tests=${#test_results[@]}
    local failed_tests=0
    
    for result in "${test_results[@]}"; do
        if [ $result -ne 0 ]; then
            ((failed_tests++))
        fi
    done
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    print_info "Sequential test summary:"
    print_info "  Total test suites: $total_tests"
    print_info "  Passed: $((total_tests - failed_tests))"
    print_info "  Failed: $failed_tests"
    print_info "  Total execution time: ${duration}s"
    
    if [ $failed_tests -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# Main execution function
main() {
    local start_time=$(date +%s)
    
    print_info "🚀 Starting comprehensive integration tests for Cognito Dummy Users"
    print_info "Test suite: $TEST_SUITE"
    print_info "Cleanup: $CLEANUP"
    print_info "Parallel: $PARALLEL"
    echo "=================================================================="
    
    # Check prerequisites
    check_prerequisites
    
    # Build project
    build_project
    
    # Run tests based on suite selection
    local test_success=false
    
    case "$TEST_SUITE" in
        "all")
            if [ "$PARALLEL" = "true" ]; then
                run_parallel_tests && test_success=true
            else
                run_sequential_tests && test_success=true
            fi
            ;;
        "shell")
            run_shell_tests && test_success=true
            ;;
        "jest")
            run_jest_tests && test_success=true
            ;;
        "validation")
            run_validation_tests && test_success=true
            ;;
        "help")
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown test suite: $TEST_SUITE"
            show_usage
            exit 1
            ;;
    esac
    
    local end_time=$(date +%s)
    local total_duration=$((end_time - start_time))
    
    echo "=================================================================="
    if [ "$test_success" = true ]; then
        print_info "🎉 All integration tests completed successfully!"
        print_info "Total execution time: ${total_duration}s"
        exit 0
    else
        print_error "❌ Some integration tests failed!"
        print_info "Total execution time: ${total_duration}s"
        exit 1
    fi
}

# Handle script interruption
trap 'print_warning "Integration tests interrupted"; exit 130' INT TERM

# Run main function
main "$@"