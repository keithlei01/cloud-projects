// Jest tests for Data Validation solution
const { DataValidator, ValidationError } = require('./solution');

describe('Data Validation', () => {
  let validator;

  beforeEach(() => {
    validator = new DataValidator();
  });

  describe('Basic Validation', () => {
    test('should validate required fields', () => {
      const schema = {
        name: { type: 'string', required: true },
        age: { type: 'number', required: true }
      };

      const validData = { name: 'John', age: 30 };
      const invalidData = { name: 'John' }; // missing age

      expect(validator.validate(validData, schema).isValid).toBe(true);
      expect(validator.validate(invalidData, schema).isValid).toBe(false);
    });

    test('should validate data types', () => {
      const schema = {
        name: { type: 'string' },
        age: { type: 'number' },
        active: { type: 'boolean' }
      };

      const validData = { name: 'John', age: 30, active: true };
      const invalidData = { name: 123, age: 'thirty', active: 'yes' };

      expect(validator.validate(validData, schema).isValid).toBe(true);
      expect(validator.validate(invalidData, schema).isValid).toBe(false);
    });
  });

  describe('String Validation', () => {
    test('should validate string length constraints', () => {
      const schema = {
        name: { type: 'string', minLength: 2, maxLength: 10 }
      };

      const validData = { name: 'John' };
      const tooShort = { name: 'J' };
      const tooLong = { name: 'VeryLongName' };

      expect(validator.validate(validData, schema).isValid).toBe(true);
      expect(validator.validate(tooShort, schema).isValid).toBe(false);
      expect(validator.validate(tooLong, schema).isValid).toBe(false);
    });

    test('should validate string patterns', () => {
      const schema = {
        email: { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
      };

      const validData = { email: 'test@example.com' };
      const invalidData = { email: 'invalid-email' };

      expect(validator.validate(validData, schema).isValid).toBe(true);
      expect(validator.validate(invalidData, schema).isValid).toBe(false);
    });
  });

  describe('Number Validation', () => {
    test('should validate number ranges', () => {
      const schema = {
        age: { type: 'number', min: 18, max: 65 }
      };

      const validData = { age: 30 };
      const tooLow = { age: 16 };
      const tooHigh = { age: 70 };

      expect(validator.validate(validData, schema).isValid).toBe(true);
      expect(validator.validate(tooLow, schema).isValid).toBe(false);
      expect(validator.validate(tooHigh, schema).isValid).toBe(false);
    });
  });

  describe('Payment Data Validation', () => {
    test('should validate payment amount', () => {
      const schema = {
        amount: { type: 'number', min: 1, max: 10000000 }
      };

      const validData = { amount: 1000 };
      const invalidData = { amount: 0 };

      expect(validator.validate(validData, schema).isValid).toBe(true);
      expect(validator.validate(invalidData, schema).isValid).toBe(false);
    });

    test('should validate currency codes', () => {
      const schema = {
        currency: { type: 'string', enum: ['USD', 'EUR', 'GBP', 'JPY'] }
      };

      const validData = { currency: 'USD' };
      const invalidData = { currency: 'INVALID' };

      expect(validator.validate(validData, schema).isValid).toBe(true);
      expect(validator.validate(invalidData, schema).isValid).toBe(false);
    });

    test('should validate customer ID format', () => {
      const schema = {
        customer_id: { type: 'string', pattern: /^cus_[a-zA-Z0-9]+$/ }
      };

      const validData = { customer_id: 'cus_1234567890' };
      const invalidData = { customer_id: 'invalid_id' };

      expect(validator.validate(validData, schema).isValid).toBe(true);
      expect(validator.validate(invalidData, schema).isValid).toBe(false);
    });
  });

  describe('Credit Card Validation', () => {
    test('should validate credit card numbers with Luhn algorithm', () => {
      const schema = {
        card_number: { type: 'credit_card' }
      };

      const validData = { card_number: '4532015112830366' };
      const invalidData = { card_number: '1234567890123456' };

      expect(validator.validate(validData, schema).isValid).toBe(true);
      expect(validator.validate(invalidData, schema).isValid).toBe(false);
    });

    test('should validate card expiration', () => {
      const schema = {
        exp_month: { type: 'number', min: 1, max: 12 },
        exp_year: { type: 'number', min: 2023 }
      };

      const validData = { exp_month: 12, exp_year: 2025 };
      const invalidData = { exp_month: 13, exp_year: 2020 };

      expect(validator.validate(validData, schema).isValid).toBe(true);
      expect(validator.validate(invalidData, schema).isValid).toBe(false);
    });
  });

  describe('Nested Object Validation', () => {
    test('should validate nested objects', () => {
      const schema = {
        customer: {
          type: 'object',
          properties: {
            name: { type: 'string', required: true },
            email: { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
          }
        }
      };

      const validData = {
        customer: { name: 'John Doe', email: 'john@example.com' }
      };
      const invalidData = {
        customer: { name: 'John Doe', email: 'invalid-email' }
      };

      expect(validator.validate(validData, schema).isValid).toBe(true);
      expect(validator.validate(invalidData, schema).isValid).toBe(false);
    });
  });

  describe('Array Validation', () => {
    test('should validate arrays', () => {
      const schema = {
        items: { type: 'array', minItems: 1, maxItems: 5 }
      };

      const validData = { items: ['item1', 'item2'] };
      const emptyArray = { items: [] };
      const tooManyItems = { items: ['1', '2', '3', '4', '5', '6'] };

      expect(validator.validate(validData, schema).isValid).toBe(true);
      expect(validator.validate(emptyArray, schema).isValid).toBe(false);
      expect(validator.validate(tooManyItems, schema).isValid).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should provide detailed error messages', () => {
      const schema = {
        name: { type: 'string', required: true, minLength: 2 },
        age: { type: 'number', min: 18 }
      };

      const invalidData = { name: 'J', age: 16 };
      const result = validator.validate(invalidData, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('minimum length');
      expect(result.errors[1]).toContain('minimum value');
    });

    test('should handle validation errors gracefully', () => {
      expect(() => {
        validator.validate(null, {});
      }).not.toThrow();
    });
  });

  describe('Custom Validators', () => {
    test('should support custom validation functions', () => {
      const schema = {
        password: {
          type: 'string',
          custom: (value) => {
            if (value.length < 8) return 'Password must be at least 8 characters';
            if (!/[A-Z]/.test(value)) return 'Password must contain uppercase letter';
            if (!/[0-9]/.test(value)) return 'Password must contain number';
            return null;
          }
        }
      };

      const validData = { password: 'SecurePass123' };
      const invalidData = { password: 'weak' };

      expect(validator.validate(validData, schema).isValid).toBe(true);
      expect(validator.validate(invalidData, schema).isValid).toBe(false);
    });
  });

  describe('Complex Payment Schema', () => {
    test('should validate complete payment data', () => {
      const paymentSchema = {
        amount: { type: 'number', min: 1, max: 10000000, required: true },
        currency: { type: 'string', enum: ['USD', 'EUR', 'GBP'], required: true },
        customer_id: { type: 'string', pattern: /^cus_[a-zA-Z0-9]+$/, required: true },
        payment_method: { type: 'string', enum: ['credit_card', 'bank_transfer'], required: true },
        payment_method_details: {
          type: 'object',
          required: true,
          properties: {
            card: {
              type: 'object',
              properties: {
                number: { type: 'credit_card' },
                exp_month: { type: 'number', min: 1, max: 12 },
                exp_year: { type: 'number', min: 2023 }
              }
            }
          }
        }
      };

      const validPayment = {
        amount: 1000,
        currency: 'USD',
        customer_id: 'cus_1234567890',
        payment_method: 'credit_card',
        payment_method_details: {
          card: {
            number: '4532015112830366',
            exp_month: 12,
            exp_year: 2025
          }
        }
      };

      expect(validator.validate(validPayment, paymentSchema).isValid).toBe(true);
    });
  });
});