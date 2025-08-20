// Jest setup file for additional configuration
// This file runs before each test file

// Set different timeouts based on test type
const isIntegrationTest = process.argv.some(arg => 
  arg.includes('integration') || 
  process.env.JEST_WORKER_ID !== undefined && 
  expect.getState().testPath?.includes('integration')
);

if (isIntegrationTest) {
  jest.setTimeout(600000); // 10 minutes for integration tests
} else {
  jest.setTimeout(30000); // 30 seconds for unit tests
}

// Environment validation for integration tests
if (process.env.NODE_ENV !== 'test') {
  console.warn('Warning: NODE_ENV is not set to "test"');
}

// AWS SDK configuration for tests
process.env.AWS_SDK_LOAD_CONFIG = '1';

// Global test utilities
(global as any).testUtils = {
  isIntegrationTest: () => isIntegrationTest,
  skipIfNoAWSCredentials: () => {
    if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_PROFILE) {
      console.log('Skipping test: No AWS credentials configured');
      return true;
    }
    return false;
  },
  generateRandomStackName: (prefix: string = 'test') => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `${prefix}-${timestamp}-${random}`;
  }
};