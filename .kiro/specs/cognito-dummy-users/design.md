# Design Document

## Overview

This design outlines the implementation of a standalone AWS CDK TypeScript project that creates a Cognito User Pool with 3 dummy users. The project will be structured as an independent CDK application within the cloud-projects repository, following AWS CDK best practices and TypeScript conventions.

## Architecture

The solution consists of:

1. **CDK Project Structure**: A complete, self-contained CDK TypeScript project
2. **Cognito User Pool**: AWS Cognito User Pool with standard configuration
3. **User Creation**: Custom resource or CDK construct to create 3 dummy users
4. **Stack Organization**: Single stack containing all resources for simplicity

### High-Level Architecture

```
cloud-projects/
└── cognito-dummy-users/
    ├── package.json
    ├── tsconfig.json
    ├── cdk.json
    ├── lib/
    │   └── cognito-dummy-users-stack.ts
    ├── bin/
    │   └── cognito-dummy-users.ts
    └── README.md
```

## Components and Interfaces

### 1. CDK Application Entry Point
- **File**: `bin/cognito-dummy-users.ts`
- **Purpose**: CDK app initialization and stack instantiation
- **Dependencies**: AWS CDK core libraries

### 2. Main Stack
- **File**: `lib/cognito-dummy-users-stack.ts`
- **Purpose**: Contains all AWS resources (User Pool, Users)
- **Key Components**:
  - Cognito User Pool with basic configuration
  - User Pool Client for application access
  - Custom resource for user creation (using AWS Lambda)
  - Stack outputs for important resource identifiers

### 3. User Creation Lambda
- **Purpose**: Custom resource Lambda function to create users via AWS SDK
- **Trigger**: CloudFormation custom resource lifecycle events
- **Functionality**: 
  - Create users on stack creation
  - Clean up users on stack deletion
  - Handle updates appropriately

## Data Models

### User Data Structure
```typescript
interface DummyUser {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  temporaryPassword: string;
}
```

### Predefined Users
1. **User 1**: 
   - Username: `keithlei`
   - Email: `keithlei01@gmail.com`
   - Name: `Keith Lei`

2. **User 2**: 
   - Username: `davidlei`
   - Email: `davidlei812@gmail.com`
   - Name: `David Lei`

3. **User 3**: 
   - Username: `heatherlei`
   - Email: `heatherlei719@gmail.com`
   - Name: `Heather Lei`

### Cognito User Pool Configuration
- **Password Policy**: Standard complexity requirements
- **User Attributes**: Email (required), given_name, family_name
- **Sign-in Options**: Username and email
- **MFA**: Disabled for simplicity
- **Account Recovery**: Email-based

## Error Handling

### CDK Level
- Proper error handling in custom resource Lambda
- CloudFormation rollback on failure
- Clear error messages in stack outputs

### User Creation
- Handle duplicate user scenarios
- Validate email formats
- Retry logic for transient failures
- Proper cleanup on stack deletion

### Deployment
- Pre-deployment validation
- Clear error messages for common issues (permissions, regions)
- Rollback strategy for partial failures

## Testing Strategy

### Unit Tests
- Test stack synthesis
- Validate resource properties
- Test user data generation logic

### Integration Tests
- Deploy to test environment
- Verify user creation
- Test user login functionality
- Validate stack outputs

### Manual Testing
- Deploy stack manually
- Verify users in Cognito console
- Test user authentication
- Verify stack destruction

## Implementation Considerations

### Security
- Use least-privilege IAM roles for Lambda
- Secure temporary password generation
- No hardcoded secrets in code

### Maintainability
- Modular code structure
- Clear naming conventions
- Comprehensive documentation
- Configuration through CDK context or environment variables

### Scalability
- Design allows easy addition of more users
- Configurable user attributes
- Reusable patterns for other projects

## Dependencies

### CDK Libraries
- `@aws-cdk/core`
- `@aws-cdk/aws-cognito`
- `@aws-cdk/aws-lambda`
- `@aws-cdk/custom-resources`

### Runtime Dependencies
- `aws-sdk` (for Lambda function)
- TypeScript and related tooling

## Outputs

The stack will provide the following outputs:
- User Pool ID
- User Pool Client ID
- User Pool ARN
- Created usernames (for reference)
- User Pool domain (if configured)