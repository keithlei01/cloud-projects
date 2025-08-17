import { DummyUser, UserAttributes } from './types';

/**
 * Email validation using RFC 5322 compliant regex pattern
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

/**
 * Validates a username according to Cognito requirements
 * - Must be 1-128 characters
 * - Can contain alphanumeric characters, underscores, periods, and hyphens
 */
export function isValidUsername(username: string): boolean {
  if (!username || username.length < 1 || username.length > 128) {
    return false;
  }
  const usernameRegex = /^[a-zA-Z0-9._-]+$/;
  return usernameRegex.test(username);
}

/**
 * Validates a temporary password meets Cognito requirements
 * - At least 8 characters
 * - Contains uppercase, lowercase, number, and special character
 */
export function isValidTemporaryPassword(password: string): boolean {
  if (!password || password.length < 8) {
    return false;
  }
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  return hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
}

/**
 * Validates a name field (first name or last name)
 * - Must be 1-256 characters
 * - Can contain letters, spaces, apostrophes, and hyphens
 */
export function isValidName(name: string): boolean {
  if (!name || name.length < 1 || name.length > 256) {
    return false;
  }
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  return nameRegex.test(name);
}

/**
 * Validates a complete DummyUser object
 */
export function validateDummyUser(user: DummyUser): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!isValidUsername(user.username)) {
    errors.push(`Invalid username: ${user.username}`);
  }
  
  if (!isValidEmail(user.email)) {
    errors.push(`Invalid email: ${user.email}`);
  }
  
  if (!isValidName(user.firstName)) {
    errors.push(`Invalid first name: ${user.firstName}`);
  }
  
  if (!isValidName(user.lastName)) {
    errors.push(`Invalid last name: ${user.lastName}`);
  }
  
  if (!isValidTemporaryPassword(user.temporaryPassword)) {
    errors.push(`Invalid temporary password for user: ${user.username}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates user attributes for Cognito User Pool
 */
export function validateUserAttributes(attributes: UserAttributes): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!isValidEmail(attributes.email)) {
    errors.push(`Invalid email in attributes: ${attributes.email}`);
  }
  
  if (!isValidName(attributes.given_name)) {
    errors.push(`Invalid given_name in attributes: ${attributes.given_name}`);
  }
  
  if (!isValidName(attributes.family_name)) {
    errors.push(`Invalid family_name in attributes: ${attributes.family_name}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates all dummy users in an array
 */
export function validateAllDummyUsers(users: DummyUser[]): { isValid: boolean; errors: string[] } {
  const allErrors: string[] = [];
  const usernames = new Set<string>();
  const emails = new Set<string>();
  
  for (const user of users) {
    const validation = validateDummyUser(user);
    allErrors.push(...validation.errors);
    
    // Check for duplicate usernames
    if (usernames.has(user.username)) {
      allErrors.push(`Duplicate username: ${user.username}`);
    }
    usernames.add(user.username);
    
    // Check for duplicate emails
    if (emails.has(user.email)) {
      allErrors.push(`Duplicate email: ${user.email}`);
    }
    emails.add(user.email);
  }
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}