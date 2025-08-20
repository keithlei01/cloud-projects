# Cognito Dummy Users CDK Project

AWS CDK TypeScript application that provisions 3 dummy users in an Amazon Cognito User Pool for development and testing purposes.

## Overview

This project creates a complete Cognito User Pool with 3 predefined dummy users using AWS CDK. It's designed to provide consistent test users for development environments where you need pre-populated user accounts.

## Architecture

- **Cognito User Pool**: Configured with email/username sign-in, password policy, and required attributes
- **User Pool Client**: Application client for authentication flows
- **Lambda Function**: Custom resource Lambda that creates and manages the 3 dummy users
- **Custom Resource**: CloudFormation custom resource that triggers the Lambda function
- **3 Dummy Users**: Pre-created users with verified email addresses (created via Lambda)

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js (version 14 or later)
- AWS CDK CLI installed globally: `npm install -g aws-cdk`
- CDK bootstrapped in your target AWS account/region

## Installation

1. Navigate to the project directory:
   ```bash
   cd cognito-dummy-users
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Deployment

### Deploy the Stack

```bash
npm run deploy
```

Or using CDK directly:
```bash
cdk deploy
```

### View Stack Outputs

After deployment, the stack will output important information:
- **UserPoolId**: The Cognito User Pool ID
- **UserPoolClientId**: The User Pool Client ID  
- **UserPoolArn**: The User Pool ARN
- **CreatedUsers**: List of created usernames
- **PasswordInstructions**: Command to set user passwords

## Dummy Users

The following 3 users are created automatically via Lambda function:

| Username | Email | First Name | Last Name |
|----------|-------|------------|-----------|
| keithlei | keithlei01@gmail.com | Keith | Lei |
| davidlei | davidlei812@gmail.com | David | Lei |
| heatherlei | heatherlei719@gmail.com | Heather | Lei |

## Setting User Passwords

After deployment, you need to set passwords for the users manually. Use the AWS CLI:

```bash
# Set password for a user (replace values with your actual User Pool ID)
aws cognito-idp admin-set-user-password \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --username keithlei \
  --password "TempPassword123!" \
  --permanent

# Repeat for other users
aws cognito-idp admin-set-user-password \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --username davidlei \
  --password "TempPassword123!" \
  --permanent

aws cognito-idp admin-set-user-password \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --username heatherlei \
  --password "TempPassword123!" \
  --permanent
```

## User Pool Configuration

### Password Policy
- Minimum 8 characters
- Requires lowercase letters
- Requires uppercase letters  
- Requires numbers
- Requires symbols

### Attributes
- **Email**: Required, mutable, auto-verified
- **Given Name**: Required, mutable
- **Family Name**: Required, mutable

### Authentication Flows
- User password authentication
- SRP (Secure Remote Password) authentication
- Admin user password authentication

### OAuth Configuration
- Authorization code grant flow enabled
- Scopes: email, openid, profile

## Testing

This project includes comprehensive testing capabilities with both unit tests and integration tests.

### Test Types

1. **Unit Tests**: Test CDK stack synthesis and resource configuration
2. **Integration Tests**: Deploy actual infrastructure and validate functionality
3. **Deployment Validation**: Validate existing deployed stacks

### Running Tests

#### Quick Test Commands

```bash
# Run all tests (unit + integration)
npm run test:all

# Run only unit tests
npm run test:unit

# Run only integration tests (requires AWS credentials)
npm run test:integration

# Run tests using the comprehensive test runner
npm run test:run all
```

#### Advanced Test Runner

The project includes a comprehensive test runner script with multiple options:

```bash
# Run specific test types
./scripts/run-tests.sh unit           # Unit tests only
./scripts/run-tests.sh integration    # Integration tests only
./scripts/run-tests.sh all           # All tests (default)

# Validate existing deployment
./scripts/run-tests.sh validate
./scripts/run-tests.sh validate --stack-name MyStack --region ap-east-1

# Skip cleanup after integration tests
SKIP_CLEANUP=true ./scripts/run-tests.sh integration

# Skip integration tests entirely
SKIP_INTEGRATION_TESTS=true ./scripts/run-tests.sh all
```

#### Shell-based Integration Testing

For comprehensive end-to-end testing with detailed output:

```bash
# Run full integration test suite
./scripts/integration-test.sh

# Run with custom configuration
STACK_NAME=MyTestStack ./scripts/integration-test.sh

# Skip cleanup for debugging
CLEANUP=false ./scripts/integration-test.sh
```

### Integration Test Features

The integration tests perform the following validations:

1. **Stack Deployment**: Deploy the CDK stack to AWS
2. **Resource Validation**: Verify all resources are created correctly
3. **User Creation**: Confirm all 3 dummy users exist in Cognito
4. **User Attributes**: Validate user attributes (email, names, etc.)
5. **Authentication**: Test user login capabilities
6. **Stack Outputs**: Verify all required outputs are present
7. **Cleanup**: Properly destroy resources after testing

### Deployment Validation

You can validate an existing deployment without running full integration tests:

```bash
# Validate default stack
npm run test:validate

# Validate specific stack
ts-node test/validate-deployment.ts --stack-name MyStack --region ap-east-1

# Using environment variables
STACK_NAME=MyStack AWS_REGION=ap-east-1 npm run test:validate
```

### Test Configuration

#### Environment Variables

- `SKIP_INTEGRATION_TESTS=true` - Skip integration tests entirely
- `SKIP_CLEANUP=true` - Don't destroy resources after integration tests
- `AWS_REGION` - AWS region for integration tests (default: ap-east-1)
- `STACK_NAME` - Stack name for validation (default: CognitoDummyUsersStack)

#### Prerequisites for Integration Tests

- AWS CLI configured with valid credentials
- Sufficient AWS permissions for Cognito and CloudFormation operations
- `ts-node` installed for TypeScript test execution

### Test Output

Tests provide detailed output including:
- ✅ Passed validations with details
- ❌ Failed validations with error information
- 📊 Test summary with pass/fail counts
- ⏱️ Execution time and performance metrics

### Continuous Integration

For CI/CD pipelines, use:

```bash
# Run tests suitable for CI (with proper error handling)
npm run test:unit  # Always safe to run

# For integration tests in CI (ensure cleanup)
SKIP_CLEANUP=false npm run test:integration

# Skip integration tests in CI if no AWS access
SKIP_INTEGRATION_TESTS=true npm run test:all
```

## Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch for changes and recompile
- `npm run test` - Run unit tests
- `npm run test:unit` - Run only unit tests
- `npm run test:integration` - Run only integration tests
- `npm run test:all` - Run both unit and integration tests
- `npm run test:run` - Use advanced test runner script
- `npm run test:validate` - Validate existing deployment
- `npm run integration-test` - Run shell-based integration tests
- `npm run deploy` - Deploy the CDK stack
- `npm run destroy` - Destroy the CDK stack
- `npm run diff` - Show differences between deployed and local stack
- `npm run synth` - Synthesize CloudFormation template

## Testing User Authentication

After setting passwords, you can test user authentication using AWS CLI:

```bash
# Test user authentication
aws cognito-idp admin-initiate-auth \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --client-id <YOUR_CLIENT_ID> \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=keithlei,PASSWORD="TempPassword123!"
```

## Cleanup

To remove all resources:

```bash
npm run destroy
```

Or using CDK directly:
```bash
cdk destroy
```

**Warning**: This will permanently delete the User Pool and all users.

## Troubleshooting

### Common Issues

1. **CDK Bootstrap Required**
   ```
   Error: This stack uses assets, so the toolkit stack must be deployed
   ```
   **Solution**: Run `cdk bootstrap` in your target account/region

2. **Insufficient Permissions**
   ```
   Error: User is not authorized to perform: cognito-idp:CreateUserPool
   ```
   **Solution**: Ensure your AWS credentials have the necessary Cognito permissions

3. **User Already Exists**
   ```
   Error: User already exists
   ```
   **Solution**: The users might already exist from a previous deployment. Check the Cognito console or use `cdk destroy` first.

4. **Password Policy Violation**
   ```
   Error: Password does not conform to policy
   ```
   **Solution**: Ensure passwords meet the policy requirements (8+ chars, upper/lower/number/symbol)

### Useful AWS CLI Commands

```bash
# List User Pools
aws cognito-idp list-user-pools --max-results 10

# List users in a pool
aws cognito-idp list-users --user-pool-id <YOUR_USER_POOL_ID>

# Get user details
aws cognito-idp admin-get-user \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --username keithlei

# Reset user password
aws cognito-idp admin-reset-user-password \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --username keithlei
```

## Security Considerations

- This project is intended for development/testing environments only
- The `RemovalPolicy.DESTROY` is set for easy cleanup - be cautious in production
- Users are created via Lambda function with suppressed welcome emails
- Email addresses are automatically verified
- MFA is disabled for simplicity
- Lambda function has minimal IAM permissions (only Cognito user management)
- Users are automatically cleaned up when the stack is destroyed

## Project Structure

```
cognito-dummy-users/
├── bin/
│   └── cognito-dummy-users.ts           # CDK app entry point
├── lib/
│   ├── cognito-dummy-users-stack.ts     # Main stack definition
│   └── index.ts                         # Library exports
├── test/
│   ├── cognito-dummy-users.test.ts      # Unit tests
│   ├── cognito-dummy-users.integration.test.ts  # Integration tests
│   ├── validate-deployment.ts           # Deployment validation script
│   └── setup.ts                         # Test configuration
├── scripts/
│   ├── integration-test.sh              # Shell-based integration tests
│   ├── run-tests.sh                     # Comprehensive test runner
│   └── set-passwords.sh                 # Password management script
├── package.json                         # Dependencies and scripts
├── tsconfig.json                        # TypeScript configuration
├── jest.config.js                       # Jest test configuration
├── cdk.json                            # CDK configuration
└── README.md                           # This file
```

## Contributing

1. Make changes to the TypeScript files in `lib/` or `bin/`
2. Run `npm run build` to compile
3. Test with `npm run test`
4. Deploy with `npm run deploy`

## License

This project is for educational and development purposes.