import { 
  CognitoIdentityProviderClient, 
  AdminCreateUserCommand, 
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  UserNotFoundException,
  UsernameExistsException
} from '@aws-sdk/client-cognito-identity-provider';
import { 
  CloudFormationCustomResourceEvent, 
  CloudFormationCustomResourceResponse, 
  CloudFormationCustomResourceCreateEvent,
  CloudFormationCustomResourceUpdateEvent,
  CloudFormationCustomResourceDeleteEvent,
  Context 
} from 'aws-lambda';

interface UserCreationProperties {
  UserPoolId: string;
  Users: Array<{
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    temporaryPassword: string;
  }>;
}

interface UserCreationResponse {
  CreatedUsers: string[];
  UserPoolId: string;
}

/**
 * Lambda function handler for Cognito user creation custom resource
 * Handles CREATE, UPDATE, and DELETE CloudFormation events
 */
export const handler = async (
  event: CloudFormationCustomResourceEvent,
  context: Context
): Promise<CloudFormationCustomResourceResponse> => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION || 'us-east-1'
  });

  const properties = event.ResourceProperties as unknown as UserCreationProperties;
  const { UserPoolId, Users } = properties;

  try {
    switch (event.RequestType) {
      case 'Create':
        return await handleCreate(cognitoClient, UserPoolId, Users, event as CloudFormationCustomResourceCreateEvent, context);
      case 'Update':
        return await handleUpdate(cognitoClient, UserPoolId, Users, event as CloudFormationCustomResourceUpdateEvent, context);
      case 'Delete':
        return await handleDelete(cognitoClient, UserPoolId, Users, event as CloudFormationCustomResourceDeleteEvent, context);
      default:
        throw new Error(`Unknown request type: ${(event as any).RequestType}`);
    }
  } catch (error) {
    console.error('Error in Lambda handler:', error);
    
    // Return failure response to CloudFormation
    return {
      Status: 'FAILED',
      Reason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      PhysicalResourceId: (event as any).PhysicalResourceId || context.logStreamName,
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
    };
  }
};

/**
 * Handle CREATE event - create all dummy users
 */
async function handleCreate(
  cognitoClient: CognitoIdentityProviderClient,
  userPoolId: string,
  users: UserCreationProperties['Users'],
  event: CloudFormationCustomResourceCreateEvent,
  context: Context
): Promise<CloudFormationCustomResourceResponse> {
  console.log(`Creating ${users.length} users in User Pool: ${userPoolId}`);
  
  const createdUsers: string[] = [];
  const errors: string[] = [];

  for (const user of users) {
    try {
      await createUserWithRetry(cognitoClient, userPoolId, user);
      createdUsers.push(user.username);
      console.log(`Successfully created user: ${user.username}`);
    } catch (error) {
      const errorMessage = `Failed to create user ${user.username}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMessage);
      errors.push(errorMessage);
    }
  }

  // If any users failed to create, we still return success but log the errors
  // This allows partial success scenarios
  if (errors.length > 0) {
    console.warn(`Some users failed to create: ${errors.join(', ')}`);
  }

  const responseData: UserCreationResponse = {
    CreatedUsers: createdUsers,
    UserPoolId: userPoolId
  };

  return {
    Status: 'SUCCESS',
    PhysicalResourceId: `cognito-users-${userPoolId}`,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: responseData,
  };
}

/**
 * Handle UPDATE event - recreate users if properties changed
 */
async function handleUpdate(
  cognitoClient: CognitoIdentityProviderClient,
  userPoolId: string,
  users: UserCreationProperties['Users'],
  event: CloudFormationCustomResourceUpdateEvent,
  context: Context
): Promise<CloudFormationCustomResourceResponse> {
  console.log(`Updating users in User Pool: ${userPoolId}`);
  
  // For updates, we'll delete existing users and recreate them
  // This ensures any changes to user attributes are applied
  const oldProperties = event.OldResourceProperties as unknown as UserCreationProperties;
  
  if (oldProperties && oldProperties.Users) {
    // Delete old users first
    await handleDelete(cognitoClient, oldProperties.UserPoolId, oldProperties.Users, event as any, context);
  }
  
  // Create new users
  return await handleCreate(cognitoClient, userPoolId, users, event as any, context);
}

/**
 * Handle DELETE event - remove all dummy users
 */
async function handleDelete(
  cognitoClient: CognitoIdentityProviderClient,
  userPoolId: string,
  users: UserCreationProperties['Users'],
  event: CloudFormationCustomResourceDeleteEvent,
  context: Context
): Promise<CloudFormationCustomResourceResponse> {
  console.log(`Deleting ${users.length} users from User Pool: ${userPoolId}`);
  
  const deletedUsers: string[] = [];
  const errors: string[] = [];

  for (const user of users) {
    try {
      await deleteUserWithRetry(cognitoClient, userPoolId, user.username);
      deletedUsers.push(user.username);
      console.log(`Successfully deleted user: ${user.username}`);
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        // User doesn't exist, which is fine for deletion
        console.log(`User ${user.username} not found (already deleted or never existed)`);
        deletedUsers.push(user.username);
      } else {
        const errorMessage = `Failed to delete user ${user.username}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMessage);
        errors.push(errorMessage);
      }
    }
  }

  // For deletion, we're more lenient with errors since the goal is cleanup
  if (errors.length > 0) {
    console.warn(`Some users failed to delete: ${errors.join(', ')}`);
  }

  return {
    Status: 'SUCCESS',
    PhysicalResourceId: event.PhysicalResourceId || `cognito-users-${userPoolId}`,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: {
      DeletedUsers: deletedUsers,
      UserPoolId: userPoolId
    },
  };
}

/**
 * Create a user with retry logic for handling transient failures
 */
async function createUserWithRetry(
  cognitoClient: CognitoIdentityProviderClient,
  userPoolId: string,
  user: UserCreationProperties['Users'][0],
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check if user already exists
      try {
        await cognitoClient.send(new AdminGetUserCommand({
          UserPoolId: userPoolId,
          Username: user.username
        }));
        
        // User exists, log and return (don't treat as error)
        console.log(`User ${user.username} already exists, skipping creation`);
        return;
      } catch (error) {
        if (!(error instanceof UserNotFoundException)) {
          // Some other error occurred while checking user existence
          throw error;
        }
        // User doesn't exist, proceed with creation
      }

      // Create the user
      const createUserCommand = new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: user.username,
        UserAttributes: [
          {
            Name: 'email',
            Value: user.email
          },
          {
            Name: 'given_name',
            Value: user.firstName
          },
          {
            Name: 'family_name',
            Value: user.lastName
          },
          {
            Name: 'email_verified',
            Value: 'true'
          }
        ],
        TemporaryPassword: user.temporaryPassword,
        MessageAction: 'SUPPRESS', // Don't send welcome email
        ForceAliasCreation: false
      });

      await cognitoClient.send(createUserCommand);
      console.log(`User ${user.username} created successfully on attempt ${attempt}`);
      return;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (error instanceof UsernameExistsException) {
        // User already exists, this is not an error for our use case
        console.log(`User ${user.username} already exists (UsernameExistsException)`);
        return;
      }

      console.warn(`Attempt ${attempt} failed for user ${user.username}:`, lastError.message);
      
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw new Error(`Failed to create user ${user.username} after ${maxRetries} attempts. Last error: ${lastError?.message}`);
}

/**
 * Delete a user with retry logic for handling transient failures
 */
async function deleteUserWithRetry(
  cognitoClient: CognitoIdentityProviderClient,
  userPoolId: string,
  username: string,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const deleteUserCommand = new AdminDeleteUserCommand({
        UserPoolId: userPoolId,
        Username: username
      });

      await cognitoClient.send(deleteUserCommand);
      console.log(`User ${username} deleted successfully on attempt ${attempt}`);
      return;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (error instanceof UserNotFoundException) {
        // User doesn't exist, which is fine for deletion
        console.log(`User ${username} not found (UserNotFoundException)`);
        return;
      }

      console.warn(`Attempt ${attempt} failed for deleting user ${username}:`, lastError.message);
      
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw new Error(`Failed to delete user ${username} after ${maxRetries} attempts. Last error: ${lastError?.message}`);
}

/**
 * Sleep utility function for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}