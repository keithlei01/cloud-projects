# Credit Card Redaction - Jest Tests

This directory contains Jest tests for the Credit Card Redaction solution.

## Running the Tests

### Option 1: Using npm script
```bash
npm run test:credit-card-redaction
```

### Option 2: Using Jest directly
```bash
npx jest credit-card-redaction/test.js
```

### Option 3: Using the test runner script
```bash
./run-credit-card-tests.sh
```

### Option 4: Run all tests
```bash
npm test
```

## Test Structure

The Jest test suite includes:

- **Basic Redaction**: Tests for single and multiple card redaction
- **Custom Placeholder**: Tests for custom redaction placeholders
- **Partial Redaction**: Tests for showing last N digits
- **Card Type Detection**: Tests for identifying card types (Visa, MasterCard, etc.)
- **Luhn Algorithm Validation**: Tests for credit card number validation
- **Edge Cases**: Tests for various edge cases and error conditions
- **Complex Scenarios**: Tests for real-world usage patterns
- **Performance and Robustness**: Tests for large text and structure preservation

## Test Coverage

The tests cover:
- ✅ Basic redaction functionality
- ✅ Multiple card formats (spaces, dashes, no separators)
- ✅ Custom placeholders
- ✅ Partial redaction with configurable digits
- ✅ Card type detection for major card brands
- ✅ Luhn algorithm validation
- ✅ Edge cases and error handling
- ✅ Performance with large texts

## Expected Results

All tests should pass, demonstrating that the credit card redaction system:
1. Correctly identifies valid credit card numbers using Luhn algorithm
2. Redacts them with appropriate placeholders
3. Handles various formats and edge cases
4. Preserves text structure and context
