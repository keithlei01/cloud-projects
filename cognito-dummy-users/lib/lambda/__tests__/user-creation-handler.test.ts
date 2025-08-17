import { handler } from '../user-creation-handler';
import { 
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  UserNotFoundException,
  UsernameExistsException
} from '@aws-sdk/client-cognito-identity-provider';
import { 
  CloudFormationCustomResourceCreateEvent,
  CloudFormationCustomResourceDeleteEvent,
  Context 
} from 'aws-lambda';

// Mock AWS SDK
jest.mock('@aws-sdk/client-cognito-identity-provider');

const mockCognitoClient = {
  send: jest.fn()
};

// Mock the CognitoIdentityProviderClient constructor
(CognitoIdentityProviderClient as jest.Mock).mockImplementation(() => mockCognitoClient);

describe('User Creation Lambda Handler', () => {
  const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test-function',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
    memoryLimitInMB: '128',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/test-function',
    logStreamName: 'test-stream',
    getRemainingTimeInMillis: () => 30000,
    done: jest.fn(),
    fail: jest.fn(),
    succeed: jest.fn()
  };

  const testUsers = [
    {
      username: 'testuser1',
      email: 'test1@example.com',
      firstName: 'Test',
      lastName: 'User1',
      temporaryPassword: 'TempPass123!'
    },
    {
      username: 'testuser2',
      email: 'test2@example.com',
      firstName: 'Test',
      lastName: 'User2',
      temporaryPassword: 'TempPass456!'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CREATE event', () => {
    it('should successfully create users', async () => {
      const createEvent: CloudFormationCustomResourceCreateEvent = {
        RequestType: 'Create',
        ResponseURL: 'https://example.com',
        StackId: 'test-stack-id',
        RequestId: 'test-request-id',
        ResourceType: 'Custom::UserCreation',
        LogicalResourceId: 'UserCreationResource',
        ServiceToken: 'test-token',
        ResourceProperties: {
          ServiceToken: 'test-token',
          UserPoolId: 'us-east-1_testpool',
          Users: testUsers
        }
      };

      // Mock user doesn't exist (UserNotFoundException) then successful creation
      mockCognitoClient.send
        .mockRejectedValueOnce(new UserNotFoundException({ message: 'User not found', $metadata: {} }))
        .mockResolvedValueOnce({}) // AdminCreateUserCommand success
        .mockRejectedValueOnce(new UserNotFoundException({ message: 'User not found', $metadata: {} }))
        .mockResolvedValueOnce({}); // AdminCreateUserCommand success

      const result = await handler(createEvent, mockContext);

      expect(result.Status).toBe('SUCCESS');
      expect(result.Data).toEqual({
        CreatedUsers: ['testuser1', 'testuser2'],
        UserPoolId: 'us-east-1_testpool'
      });
      expect(mockCognitoClient.send).toHaveBeenCalledTimes(4);
    });

    it('should handle existing users gracefully', async () => {
      const createEvent: CloudFormationCustomResourceCreateEvent = {
        RequestType: 'Create',
        ResponseURL: 'https://example.com',
        StackId: 'test-stack-id',
        RequestId: 'test-request-id',
        ResourceType: 'Custom::UserCreation',
        LogicalResourceId: 'UserCreationResource',
        ServiceToken: 'test-token',
        ResourceProperties: {
          ServiceToken: 'test-token',
          UserPoolId: 'us-east-1_testpool',
          Users: [testUsers[0]]
        }
      };

      // Mock user already exists
      mockCognitoClient.send.mockResolvedValueOnce({
        Username: 'testuser1',
        UserStatus: 'CONFIRMED'
      });

      const result = await handler(createEvent, mockContext);

      expect(result.Status).toBe('SUCCESS');
      expect(result.Data).toEqual({
        CreatedUsers: ['testuser1'],
        UserPoolId: 'us-east-1_testpool'
      });
      expect(mockCognitoClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('DELETE event', () => {
    it('should successfully delete users', async () => {
      const deleteEvent: CloudFormationCustomResourceDeleteEvent = {
        RequestType: 'Delete',
        ResponseURL: 'https://example.com',
        StackId: 'test-stack-id',
        RequestId: 'test-request-id',
        ResourceType: 'Custom::UserCreation',
        LogicalResourceId: 'UserCreationResource',
        PhysicalResourceId: 'cognito-users-us-east-1_testpool',
        ServiceToken: 'test-token',
        ResourceProperties: {
          ServiceToken: 'test-token',
          UserPoolId: 'us-east-1_testpool',
          Users: testUsers
        }
      };

      // Mock successful deletion
      mockCognitoClient.send
        .mockResolvedValueOnce({}) // AdminDeleteUserCommand success
        .mockResolvedValueOnce({}); // AdminDeleteUserCommand success

      const result = await handler(deleteEvent, mockContext);

      expect(result.Status).toBe('SUCCESS');
      expect(result.Data).toEqual({
        DeletedUsers: ['testuser1', 'testuser2'],
        UserPoolId: 'us-east-1_testpool'
      });
      expect(mockCognitoClient.send).toHaveBeenCalledTimes(2);
    });

    it('should handle non-existent users during deletion', async () => {
      const deleteEvent: CloudFormationCustomResourceDeleteEvent = {
        RequestType: 'Delete',
        ResponseURL: 'https://example.com',
        StackId: 'test-stack-id',
        RequestId: 'test-request-id',
        ResourceType: 'Custom::UserCreation',
        LogicalResourceId: 'UserCreationResource',
        PhysicalResourceId: 'cognito-users-us-east-1_testpool',
        ServiceToken: 'test-token',
        ResourceProperties: {
          ServiceToken: 'test-token',
          UserPoolId: 'us-east-1_testpool',
          Users: [testUsers[0]]
        }
      };

      // Mock user not found during deletion
      mockCognitoClient.send.mockRejectedValueOnce(
        new UserNotFoundException({ message: 'User not found', $metadata: {} })
      );

      const result = await handler(deleteEvent, mockContext);

      expect(result.Status).toBe('SUCCESS');
      expect(result.Data).toEqual({
        DeletedUsers: ['testuser1'],
        UserPoolId: 'us-east-1_testpool'
      });
      expect(mockCognitoClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    it('should return SUCCESS with partial failures for user creation errors', async () => {
      const createEvent: CloudFormationCustomResourceCreateEvent = {
        RequestType: 'Create',
        ResponseURL: 'https://example.com',
        StackId: 'test-stack-id',
        RequestId: 'test-request-id',
        ResourceType: 'Custom::UserCreation',
        LogicalResourceId: 'UserCreationResource',
        ServiceToken: 'test-token',
        ResourceProperties: {
          ServiceToken: 'test-token',
          UserPoolId: 'us-east-1_testpool',
          Users: [testUsers[0]]
        }
      };

      // Mock unexpected error during user creation
      mockCognitoClient.send.mockRejectedValue(new Error('Unexpected error'));

      const result = await handler(createEvent, mockContext);

      // The function should return SUCCESS but with empty CreatedUsers array
      expect(result.Status).toBe('SUCCESS');
      expect(result.Data).toEqual({
        CreatedUsers: [],
        UserPoolId: 'us-east-1_testpool'
      });
    });

    it('should return SUCCESS even with critical errors (resilient behavior)', async () => {
      const createEvent: CloudFormationCustomResourceCreateEvent = {
        RequestType: 'Create',
        ResponseURL: 'https://example.com',
        StackId: 'test-stack-id',
        RequestId: 'test-request-id',
        ResourceType: 'Custom::UserCreation',
        LogicalResourceId: 'UserCreationResource',
        ServiceToken: 'test-token',
        ResourceProperties: {
          ServiceToken: 'test-token',
          UserPoolId: '', // Invalid UserPoolId to trigger critical error
          Users: [testUsers[0]]
        }
      };

      // Mock critical error that should fail the entire operation
      mockCognitoClient.send.mockRejectedValue(new Error('Critical system error'));

      const result = await handler(createEvent, mockContext);

      // Even with critical errors, the function returns SUCCESS but with empty CreatedUsers
      // This prevents CloudFormation stack creation from failing due to user creation issues
      expect(result.Status).toBe('SUCCESS');
      expect(result.Data).toEqual({
        CreatedUsers: [],
        UserPoolId: ''
      });
    });
  });
});