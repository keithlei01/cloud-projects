# Integration Testing Guide

This document describes the comprehensive integration testing suite for the Cognito Dummy Users CDK project.

## Overview

The integration testing suite validates the complete functionality of the CDK stack, including:

- Stack deployment and resource creation
- User creation in Cognito User Pool
- User authentication capabilities
- Stack destruction and cleanup verification

## Test Types

### 1. Shell-based Integration Tests (`scripts/integration-test.sh`)

Comprehensive bash script that:
- Deploys the CDK stack
- Validates stack outputs
- Tests user creation and attributes
- Tests user authentication (success and failure cases)
- Validates cleanup and resource destruction
- Provides detailed logging and error reporting

**Features:**
- Automatic CDK bootstrapping if needed
- Comprehensive authentication testing
- Cleanup verification
- Colored output and progress reporting
- Environment variable configuration

### 2. Jest-based Integration Tests (`test/cognito-dummy-users.integration.test.ts`)

TypeScript Jest tests that:
- Deploy and manage test stacks
- Validate stack deployment and outputs
- Test user creation with correct attributes
- Test authentication with multiple scenarios
- Verify cleanup completion
- Provide detailed test reporting

**Features:**
- Automatic stack lifecycle management
- Comprehensive user attribute validation
- Multiple authentication scenarios
- Post-cleanup verification
- Configurable test timeouts

### 3. Validation Tests (`test/validate-deployment.ts`)

Standalone validation script that:
- Validates existing deployed stacks
- Checks User Pool accessibility
- Verifies user existence and attributes
- Can be run independently of deployment

## Running Tests

### Quick Start

```bash
# Run all integration tests
npm run test:integration:full

# Run only Jest-based tests
npm run test:integration:jest

# Run only shell-based tests
npm run test:integration:shell

# Run tests in parallel (faster)
npm run test:integration:parallel

# Run validation only (requires existing stack)
npm run test:validate
```

### Advanced Usage

```bash
# Run with custom configuration
CLEANUP=false DEBUG=1 npm run test:integration:full

# Run shell tests without cleanup
CLEANUP=false ./scripts/integration-test.sh

# Run Jest tests with custom timeout
JEST_TIMEOUT=900000 npm run test:integration

# Skip integration tests entirely
SKIP_INTEGRATION_TESTS=true npm test
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CLEANUP` | Whether to cleanup resources after tests | `true` |
| `DEBUG` | Enable debug output | `false` |
| `PARALLEL` | Run tests in parallel | `false` |
| `SKIP_INTEGRATION_TESTS` | Skip integration tests entirely | `false` |
| `SKIP_CLEANUP` | Skip cleanup in Jest tests | `false` |
| `AWS_REGION` | AWS region for testing | `ap-east-1` |
| `AWS_PROFILE` | AWS profile to use | (default) |

## Test Scenarios

### 1. Stack Deployment Validation

- ✅ Stack deploys successfully
- ✅ All required outputs are present
- ✅ Stack status is CREATE_COMPLETE or UPDATE_COMPLETE
- ✅ Resources are created with correct configuration

### 2. User Creation Validation

- ✅ Exactly 3 users are created
- ✅ Users have correct usernames (keithlei, davidlei, heatherlei)
- ✅ Users have correct email addresses
- ✅ Users have correct first and last names
- ✅ Email verification is set to true
- ✅ Email formats are valid

### 3. Authentication Validation

- ✅ Users can have passwords set
- ✅ Users can authenticate with correct credentials
- ✅ Authentication returns all required tokens (access, ID, refresh)
- ✅ Authentication fails with incorrect password
- ✅ Authentication fails with non-existent user
- ✅ Multiple users can authenticate simultaneously

### 4. Cleanup Validation

- ✅ Resources exist before cleanup
- ✅ Stack can be destroyed without errors
- ✅ User Pool becomes inaccessible after cleanup
- ✅ Stack is no longer found after cleanup
- ✅ Local files are cleaned up

## Test Architecture

### Shell Tests Flow

```
Prerequisites Check → Build Project → Deploy Stack → Extract Outputs → 
Validate Stack → Validate Users → Test Authentication → Cleanup Verification → 
Destroy Stack → Verify Cleanup
```

### Jest Tests Flow

```
Setup (beforeAll) → Deploy Stack → Extract Outputs → 
Run Test Suites → Cleanup (afterAll) → Verify Cleanup
```

### Test Isolation

- Each test run uses a unique stack name with timestamp
- Tests can run in parallel without conflicts
- Cleanup is automatic unless explicitly disabled
- Failed tests don't leave orphaned resources

## Troubleshooting

### Common Issues

1. **AWS Credentials Not Configured**
   ```bash
   aws configure
   # or
   export AWS_ACCESS_KEY_ID=your_key
   export AWS_SECRET_ACCESS_KEY=your_secret
   ```

2. **CDK Not Bootstrapped**
   The integration tests will automatically bootstrap CDK if needed, but you can also do it manually:
   ```bash
   npx cdk bootstrap aws://ACCOUNT-NUMBER/REGION
   ```
   
   Note: The integration tests include automatic bootstrap checking and will bootstrap the environment if required.

3. **Permission Errors**
   - Ensure your AWS user/role has permissions for:
     - CloudFormation (full access)
     - Cognito (full access)
     - IAM (for CDK roles)

4. **Timeout Issues**
   - Increase timeout with `JEST_TIMEOUT` environment variable
   - Check AWS region latency
   - Verify network connectivity

5. **Cleanup Issues**
   - Manual cleanup: `cdk destroy CognitoDummyUsersStack-IntegrationTest`
   - Check for stuck resources in CloudFormation console
   - Verify no manual changes were made to resources

### Debug Mode

Enable debug mode for detailed output:

```bash
DEBUG=1 npm run test:integration:full
```

This will show:
- All AWS CLI commands
- Detailed stack operations
- Authentication attempts
- Cleanup steps

### Test Logs

Test logs are available in:
- Console output (real-time)
- Jest test results
- CloudFormation events (AWS Console)

## Performance

### Typical Test Times

- Shell tests: 3-5 minutes
- Jest tests: 4-6 minutes
- Validation only: 30-60 seconds
- Parallel execution: 4-7 minutes (faster than sequential)

### Optimization Tips

1. Use parallel execution for faster results
2. Skip cleanup during development (`CLEANUP=false`)
3. Use validation tests for quick checks
4. Run specific test suites instead of all tests

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests
on: [push, pull_request]

jobs:
  integration-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-east-1
      - name: Install dependencies
        run: npm ci
        working-directory: cognito-dummy-users
      - name: Run integration tests
        run: npm run test:integration:full
        working-directory: cognito-dummy-users
```

### Local Development

For local development, you can:

1. Run tests without cleanup to inspect resources
2. Use validation tests to check existing deployments
3. Run specific test suites for faster feedback
4. Use debug mode to troubleshoot issues

## Contributing

When adding new tests:

1. Follow existing patterns for consistency
2. Add both shell and Jest versions when applicable
3. Include proper cleanup and error handling
4. Update this documentation
5. Test in both success and failure scenarios