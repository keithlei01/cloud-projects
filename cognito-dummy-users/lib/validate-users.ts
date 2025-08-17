import { DUMMY_USERS } from './user-data';
import { validateAllDummyUsers } from './validation';

/**
 * Utility function to validate the predefined dummy users
 * This can be used during development to ensure data integrity
 */
export function validatePredefinedUsers(): void {
  console.log('Validating predefined dummy users...');
  
  const validation = validateAllDummyUsers(DUMMY_USERS);
  
  if (validation.isValid) {
    console.log('✅ All dummy users are valid!');
    console.log(`Total users: ${DUMMY_USERS.length}`);
    DUMMY_USERS.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.username} (${user.email})`);
    });
  } else {
    console.log('❌ Validation errors found:');
    validation.errors.forEach(error => {
      console.log(`  - ${error}`);
    });
    throw new Error('Dummy user validation failed');
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  validatePredefinedUsers();
}