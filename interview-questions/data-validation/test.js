// Test for Data Validation solution
const { DataValidator, ValidationError } = require('./solution');

console.log('🧪 Testing Data Validation Solution\n');

// Helper function to compare validation results
function testValidation(validator, data, schema, expectedValid, testName) {
    const result = validator.validate(data, schema);
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

// Define schemas
const paymentSchema = {
  type: "object",
  required: true,
  properties: {
    amount: {
      type: "integer",
      required: true,
      min: 1,
      max: 10000000
    },
    currency: {
      type: "string",
      required: true,
      enum: ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"]
    },
    customer_id: {
      type: "string",
      required: true,
      pattern: "^cus_[a-zA-Z0-9]+$"
    },
    payment_method: {
      type: "string",
      required: true,
      enum: ["credit_card", "bank_transfer", "digital_wallet"]
    },
    payment_method_details: {
      type: "object",
      required: true,
      properties: {
        card: {
          type: "object",
          properties: {
            number: {
              type: "credit_card",
              required: true
            },
            exp_month: {
              type: "integer",
              required: true,
              min: 1,
              max: 12
            },
            exp_year: {
              type: "integer",
              required: true,
              min: 2023
            }
          }
        }
      }
    }
  }
};

const customerSchema = {
  type: "object",
  required: true,
  properties: {
    email: {
      type: "email",
      required: true
    },
    name: {
      type: "string",
      required: true,
      min_length: 1,
      max_length: 100
    },
    phone: {
      type: "phone",
      required: false
    },
    address: {
      type: "object",
      required: true,
      properties: {
        line1: {
          type: "string",
          required: true,
          min_length: 1
        },
        city: {
          type: "string",
          required: true,
          min_length: 1
        },
        state: {
          type: "string",
          required: true,
          min_length: 2,
          max_length: 2
        },
        postal_code: {
          type: "string",
          required: true,
          pattern: "^\\d{5}(-\\d{4})?$"
        },
        country: {
          type: "string",
          required: true,
          enum: ["US", "CA", "GB", "DE", "FR"]
        }
      }
    }
  }
};

// Test 1: Valid payment data
console.log('1️⃣ Valid payment data');
const validator = new DataValidator();
const validPayment = {
  amount: 1000,
  currency: "USD",
  customer_id: "cus_1234567890",
  payment_method: "credit_card",
  payment_method_details: {
    card: {
      number: "4242424242424242",
      exp_month: 12,
      exp_year: 2025
    }
  }
};
testValidation(validator, validPayment, paymentSchema, true, 'Valid payment');

// Test 2: Invalid payment data
console.log('2️⃣ Invalid payment data');
const invalidPayment = {
  amount: -100, // Invalid amount
  currency: "INVALID", // Invalid currency
  customer_id: "invalid_id", // Invalid format
  payment_method: "credit_card",
  payment_method_details: {
    card: {
      number: "1234567890123456", // Invalid card number
      exp_month: 13, // Invalid month
      exp_year: 2020 // Expired year
    }
  }
};
testValidation(validator, invalidPayment, paymentSchema, false, 'Invalid payment');

// Test 3: Valid customer data
console.log('3️⃣ Valid customer data');
const validCustomer = {
  email: "test@example.com",
  name: "John Doe",
  phone: "+1-555-123-4567",
  address: {
    line1: "123 Main St",
    city: "San Francisco",
    state: "CA",
    postal_code: "94105",
    country: "US"
  }
};
testValidation(validator, validCustomer, customerSchema, true, 'Valid customer');

// Test 4: Invalid customer data
console.log('4️⃣ Invalid customer data');
const invalidCustomer = {
  email: "invalid-email", // Invalid email
  name: "", // Empty name
  phone: "invalid-phone", // Invalid phone
  address: {
    line1: "", // Empty address
    city: "San Francisco",
    state: "California", // Invalid state format
    postal_code: "invalid", // Invalid postal code
    country: "INVALID" // Invalid country
  }
};
testValidation(validator, invalidCustomer, customerSchema, false, 'Invalid customer');

console.log('🎉 Data validation tests completed!');
