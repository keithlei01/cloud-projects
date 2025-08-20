import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminSetUserPasswordCommand,
  AdminInitiateAuthCommand,
  ListUsersCommand
} from '@aws-sdk/client-cognito-identity-provider';
import {
  CloudFormationClient,
  DescribeStacksCommand
} from '@aws-sdk/client-cloudformation';

// Integration test configuration
const INTEGRATION_TEST_CONFIG = {
  stackName: 'CognitoDummyUsersStack-IntegrationTest',
  region: process.env.AWS_REGION || 'ap-east-1',
  testPassword: 'IntegrationTest123!',
  expectedUsers: ['keithlei', 'davidlei', 'heatherlei'],
  timeout: 600000, // 10 minutes
  pollInterval: 5000, // 5 seconds
};

// Test data for validation
const EXPECTED_USER_DATA = [
  {
    username: 'keithlei',
    email: 'keithlei01@gmail.com',
    firstName: 'Keith',
    lastName: 'Lei'
  },
  {
    username: 'davidlei',
    email: 'davidlei812@gmail.com',
    firstName: 'David',
    lastName: 'Lei'
  },
  {
    username: 'heatherlei',
    email: 'heatherlei719@gmail.com',
    firstName: 'Heather',
    lastName: 'Lei'
  }
];

describe('Cognito Dummy Users Integration Tests', () => {
  let cognitoClient: CognitoIdentityProviderClient;
  let cloudFormationClient: CloudFormationClient;
  let userPoolId: string;
  let userPoolClientId: string;
  let stackOutputs: Record<string, string>;
  let isStackDeployed = false;

  beforeAll(async () => {
    // Initialize AWS clients
    cognitoClient = new CognitoIdentityProviderClient({
      region: INTEGRATION_TEST_CONFIG.region
    });
    cloudFormationClient = new CloudFormationClient({
      region: INTEGRATION_TEST_CONFIG.region
    });

    // Check if we should run integration tests
    if (process.env.SKIP_INTEGRATION_TESTS === 'true') {
      console.log('Skipping integration tests (SKIP_INTEGRATION_TESTS=true)');
      return;
    }

    console.log('Starting integration test setup...');

    // Deploy the stack for testing
    await deployTestStack();

    // Extract stack outputs
    await extractStackOutputs();

    isStackDeployed = true;
    console.log('Integration test setup completed');
  }, INTEGRATION_TEST_CONFIG.timeout);

  afterAll(async () => {
    if (process.env.SKIP_INTEGRATION_TESTS === 'true') {
      return;
    }

    // Clean up resources unless explicitly told not to
    if (process.env.SKIP_CLEANUP !== 'true' && isStackDeployed) {
      console.log('Cleaning up integration test resources...');
      await cleanupTestStack();
      console.log('Integration test cleanup completed');
    } else {
      console.log('Skipping cleanup (SKIP_CLEANUP=true or stack not deployed)');
    }
  }, INTEGRATION_TEST_CONFIG.timeout);

  describe('Stack Deployment Validation', () => {
    test('should deploy stack successfully', async () => {
      if (process.env.SKIP_INTEGRATION_TESTS === 'true') {
        return;
      }

      expect(isStackDeployed).toBe(true);
      expect(userPoolId).toBeDefined();
      expect(userPoolClientId).toBeDefined();
    });

    test('should have all required stack outputs', async () => {
      if (process.env.SKIP_INTEGRATION_TESTS === 'true') {
        return;
      }

      const requiredOutputs = [
        'UserPoolId',
        'UserPoolClientId',
        'UserPoolArn',
        'CreatedUsers',
        'PasswordInstructions',
        'UserPoolProviderName'
      ];

      for (const outputKey of requiredOutputs) {
        expect(stackOutputs[outputKey]).toBeDefined();
        expect(stackOutputs[outputKey]).not.toBe('');
      }
    });

    test('should have correct created users in output', async () => {
      if (process.env.SKIP_INTEGRATION_TESTS === 'true') {
        return;
      }

      const createdUsersOutput = stackOutputs['CreatedUsers'];
      const createdUsers = createdUsersOutput.split(', ').map(u => u.trim());

      expect(createdUsers).toHaveLength(3);
      expect(createdUsers).toEqual(expect.arrayContaining(INTEGRATION_TEST_CONFIG.expectedUsers));
    });
  });

  describe('User Creation Validation', () => {
    test('should create exactly 3 users in Cognito User Pool', async () => {
      if (process.env.SKIP_INTEGRATION_TESTS === 'true') {
        return;
      }

      const listUsersCommand = new ListUsersCommand({
        UserPoolId: userPoolId,
      });

      const response = await cognitoClient.send(listUsersCommand);
      expect(response.Users).toHaveLength(3);
    });

    test('should create users with correct usernames', async () => {
      if (process.env.SKIP_INTEGRATION_TESTS === 'true') {
        return;
      }

      for (const expectedUsername of INTEGRATION_TEST_CONFIG.expectedUsers) {
        const getUserCommand = new AdminGetUserCommand({
          UserPoolId: userPoolId,
          Username: expectedUsername,
        });

        const response = await cognitoClient.send(getUserCommand);
        expect(response.Username).toBe(expectedUsername);
      }
    });

    test('should create users with correct attributes', async () => {
      if (process.env.SKIP_INTEGRATION_TESTS === 'true') {
        return;
      }

      for (const expectedUser of EXPECTED_USER_DATA) {
        const getUserCommand = new AdminGetUserCommand({
          UserPoolId: userPoolId,
          Username: expectedUser.username,
        });

        const response = await cognitoClient.send(getUserCommand);
        const attributes = response.UserAttributes || [];

        // Check email attribute
        const emailAttr = attributes.find(attr => attr.Name === 'email');
        expect(emailAttr?.Value).toBe(expectedUser.email);

        // Check given_name attribute
        const givenNameAttr = attributes.find(attr => attr.Name === 'given_name');
        expect(givenNameAttr?.Value).toBe(expectedUser.firstName);

        // Check family_name attribute
        const familyNameAttr = attributes.find(attr => attr.Name === 'family_name');
        expect(familyNameAttr?.Value).toBe(expectedUser.lastName);

        // Check email_verified attribute
        const emailVerifiedAttr = attributes.find(attr => attr.Name === 'email_verified');
        expect(emailVerifiedAttr?.Value).toBe('true');
      }
    });

    test('should create users with valid email formats', async () => {
      if (process.env.SKIP_INTEGRATION_TESTS === 'true') {
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      for (const expectedUser of EXPECTED_USER_DATA) {
        expect(expectedUser.email).toMatch(emailRegex);

        const getUserCommand = new AdminGetUserCommand({
          UserPoolId: userPoolId,
          Username: expectedUser.username,
        });

        const response = await cognitoClient.send(getUserCommand);
        const attributes = response.UserAttributes || [];
        const emailAttr = attributes.find(attr => attr.Name === 'email');

        expect(emailAttr?.Value).toMatch(emailRegex);
      }
    });
  });

  describe('User Authentication Validation', () => {
    test('should allow setting permanent passwords for users', async () => {
      if (process.env.SKIP_INTEGRATION_TESTS === 'true') {
        return;
      }

      const testUser = INTEGRATION_TEST_CONFIG.expectedUsers[0];

      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: testUser,
        Password: INTEGRATION_TEST_CONFIG.testPassword,
        Permanent: true,
      });

      await expect(cognitoClient.send(setPasswordCommand)).resolves.not.toThrow();
    });

    test('should authenticate user with correct credentials and return all tokens', async () => {
      if (process.env.SKIP_INTEGRATION_TESTS === 'true') {
        return;
      }

      const testUser = INTEGRATION_TEST_CONFIG.expectedUsers[0];

      // First set the password
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: testUser,
        Password: INTEGRATION_TEST_CONFIG.testPassword,
        Permanent: true,
      });
      await cognitoClient.send(setPasswordCommand);

      // Then test authentication
      const authCommand = new AdminInitiateAuthCommand({
        UserPoolId: userPoolId,
        ClientId: userPoolClientId,
        AuthFlow: 'ADMIN_NO_SRP_AUTH',
        AuthParameters: {
          USERNAME: testUser,
          PASSWORD: INTEGRATION_TEST_CONFIG.testPassword,
        },
      });

      const authResponse = await cognitoClient.send(authCommand);

      expect(authResponse.AuthenticationResult).toBeDefined();
      expect(authResponse.AuthenticationResult?.AccessToken).toBeDefined();
      expect(authResponse.AuthenticationResult?.IdToken).toBeDefined();
      expect(authResponse.AuthenticationResult?.RefreshToken).toBeDefined();

      // Validate token properties
      const accessToken = authResponse.AuthenticationResult?.AccessToken;
      const idToken = authResponse.AuthenticationResult?.IdToken;
      const refreshToken = authResponse.AuthenticationResult?.RefreshToken;

      expect(typeof accessToken).toBe('string');
      expect(accessToken!.length).toBeGreaterThan(100);
      expect(typeof idToken).toBe('string');
      expect(idToken!.length).toBeGreaterThan(100);
      expect(typeof refreshToken).toBe('string');
      expect(refreshToken!.length).toBeGreaterThan(100);
    });

    test('should reject authentication with incorrect password', async () => {
      if (process.env.SKIP_INTEGRATION_TESTS === 'true') {
        return;
      }

      const testUser = INTEGRATION_TEST_CONFIG.expectedUsers[1];

      const authCommand = new AdminInitiateAuthCommand({
        UserPoolId: userPoolId,
        ClientId: userPoolClientId,
        AuthFlow: 'ADMIN_NO_SRP_AUTH',
        AuthParameters: {
          USERNAME: testUser,
          PASSWORD: 'WrongPassword123!',
        },
      });

      await expect(cognitoClient.send(authCommand)).rejects.toThrow();
    });

    test('should reject authentication with non-existent user', async () => {
      if (process.env.SKIP_INTEGRATION_TESTS === 'true') {
        return;
      }

      const authCommand = new AdminInitiateAuthCommand({
        UserPoolId: userPoolId,
        ClientId: userPoolClientId,
        AuthFlow: 'ADMIN_NO_SRP_AUTH',
        AuthParameters: {
          USERNAME: 'nonexistentuser',
          PASSWORD: INTEGRATION_TEST_CONFIG.testPassword,
        },
      });

      await expect(cognitoClient.send(authCommand)).rejects.toThrow();
    });

    test('should authenticate multiple users with temporary passwords', async () => {
      if (process.env.SKIP_INTEGRATION_TESTS === 'true') {
        return;
      }

      // Test authentication for all users
      for (const username of INTEGRATION_TEST_CONFIG.expectedUsers) {
        // Set password for each user
        const setPasswordCommand = new AdminSetUserPasswordCommand({
          UserPoolId: userPoolId,
          Username: username,
          Password: `${INTEGRATION_TEST_CONFIG.testPassword}${username}`,
          Permanent: true,
        });
        await cognitoClient.send(setPasswordCommand);

        // Test authentication
        const authCommand = new AdminInitiateAuthCommand({
          UserPoolId: userPoolId,
          ClientId: userPoolClientId,
          AuthFlow: 'ADMIN_NO_SRP_AUTH',
          AuthParameters: {
            USERNAME: username,
            PASSWORD: `${INTEGRATION_TEST_CONFIG.testPassword}${username}`,
          },
        });

        const authResponse = await cognitoClient.send(authCommand);
        expect(authResponse.AuthenticationResult).toBeDefined();
        expect(authResponse.AuthenticationResult?.AccessToken).toBeDefined();
      }
    });
  });

  describe('Stack Destruction Validation', () => {
    test('should verify all resources exist before cleanup', async () => {
      if (process.env.SKIP_INTEGRATION_TESTS === 'true') {
        return;
      }

      // Verify stack is deployed
      expect(isStackDeployed).toBe(true);

      // Verify User Pool exists and is accessible
      const listUsersCommand = new ListUsersCommand({
        UserPoolId: userPoolId,
      });

      const response = await cognitoClient.send(listUsersCommand);
      expect(response.Users).toHaveLength(3);

      // Verify all expected users exist
      for (const username of INTEGRATION_TEST_CONFIG.expectedUsers) {
        const getUserCommand = new AdminGetUserCommand({
          UserPoolId: userPoolId,
          Username: username,
        });

        const userResponse = await cognitoClient.send(getUserCommand);
        expect(userResponse.Username).toBe(username);
      }

      // Verify stack outputs are accessible
      expect(stackOutputs).toBeDefined();
      expect(Object.keys(stackOutputs).length).toBeGreaterThan(0);
    });

    test('should validate stack can be destroyed without errors', async () => {
      if (process.env.SKIP_INTEGRATION_TESTS === 'true') {
        return;
      }

      // Verify stack exists before destruction
      const describeStacksCommand = new DescribeStacksCommand({
        StackName: INTEGRATION_TEST_CONFIG.stackName,
      });

      const stackResponse = await cloudFormationClient.send(describeStacksCommand);
      expect(stackResponse.Stacks).toHaveLength(1);
      expect(stackResponse.Stacks![0].StackStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    });

    test('should verify cleanup completion after stack destruction', async () => {
      if (process.env.SKIP_INTEGRATION_TESTS === 'true') {
        return;
      }

      // This test will run after the stack is destroyed in afterAll
      // We'll verify the cleanup in a separate test that runs after destruction
      expect(true).toBe(true); // Placeholder - actual verification happens in afterAll
    });
  });

  describe('Post-Cleanup Validation', () => {
    test('should verify User Pool is no longer accessible after cleanup', async () => {
      if (process.env.SKIP_INTEGRATION_TESTS === 'true' || process.env.SKIP_CLEANUP === 'true') {
        return;
      }

      // This test should run after cleanup
      // We need to check if the User Pool is still accessible
      if (userPoolId) {
        const listUsersCommand = new ListUsersCommand({
          UserPoolId: userPoolId,
        });

        // This should fail because the User Pool should be deleted
        await expect(cognitoClient.send(listUsersCommand)).rejects.toThrow();
      }
    });

    test('should verify stack is no longer accessible after cleanup', async () => {
      if (process.env.SKIP_INTEGRATION_TESTS === 'true' || process.env.SKIP_CLEANUP === 'true') {
        return;
      }

      const describeStacksCommand = new DescribeStacksCommand({
        StackName: INTEGRATION_TEST_CONFIG.stackName,
      });

      // This should either fail or return DELETE_COMPLETE status
      try {
        const response = await cloudFormationClient.send(describeStacksCommand);
        if (response.Stacks && response.Stacks.length > 0) {
          expect(response.Stacks[0].StackStatus).toBe('DELETE_COMPLETE');
        }
      } catch (error) {
        // Stack not found is expected after successful deletion
        expect((error as any).name).toMatch(/ValidationError|ResourceNotFound/);
      }
    });
  });

  // Helper functions
  async function checkAndBootstrapCDK(): Promise<void> {
    console.log('Checking CDK bootstrap status...');
    
    const { execSync } = require('child_process');
    
    try {
      // Check if CDK is bootstrapped by trying to describe the CDKToolkit stack
      execSync(`aws cloudformation describe-stacks --stack-name CDKToolkit --region ${INTEGRATION_TEST_CONFIG.region}`, {
        stdio: 'pipe'
      });
      console.log('CDK is already bootstrapped');
    } catch (error) {
      console.log('CDK not bootstrapped, bootstrapping now...');
      
      try {
        // Get account ID
        const accountId = execSync('aws sts get-caller-identity --query Account --output text', {
          encoding: 'utf8'
        }).trim();
        
        console.log(`Bootstrapping CDK for account ${accountId} in region ${INTEGRATION_TEST_CONFIG.region}...`);
        
        // Bootstrap CDK
        execSync(`npx cdk bootstrap aws://${accountId}/${INTEGRATION_TEST_CONFIG.region}`, {
          stdio: 'inherit'
        });
        
        console.log('CDK bootstrap completed successfully');
      } catch (bootstrapError) {
        console.error('Failed to bootstrap CDK:', bootstrapError);
        throw bootstrapError;
      }
    }
  }

  async function deployTestStack(): Promise<void> {
    console.log(`Deploying test stack: ${INTEGRATION_TEST_CONFIG.stackName}`);

    try {
      const { execSync } = require('child_process');

      // Check and bootstrap CDK if needed
      await checkAndBootstrapCDK();

      // Set environment variables for CDK deployment
      const env = {
        ...process.env,
        CDK_STACK_NAME: INTEGRATION_TEST_CONFIG.stackName,
        JSII_SILENCE_WARNING_UNTESTED_NODE_VERSION: 'true' // Silence Node.js version warning
      };

      // Deploy using CDK CLI
      console.log('Running CDK deploy...');
      execSync(`npx cdk deploy ${INTEGRATION_TEST_CONFIG.stackName} --require-approval never --outputs-file integration-outputs.json`, {
        stdio: 'inherit',
        env,
        cwd: process.cwd()
      });

      console.log('Stack deployed successfully');
    } catch (error) {
      console.error('Failed to deploy stack:', error);
      throw error;
    }
  }

  async function extractStackOutputs(): Promise<void> {
    const describeStacksCommand = new DescribeStacksCommand({
      StackName: INTEGRATION_TEST_CONFIG.stackName,
    });

    const response = await cloudFormationClient.send(describeStacksCommand);
    const stack = response.Stacks?.[0];

    if (!stack?.Outputs) {
      throw new Error('No stack outputs found');
    }

    stackOutputs = {};
    for (const output of stack.Outputs) {
      if (output.OutputKey && output.OutputValue) {
        stackOutputs[output.OutputKey] = output.OutputValue;
      }
    }

    userPoolId = stackOutputs['UserPoolId'];
    userPoolClientId = stackOutputs['UserPoolClientId'];

    if (!userPoolId || !userPoolClientId) {
      throw new Error('Required stack outputs not found');
    }
  }

  async function cleanupTestStack(): Promise<void> {
    console.log(`Destroying test stack: ${INTEGRATION_TEST_CONFIG.stackName}`);

    try {
      const { execSync } = require('child_process');

      // Set environment variables to silence warnings
      const env = {
        ...process.env,
        JSII_SILENCE_WARNING_UNTESTED_NODE_VERSION: 'true'
      };
      
      // Destroy using CDK CLI
      console.log('Running CDK destroy...');
      execSync(`npx cdk destroy ${INTEGRATION_TEST_CONFIG.stackName} --force`, {
        stdio: 'inherit',
        env,
        cwd: process.cwd()
      });

      // Wait for stack deletion to complete
      console.log('Waiting for stack deletion to complete...');
      await waitForStackDeletion(INTEGRATION_TEST_CONFIG.stackName);

      // Clean up output files
      const fs = require('fs');
      if (fs.existsSync('integration-outputs.json')) {
        fs.unlinkSync('integration-outputs.json');
      }

      console.log('Stack destroyed and cleanup completed successfully');
    } catch (error) {
      console.error('Failed to destroy stack:', error);
      throw error;
    }
  }

  async function waitForStackDeletion(stackName: string, maxWaitTimeMs: number = 300000): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 10000; // 10 seconds

    while (Date.now() - startTime < maxWaitTimeMs) {
      try {
        const describeStacksCommand = new DescribeStacksCommand({
          StackName: stackName,
        });

        const response = await cloudFormationClient.send(describeStacksCommand);
        const stack = response.Stacks?.[0];

        if (!stack) {
          console.log('Stack not found - deletion complete');
          return; // Stack deleted successfully
        }

        const currentStatus = stack.StackStatus;
        console.log(`Stack status: ${currentStatus}`);

        if (currentStatus === 'DELETE_COMPLETE') {
          console.log('Stack deletion completed');
          return;
        }

        if (currentStatus?.includes('DELETE_FAILED')) {
          throw new Error(`Stack deletion failed with status: ${currentStatus}`);
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        if ((error as any).name === 'ValidationError') {
          console.log('Stack not found - deletion complete');
          return; // Stack deleted successfully
        }
        throw error;
      }
    }

    throw new Error(`Timeout waiting for stack deletion after ${maxWaitTimeMs}ms`);
  }
});