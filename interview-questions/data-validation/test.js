// Test for Data Validation solution
const { DataValidator, ValidationError } = require('./solution');

console.log('🧪 Testing Data Validation Solution\n');

// Helper function to compare validation results
function testValidation(validator, data, expectedValid, testName) {
    const result = validator.validate(data);
    const passed = result.isValid === expectedValid;
    console.log(`${testName}:`);
    console.log(`Data:`, data);
    console.log(`Valid: ${result.isValid} (expected: ${expectedValid})`);
    if (!result.isValid) {
        console.log(`Errors:`, result.errors);
    }
    console.log(passed ? '✅ PASS' : '❌ FAIL');
    console.log('');
    return passed;
}

// Test 1: Valid payment data
console.log('1️⃣ Valid payment data');
const validator = new DataValidator();
const validPayment = {
    amount: 1000,
    currency: 'USD',
    customer_id: 'cus_1234567890',
    payment_method_details: {
        card: {
            number: '4532123456789012',
            exp_month: 12,
            exp_year: 2025
        }
    }
};
testValidation(validator, validPayment, true, 'Valid payment');

// Test 2: Invalid payment data
console.log('2️⃣ Invalid payment data');
const invalidPayment = {
    amount: 0, // Too small
    currency: 'INVALID', // Not supported
    customer_id: 'invalid_id', // Wrong format
    payment_method_details: {
        card: {
            number: '1234', // Too short
            exp_month: 13, // Invalid month
            exp_year: 2020 // Expired
        }
    }
};
testValidation(validator, invalidPayment, false, 'Invalid payment');

// Test 3: Valid customer data
console.log('3️⃣ Valid customer data');
const validCustomer = {
    email: 'test@example.com',
    name: 'John Doe',
    phone: '+1234567890',
    address: {
        line1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postal_code: '10001',
        country: 'US'
    }
};
testValidation(validator, validCustomer, true, 'Valid customer');

// Test 4: Invalid customer data
console.log('4️⃣ Invalid customer data');
const invalidCustomer = {
    email: 'invalid-email', // Invalid format
    name: '', // Empty name
    phone: '123', // Invalid phone
    address: {
        line1: '', // Empty address
        city: 'New York',
        state: 'NEW YORK', // Too long
        postal_code: '123', // Invalid format
        country: 'INVALID' // Not supported
    }
};
testValidation(validator, invalidCustomer, false, 'Invalid customer');

// Test 5: Schema validation
console.log('5️⃣ Schema validation');
const schemaValidator = new DataValidator();
const testData = {
    name: 'Test',
    age: 25,
    email: 'test@example.com'
};
testValidation(schemaValidator, testData, true, 'Schema validation');

// Test 6: Type validation
console.log('6️⃣ Type validation');
const typeValidator = new DataValidator();
const wrongTypeData = {
    name: 123, // Should be string
    age: 'twenty-five', // Should be number
    email: 'test@example.com'
};
testValidation(typeValidator, wrongTypeData, false, 'Type validation');

console.log('🎉 Data validation tests completed!');
