#!/bin/bash

# Integration test script for Cognito Dummy Users CDK project
# This script deploys the stack, validates user creation, and optionally cleans up

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
STACK_NAME="CognitoDummyUsersStack-IntegrationTest"
EXPECTED_USERS=("keithlei" "davidlei" "heatherlei")
TEST_PASSWORD="IntegrationTest123!"
CLEANUP=${CLEANUP:-true}

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

# Function to check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Check CDK CLI (either global or via npx)
    if ! command -v cdk &> /dev/null && ! npx cdk --version &> /dev/null; then
        print_error "CDK CLI is not available"
        exit 1
    fi
    
    # Check Node.js and npm
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured or invalid"
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "cdk.json" ]; then
        print_error "Not in CDK project directory"
        exit 1
    fi
    
    # Check CDK bootstrap status
    check_cdk_bootstrap
    
    print_info "Prerequisites check passed"
}

# Function to check CDK bootstrap status
check_cdk_bootstrap() {
    print_step "Checking CDK bootstrap status..."
    
    local region="${AWS_REGION:-ap-east-1}"
    local account=$(aws sts get-caller-identity --query Account --output text)
    
    print_info "Account: $account"
    print_info "Region: $region"
    
    # Check if CDK is bootstrapped
    if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region "$region" &> /dev/null; then
        print_warning "CDK is not bootstrapped in region $region"
        print_info "Bootstrapping CDK..."
        
        # Set environment variable to silence Node.js warning
        export JSII_SILENCE_WARNING_UNTESTED_NODE_VERSION=true
        
        if npx cdk bootstrap "aws://$account/$region"; then
            print_info "CDK bootstrap completed successfully"
        else
            print_error "CDK bootstrap failed"
            exit 1
        fi
    else
        print_info "CDK is already bootstrapped in region $region"
    fi
}

# Function to build the project
build_project() {
    print_step "Building CDK project..."
    
    npm install
    npm run build
    
    print_info "Project built successfully"
}

# Function to deploy the stack
deploy_stack() {
    print_step "Deploying CDK stack: $STACK_NAME"
    
    # Set environment variable for custom stack name
    export CDK_STACK_NAME="$STACK_NAME"
    
    # Set environment variable to silence Node.js warning
    export JSII_SILENCE_WARNING_UNTESTED_NODE_VERSION=true
    
    # Deploy with specific stack name for testing
    if npx cdk deploy "$STACK_NAME" --require-approval never --outputs-file outputs.json; then
        print_info "Stack deployed successfully"
    else
        print_error "Stack deployment failed"
        exit 1
    fi
}

# Function to extract outputs from CDK
extract_outputs() {
    print_step "Extracting stack outputs..."
    
    # Get stack outputs
    USER_POOL_ID=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
        --output text 2>/dev/null)
    
    USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
        --output text 2>/dev/null)
    
    if [ -z "$USER_POOL_ID" ] || [ -z "$USER_POOL_CLIENT_ID" ]; then
        print_error "Failed to extract User Pool ID or Client ID from stack outputs"
        exit 1
    fi
    
    print_info "User Pool ID: $USER_POOL_ID"
    print_info "User Pool Client ID: $USER_POOL_CLIENT_ID"
}

# Function to validate user creation
validate_users() {
    print_step "Validating user creation..."
    
    local success_count=0
    local total_users=${#EXPECTED_USERS[@]}
    
    for username in "${EXPECTED_USERS[@]}"; do
        print_info "Checking user: $username"
        
        if aws cognito-idp admin-get-user \
            --user-pool-id "$USER_POOL_ID" \
            --username "$username" \
            --output text > /dev/null 2>&1; then
            print_info "✓ User $username exists"
            ((success_count++))
            
            # Validate user attributes
            user_email=$(aws cognito-idp admin-get-user \
                --user-pool-id "$USER_POOL_ID" \
                --username "$username" \
                --query 'UserAttributes[?Name==`email`].Value' \
                --output text)
            
            if [ -n "$user_email" ]; then
                print_info "  Email: $user_email"
            else
                print_warning "  No email attribute found for $username"
            fi
            
        else
            print_error "✗ User $username does not exist"
        fi
    done
    
    if [ $success_count -eq $total_users ]; then
        print_info "All $total_users users validated successfully"
        return 0
    else
        print_error "User validation failed: $success_count/$total_users users found"
        return 1
    fi
}

# Function to test user authentication
test_authentication() {
    print_step "Testing user authentication..."
    
    local test_user="${EXPECTED_USERS[0]}"  # Test with first user
    local auth_success=0
    
    print_info "Setting temporary password for test user: $test_user"
    
    # Set password for testing
    if aws cognito-idp admin-set-user-password \
        --user-pool-id "$USER_POOL_ID" \
        --username "$test_user" \
        --password "$TEST_PASSWORD" \
        --permanent \
        --output text > /dev/null 2>&1; then
        print_info "Password set successfully"
    else
        print_error "Failed to set password for test user"
        return 1
    fi
    
    # Test successful authentication
    print_info "Testing successful authentication for user: $test_user"
    
    if auth_result=$(aws cognito-idp admin-initiate-auth \
        --user-pool-id "$USER_POOL_ID" \
        --client-id "$USER_POOL_CLIENT_ID" \
        --auth-flow ADMIN_NO_SRP_AUTH \
        --auth-parameters "USERNAME=$test_user,PASSWORD=$TEST_PASSWORD" \
        --output json 2>/dev/null); then
        
        access_token=$(echo "$auth_result" | jq -r '.AuthenticationResult.AccessToken // empty')
        id_token=$(echo "$auth_result" | jq -r '.AuthenticationResult.IdToken // empty')
        refresh_token=$(echo "$auth_result" | jq -r '.AuthenticationResult.RefreshToken // empty')
        
        if [ -n "$access_token" ] && [ -n "$id_token" ] && [ -n "$refresh_token" ]; then
            print_info "✓ Authentication successful for $test_user"
            print_info "  Access token received (length: ${#access_token})"
            print_info "  ID token received (length: ${#id_token})"
            print_info "  Refresh token received (length: ${#refresh_token})"
            ((auth_success++))
        else
            print_error "✗ Authentication failed: Missing tokens"
            print_info "  Access token: ${access_token:+present}"
            print_info "  ID token: ${id_token:+present}"
            print_info "  Refresh token: ${refresh_token:+present}"
        fi
    else
        print_error "✗ Authentication failed for $test_user"
    fi
    
    # Test authentication failure with wrong password
    print_info "Testing authentication failure with wrong password..."
    
    if aws cognito-idp admin-initiate-auth \
        --user-pool-id "$USER_POOL_ID" \
        --client-id "$USER_POOL_CLIENT_ID" \
        --auth-flow ADMIN_NO_SRP_AUTH \
        --auth-parameters "USERNAME=$test_user,PASSWORD=WrongPassword123!" \
        --output json > /dev/null 2>&1; then
        print_error "✗ Authentication should have failed with wrong password"
    else
        print_info "✓ Authentication correctly failed with wrong password"
        ((auth_success++))
    fi
    
    # Test authentication failure with non-existent user
    print_info "Testing authentication failure with non-existent user..."
    
    if aws cognito-idp admin-initiate-auth \
        --user-pool-id "$USER_POOL_ID" \
        --client-id "$USER_POOL_CLIENT_ID" \
        --auth-flow ADMIN_NO_SRP_AUTH \
        --auth-parameters "USERNAME=nonexistentuser,PASSWORD=$TEST_PASSWORD" \
        --output json > /dev/null 2>&1; then
        print_error "✗ Authentication should have failed with non-existent user"
    else
        print_info "✓ Authentication correctly failed with non-existent user"
        ((auth_success++))
    fi
    
    # Return success if all authentication tests passed
    if [ $auth_success -eq 3 ]; then
        print_info "All authentication tests passed"
        return 0
    else
        print_error "Some authentication tests failed ($auth_success/3 passed)"
        return 1
    fi
}

# Function to validate stack outputs
validate_stack_outputs() {
    print_step "Validating stack outputs..."
    
    local outputs=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs' \
        --output json)
    
    local required_outputs=("UserPoolId" "UserPoolClientId" "UserPoolArn" "CreatedUsers")
    local found_outputs=0
    
    for output_key in "${required_outputs[@]}"; do
        if echo "$outputs" | jq -e ".[] | select(.OutputKey == \"$output_key\")" > /dev/null; then
            print_info "✓ Output found: $output_key"
            ((found_outputs++))
        else
            print_error "✗ Missing output: $output_key"
        fi
    done
    
    if [ $found_outputs -eq ${#required_outputs[@]} ]; then
        print_info "All required outputs validated"
        return 0
    else
        print_error "Stack output validation failed"
        return 1
    fi
}

# Function to run comprehensive validation using TypeScript validator
run_comprehensive_validation() {
    print_step "Running comprehensive deployment validation..."
    
    if command -v ts-node &> /dev/null; then
        print_info "Running TypeScript validation script..."
        
        if ts-node test/validate-deployment.ts --stack-name "$STACK_NAME" --region "${AWS_REGION:-ap-east-1}"; then
            print_info "✓ Comprehensive validation passed"
            return 0
        else
            print_error "✗ Comprehensive validation failed"
            return 1
        fi
    else
        print_warning "ts-node not available, skipping comprehensive validation"
        print_info "Install ts-node to enable comprehensive validation: npm install -g ts-node"
        return 0
    fi
}

# Function to test cleanup verification
test_cleanup_verification() {
    print_step "Testing cleanup verification..."
    
    # Verify that users still exist before cleanup
    print_info "Verifying users exist before cleanup..."
    local users_before=0
    
    for username in "${EXPECTED_USERS[@]}"; do
        if aws cognito-idp admin-get-user \
            --user-pool-id "$USER_POOL_ID" \
            --username "$username" \
            --output text > /dev/null 2>&1; then
            ((users_before++))
        fi
    done
    
    if [ $users_before -eq ${#EXPECTED_USERS[@]} ]; then
        print_info "✓ All $users_before users exist before cleanup"
    else
        print_warning "Only $users_before/${#EXPECTED_USERS[@]} users found before cleanup"
    fi
    
    # Verify stack exists before cleanup
    if aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --output text > /dev/null 2>&1; then
        print_info "✓ Stack exists before cleanup"
    else
        print_error "✗ Stack does not exist before cleanup"
        return 1
    fi
    
    return 0
}

# Function to verify cleanup completion
verify_cleanup_completion() {
    print_step "Verifying cleanup completion..."
    
    local cleanup_success=0
    
    # Wait a bit for cleanup to complete
    print_info "Waiting for cleanup to complete..."
    sleep 10
    
    # Verify stack is deleted
    print_info "Verifying stack deletion..."
    if aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --output text > /dev/null 2>&1; then
        
        # Check if stack is in DELETE_IN_PROGRESS or DELETE_COMPLETE state
        stack_status=$(aws cloudformation describe-stacks \
            --stack-name "$STACK_NAME" \
            --query 'Stacks[0].StackStatus' \
            --output text 2>/dev/null)
        
        if [ "$stack_status" = "DELETE_COMPLETE" ]; then
            print_info "✓ Stack successfully deleted"
            ((cleanup_success++))
        elif [ "$stack_status" = "DELETE_IN_PROGRESS" ]; then
            print_info "Stack deletion in progress, waiting..."
            
            # Wait for deletion to complete (up to 5 minutes)
            local wait_count=0
            while [ $wait_count -lt 30 ]; do
                sleep 10
                ((wait_count++))
                
                if ! aws cloudformation describe-stacks \
                    --stack-name "$STACK_NAME" \
                    --output text > /dev/null 2>&1; then
                    print_info "✓ Stack successfully deleted"
                    ((cleanup_success++))
                    break
                fi
                
                current_status=$(aws cloudformation describe-stacks \
                    --stack-name "$STACK_NAME" \
                    --query 'Stacks[0].StackStatus' \
                    --output text 2>/dev/null)
                
                if [ "$current_status" = "DELETE_COMPLETE" ]; then
                    print_info "✓ Stack successfully deleted"
                    ((cleanup_success++))
                    break
                elif [[ "$current_status" == *"FAILED"* ]]; then
                    print_error "✗ Stack deletion failed with status: $current_status"
                    break
                fi
            done
            
            if [ $wait_count -eq 30 ]; then
                print_warning "Timeout waiting for stack deletion"
            fi
        else
            print_error "✗ Stack in unexpected state after cleanup: $stack_status"
        fi
    else
        print_info "✓ Stack successfully deleted (not found)"
        ((cleanup_success++))
    fi
    
    # Verify User Pool is deleted (should fail to access)
    print_info "Verifying User Pool deletion..."
    if [ -n "$USER_POOL_ID" ]; then
        if aws cognito-idp list-users \
            --user-pool-id "$USER_POOL_ID" \
            --output text > /dev/null 2>&1; then
            print_error "✗ User Pool still accessible after cleanup"
        else
            print_info "✓ User Pool successfully deleted (not accessible)"
            ((cleanup_success++))
        fi
    else
        print_warning "User Pool ID not available for verification"
        ((cleanup_success++))
    fi
    
    # Clean up local files
    print_info "Cleaning up local files..."
    [ -f "outputs.json" ] && rm outputs.json
    [ -f "integration-outputs.json" ] && rm integration-outputs.json
    
    if [ $cleanup_success -eq 2 ]; then
        print_info "✓ Cleanup verification completed successfully"
        return 0
    else
        print_error "✗ Cleanup verification failed ($cleanup_success/2 checks passed)"
        return 1
    fi
}

# Function to cleanup resources
cleanup_resources() {
    if [ "$CLEANUP" = "true" ]; then
        print_step "Cleaning up resources..."
        
        # First run cleanup verification test
        test_cleanup_verification
        
        print_info "Destroying CDK stack: $STACK_NAME"
        export CDK_STACK_NAME="$STACK_NAME"
        export JSII_SILENCE_WARNING_UNTESTED_NODE_VERSION=true
        
        if npx cdk destroy "$STACK_NAME" --force; then
            print_info "CDK destroy command completed"
            
            # Verify cleanup completion
            verify_cleanup_completion
        else
            print_error "CDK destroy command failed"
            return 1
        fi
        
        print_info "Cleanup completed"
    else
        print_warning "Cleanup skipped (CLEANUP=false)"
        print_info "To cleanup manually, run: cdk destroy"
    fi
}

# Function to run all tests
run_integration_tests() {
    local start_time=$(date +%s)
    local test_results=()
    
    print_info "Starting integration tests for Cognito Dummy Users CDK project"
    echo "=================================================="
    
    # Run test steps
    check_prerequisites
    test_results+=($?)
    
    build_project
    test_results+=($?)
    
    deploy_stack
    test_results+=($?)
    
    extract_outputs
    test_results+=($?)
    
    validate_stack_outputs
    test_results+=($?)
    
    validate_users
    test_results+=($?)
    
    run_comprehensive_validation
    test_results+=($?)
    
    test_authentication
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
    
    echo "=================================================="
    print_info "Integration test summary:"
    print_info "Total tests: $total_tests"
    print_info "Passed: $((total_tests - failed_tests))"
    print_info "Failed: $failed_tests"
    print_info "Duration: ${duration}s"
    
    if [ $failed_tests -eq 0 ]; then
        print_info "🎉 All integration tests passed!"
        cleanup_resources
        exit 0
    else
        print_error "❌ Some integration tests failed"
        cleanup_resources
        exit 1
    fi
}

# Handle script interruption
trap 'print_warning "Integration test interrupted"; cleanup_resources; exit 130' INT TERM

# Main execution
case "${1:-run}" in
    "run")
        run_integration_tests
        ;;
    "cleanup")
        cleanup_resources
        ;;
    "help")
        echo "Usage: $0 [run|cleanup|help]"
        echo "  run     - Run full integration test suite (default)"
        echo "  cleanup - Only cleanup resources"
        echo "  help    - Show this help message"
        echo ""
        echo "Environment variables:"
        echo "  CLEANUP - Set to 'false' to skip cleanup (default: true)"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac