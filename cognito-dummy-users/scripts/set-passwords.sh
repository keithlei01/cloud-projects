#!/bin/bash

# Script to set passwords for dummy users in Cognito User Pool
# Usage: ./scripts/set-passwords.sh <USER_POOL_ID> [PASSWORD]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if jq is installed (for JSON parsing)
if ! command -v jq &> /dev/null; then
    print_warning "jq is not installed. Install it for better output formatting."
fi

# Get User Pool ID from command line or CDK output
USER_POOL_ID="$1"
DEFAULT_PASSWORD="${2:-TempPassword123!}"

if [ -z "$USER_POOL_ID" ]; then
    print_info "Attempting to get User Pool ID from CDK stack outputs..."
    
    # Try to get from CDK stack (assuming stack name follows pattern)
    STACK_NAME=$(aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --query 'StackSummaries[?contains(StackName, `CognitoDummyUsers`)].StackName' --output text 2>/dev/null | head -1)
    
    if [ -n "$STACK_NAME" ]; then
        USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' --output text 2>/dev/null)
    fi
    
    if [ -z "$USER_POOL_ID" ]; then
        print_error "User Pool ID not provided and could not be found automatically."
        echo "Usage: $0 <USER_POOL_ID> [PASSWORD]"
        echo "Example: $0 ap-east-1_ABC123DEF TempPassword123!"
        exit 1
    fi
    
    print_info "Found User Pool ID: $USER_POOL_ID"
fi

# Validate User Pool ID format
if [[ ! "$USER_POOL_ID" =~ ^[a-z0-9-]+_[A-Za-z0-9]+$ ]]; then
    print_error "Invalid User Pool ID format: $USER_POOL_ID"
    exit 1
fi

# Array of dummy users
declare -a USERS=("keithlei" "davidlei" "heatherlei")

print_info "Setting passwords for dummy users in User Pool: $USER_POOL_ID"
print_info "Default password: $DEFAULT_PASSWORD"
echo

# Function to set password for a user
set_user_password() {
    local username="$1"
    local password="$2"
    
    print_info "Setting password for user: $username"
    
    if aws cognito-idp admin-set-user-password \
        --user-pool-id "$USER_POOL_ID" \
        --username "$username" \
        --password "$password" \
        --permanent \
        --output text > /dev/null 2>&1; then
        print_info "✓ Password set successfully for $username"
        return 0
    else
        print_error "✗ Failed to set password for $username"
        return 1
    fi
}

# Function to verify user exists
verify_user_exists() {
    local username="$1"
    
    if aws cognito-idp admin-get-user \
        --user-pool-id "$USER_POOL_ID" \
        --username "$username" \
        --output text > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Main execution
success_count=0
total_users=${#USERS[@]}

for username in "${USERS[@]}"; do
    if verify_user_exists "$username"; then
        if set_user_password "$username" "$DEFAULT_PASSWORD"; then
            ((success_count++))
        fi
    else
        print_warning "User $username does not exist in the User Pool"
    fi
done

echo
print_info "Password setting completed: $success_count/$total_users users updated"

if [ $success_count -eq $total_users ]; then
    print_info "All users have been updated successfully!"
    echo
    print_info "You can now test authentication with:"
    echo "aws cognito-idp admin-initiate-auth \\"
    echo "  --user-pool-id $USER_POOL_ID \\"
    echo "  --client-id <YOUR_CLIENT_ID> \\"
    echo "  --auth-flow ADMIN_NO_SRP_AUTH \\"
    echo "  --auth-parameters USERNAME=keithlei,PASSWORD=\"$DEFAULT_PASSWORD\""
else
    print_warning "Some users could not be updated. Check the errors above."
    exit 1
fi