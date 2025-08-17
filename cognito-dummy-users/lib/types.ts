/**
 * TypeScript interfaces and types for Cognito dummy users
 */

export interface DummyUser {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  temporaryPassword: string;
}

export interface UserAttributes {
  email: string;
  given_name: string;
  family_name: string;
}

export interface CognitoUserCreationParams {
  userPoolId: string;
  username: string;
  userAttributes: UserAttributes;
  temporaryPassword: string;
  messageAction?: 'SUPPRESS' | 'RESEND';
}