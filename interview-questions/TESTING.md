# Jest Testing Guide

This document explains how to run the Jest test suites for all interview question solutions.

## Overview

All test files have been converted from console.log-based tests to proper Jest test suites. Each solution now has comprehensive test coverage with proper assertions, error handling, and edge case testing.

## Test Structure

Each test suite includes:
- **Setup/Teardown**: `beforeEach()` for consistent test environment
- **Organized Tests**: Grouped by functionality using `describe()` blocks
- **Proper Assertions**: Using Jest `expect()` statements
- **Error Testing**: Testing both success and failure scenarios
- **Edge Cases**: Comprehensive coverage of edge cases and error conditions

## Running Tests

### Run All Tests
```bash
# Run all test suites
npm test

# Or use the test runner script
./run-all-tests.sh
```

### Run Individual Test Suites
```bash
# Credit Card Redaction
npm run test:credit-card-redaction

# Currency Conversion
npm run test:currency-conversion

# API Integration
npm run test:api-integration

# Data Validation
npm run test:data-validation

# Error Handling & Retry Logic
npm run test:error-handling

# Payment Processing
npm run test:payment-processing

# Rate Limiting
npm run test:rate-limiting

# Webhook Handler
npm run test:webhook-handler
```

### Watch Mode
```bash
# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Watch specific test suite
npx jest credit-card-redaction/test.js --watch
```

## Test Coverage by Solution

### 1. Credit Card Redaction
- ✅ Basic redaction functionality
- ✅ Multiple card formats (spaces, dashes, no separators)
- ✅ Custom placeholders
- ✅ Partial redaction with configurable digits
- ✅ Card type detection for major card brands
- ✅ Luhn algorithm validation
- ✅ Edge cases and error handling
- ✅ Performance with large texts

### 2. Currency Conversion
- ✅ Direct conversion rates
- ✅ Indirect conversion through intermediate currencies
- ✅ Best rate calculation
- ✅ Error handling for impossible conversions
- ✅ Edge cases and invalid inputs
- ✅ Performance with large rate sets

### 3. API Integration
- ✅ Client creation and configuration
- ✅ Error class definitions
- ✅ HTTP method implementations
- ✅ Error handling and retry logic
- ✅ Rate limiting functionality
- ✅ Request/response handling

### 4. Data Validation
- ✅ Basic type validation
- ✅ String, number, and boolean validation
- ✅ Payment data validation
- ✅ Credit card validation with Luhn algorithm
- ✅ Nested object validation
- ✅ Array validation
- ✅ Custom validators
- ✅ Error message generation

### 5. Error Handling & Retry Logic
- ✅ Retry manager creation
- ✅ Error class definitions
- ✅ Successful operations
- ✅ Retry logic with different strategies
- ✅ Error classification
- ✅ Circuit breaker functionality
- ✅ Dead letter queue
- ✅ Metrics and monitoring

### 6. Payment Processing
- ✅ Payment service creation
- ✅ Error class definitions
- ✅ Payment creation and validation
- ✅ Payment processing and authorization
- ✅ Payment capture and refunds
- ✅ Payment cancellation
- ✅ Fraud detection
- ✅ Multiple payment methods
- ✅ Currency support
- ✅ Payment retrieval and history

### 7. Rate Limiting
- ✅ Rate limit manager creation
- ✅ Token bucket algorithm
- ✅ Sliding window algorithm
- ✅ Fixed window algorithm
- ✅ Rate limit middleware
- ✅ Error handling
- ✅ Metrics and monitoring
- ✅ Different user keys
- ✅ Cost per request handling
- ✅ Edge cases

### 8. Webhook Handler
- ✅ Webhook handler creation
- ✅ Error class definitions
- ✅ Signature verification
- ✅ Event processing
- ✅ Idempotency handling
- ✅ Event storage
- ✅ Error handling
- ✅ Event validation
- ✅ Security features
- ✅ Performance testing

## Jest Configuration

The project uses the following Jest configuration (`jest.config.js`):
- **Preset**: `ts-jest` for TypeScript support
- **Environment**: Node.js
- **Test Matching**: Finds test files in various patterns
- **Transform**: Handles TypeScript files
- **Coverage**: Collects coverage from TypeScript files
- **Timeout**: 10 seconds for async operations

## Best Practices

1. **Test Isolation**: Each test runs in isolation with fresh setup
2. **Descriptive Names**: Test names clearly describe what is being tested
3. **Arrange-Act-Assert**: Tests follow the AAA pattern
4. **Error Testing**: Both success and failure scenarios are tested
5. **Edge Cases**: Comprehensive coverage of edge cases and error conditions
6. **Async Testing**: Proper handling of async operations with `async/await`
7. **Mocking**: Uses Jest mocking where appropriate for external dependencies

## Troubleshooting

### Common Issues

1. **TypeScript Errors**: Ensure all TypeScript files compile without errors
2. **Import Issues**: Check that all required exports are available in solution files
3. **Async Timeouts**: Increase timeout in Jest config if needed
4. **Memory Issues**: Run tests individually if memory usage is high

### Debug Mode
```bash
# Run with debug output
npx jest --verbose --no-cache

# Run specific test with debug
npx jest credit-card-redaction/test.js --verbose --no-cache
```

## Contributing

When adding new tests:
1. Follow the existing test structure and naming conventions
2. Include both positive and negative test cases
3. Test edge cases and error conditions
4. Use descriptive test names
5. Group related tests in `describe()` blocks
6. Clean up any test data in `afterEach()` if needed
