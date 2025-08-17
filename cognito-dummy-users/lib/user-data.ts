import { DummyUser } from './types';

/**
 * Predefined dummy users for Cognito User Pool
 * These users will be created when the CDK stack is deployed
 */
export const DUMMY_USERS: DummyUser[] = [
  {
    username: 'keithlei',
    email: 'keithlei01@gmail.com',
    firstName: 'Keith',
    lastName: 'Lei',
    temporaryPassword: 'TempPass123!'
  },
  {
    username: 'davidlei',
    email: 'davidlei812@gmail.com',
    firstName: 'David',
    lastName: 'Lei',
    temporaryPassword: 'TempPass456!'
  },
  {
    username: 'heatherlei',
    email: 'heatherlei719@gmail.com',
    firstName: 'Heather',
    lastName: 'Lei',
    temporaryPassword: 'TempPass789!'
  }
];