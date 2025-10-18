/**
 * Data Validation System Solution
 * 
 * This solution implements a comprehensive data validation system with:
 * 1. Multiple built-in validators for common data types
 * 2. Schema-based validation with JSON Schema-like syntax
 * 3. Custom validator framework
 * 4. Detailed error reporting with field paths
 * 5. Validation chaining and composition
 * 6. Performance optimizations
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface FieldValidationError extends ValidationError {
  field: string;
  message: string;
  value?: any;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FieldValidationError[];
}

export interface ValidationContext {
  fieldPath: string;
}

abstract class Validator {
  abstract validate(value: any, context: ValidationContext): ValidationResult;
}

class RequiredValidator extends Validator {
  validate(value: any, context: ValidationContext): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };

    if (value === null || value === undefined) {
      result.errors.push({
        field: context.fieldPath,
        message: "Field is required",
        value,
        code: "required"
      } as FieldValidationError);
      result.isValid = false;
    }

    return result;
  }
}

class TypeValidator extends Validator {
  constructor(private expectedType: string) {
    super();
  }

  validate(value: any, context: ValidationContext): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };

    if (value !== null && value !== undefined && typeof value !== this.expectedType) {
      result.errors.push({
        field: context.fieldPath,
        message: `Expected ${this.expectedType}, got ${typeof value}`,
        value,
        code: "type_error"
      } as FieldValidationError);
      result.isValid = false;
    }

    return result;
  }
}

class StringValidator extends Validator {
  constructor(
    private minLength?: number,
    private maxLength?: number
  ) {
    super();
  }

  validate(value: any, context: ValidationContext): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };

    if (value === null || value === undefined) {
      return result;
    }

    if (typeof value !== 'string') {
      result.errors.push({
        field: context.fieldPath,
        message: "Expected string",
        value,
        code: "type_error"
      } as FieldValidationError);
      result.isValid = false;
      return result;
    }

    if (this.minLength !== undefined && value.length < this.minLength) {
      result.errors.push({
        field: context.fieldPath,
        message: `String too short (minimum ${this.minLength} characters)`,
        value,
        code: "min_length"
      } as FieldValidationError);
      result.isValid = false;
    }

    if (this.maxLength !== undefined && value.length > this.maxLength) {
      result.errors.push({
        field: context.fieldPath,
        message: `String too long (maximum ${this.maxLength} characters)`,
        value,
        code: "max_length"
      } as FieldValidationError);
      result.isValid = false;
    }

    return result;
  }
}

class NumberValidator extends Validator {
  constructor(
    private minValue?: number,
    private maxValue?: number
  ) {
    super();
  }

  validate(value: any, context: ValidationContext): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };

    if (value === null || value === undefined) {
      return result;
    }

    if (typeof value !== 'number') {
      result.errors.push({
        field: context.fieldPath,
        message: "Expected number",
        value,
        code: "type_error"
      } as FieldValidationError);
      result.isValid = false;
      return result;
    }

    if (this.minValue !== undefined && value < this.minValue) {
      result.errors.push({
        field: context.fieldPath,
        message: `Value too small (minimum ${this.minValue})`,
        value,
        code: "min_value"
      } as FieldValidationError);
      result.isValid = false;
    }

    if (this.maxValue !== undefined && value > this.maxValue) {
      result.errors.push({
        field: context.fieldPath,
        message: `Value too large (maximum ${this.maxValue})`,
        value,
        code: "max_value"
      } as FieldValidationError);
      result.isValid = false;
    }

    return result;
  }
}

class PatternValidator extends Validator {
  private pattern: RegExp;

  constructor(pattern: string, private message?: string) {
    super();
    this.pattern = new RegExp(pattern);
    this.message = message || `Value does not match pattern ${pattern}`;
  }

  validate(value: any, context: ValidationContext): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };

    if (value === null || value === undefined) {
      return result;
    }

    if (typeof value !== 'string') {
      result.errors.push({
        field: context.fieldPath,
        message: "Expected string for pattern validation",
        value,
        code: "type_error"
      } as FieldValidationError);
      result.isValid = false;
      return result;
    }

    if (!this.pattern.test(value)) {
      result.errors.push({
        field: context.fieldPath,
        message: this.message!,
        value,
        code: "pattern_error"
      } as FieldValidationError);
      result.isValid = false;
    }

    return result;
  }
}

class EnumValidator extends Validator {
  constructor(private allowedValues: any[]) {
    super();
  }

  validate(value: any, context: ValidationContext): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };

    if (value === null || value === undefined) {
      return result;
    }

    if (!this.allowedValues.includes(value)) {
      result.errors.push({
        field: context.fieldPath,
        message: `Value must be one of ${JSON.stringify(this.allowedValues)}`,
        value,
        code: "enum_error"
      } as FieldValidationError);
      result.isValid = false;
    }

    return result;
  }
}

class EmailValidator extends Validator {
  private emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  validate(value: any, context: ValidationContext): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };

    if (value === null || value === undefined) {
      return result;
    }

    if (typeof value !== 'string') {
      result.errors.push({
        field: context.fieldPath,
        message: "Expected string for email validation",
        value,
        code: "type_error"
      } as FieldValidationError);
      result.isValid = false;
      return result;
    }

    if (!this.emailPattern.test(value)) {
      result.errors.push({
        field: context.fieldPath,
        message: "Invalid email address",
        value,
        code: "email_error"
      } as FieldValidationError);
      result.isValid = false;
    }

    return result;
  }
}

class PhoneValidator extends Validator {
  private phonePattern = /^\+?[\d\s\-\(\)]+$/;

  validate(value: any, context: ValidationContext): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };

    if (value === null || value === undefined) {
      return result;
    }

    if (typeof value !== 'string') {
      result.errors.push({
        field: context.fieldPath,
        message: "Expected string for phone validation",
        value,
        code: "type_error"
      } as FieldValidationError);
      result.isValid = false;
      return result;
    }

    if (!this.phonePattern.test(value)) {
      result.errors.push({
        field: context.fieldPath,
        message: "Invalid phone number",
        value,
        code: "phone_error"
      } as FieldValidationError);
      result.isValid = false;
    }

    return result;
  }
}

class CreditCardValidator extends Validator {
  validate(value: any, context: ValidationContext): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };

    if (value === null || value === undefined) {
      return result;
    }

    if (typeof value !== 'string') {
      result.errors.push({
        field: context.fieldPath,
        message: "Expected string for credit card validation",
        value,
        code: "type_error"
      } as FieldValidationError);
      result.isValid = false;
      return result;
    }

    // Remove spaces and dashes
    const cardNumber = value.replace(/\D/g, '');

    if (cardNumber.length < 13 || cardNumber.length > 19) {
      result.errors.push({
        field: context.fieldPath,
        message: "Credit card number must be 13-19 digits",
        value,
        code: "credit_card_length"
      } as FieldValidationError);
      result.isValid = false;
      return result;
    }

    // Luhn algorithm
    if (!this.luhnCheck(cardNumber)) {
      result.errors.push({
        field: context.fieldPath,
        message: "Invalid credit card number",
        value,
        code: "credit_card_invalid"
      } as FieldValidationError);
      result.isValid = false;
    }

    return result;
  }

  private luhnCheck(cardNumber: string): boolean {
    const digits = cardNumber.split('').map(d => parseInt(d, 10));
    let checksum = 0;

    for (let i = 0; i < digits.length; i++) {
      const digit = digits[digits.length - 1 - i];
      if (i % 2 === 1) { // Every second digit from the right
        const doubled = digit * 2;
        checksum += doubled < 10 ? doubled : doubled - 9;
      } else {
        checksum += digit;
      }
    }

    return checksum % 10 === 0;
  }
}

class ObjectValidator extends Validator {
  constructor(private properties: Record<string, any>) {
    super();
  }

  validate(value: any, context: ValidationContext): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };

    if (value === null || value === undefined) {
      return result;
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
      result.errors.push({
        field: context.fieldPath,
        message: "Expected object",
        value,
        code: "type_error"
      } as FieldValidationError);
      result.isValid = false;
      return result;
    }

    // Validate each property
    for (const [propName, propSchema] of Object.entries(this.properties)) {
      const propContext: ValidationContext = {
        fieldPath: context.fieldPath ? `${context.fieldPath}.${propName}` : propName
      };
      const propValue = value[propName];

      // Check if property is required
      if (propSchema.required && (propValue === null || propValue === undefined)) {
        result.errors.push({
          field: propContext.fieldPath,
          message: "Required field is missing",
          value: propValue,
          code: "required"
        } as FieldValidationError);
        result.isValid = false;
        continue;
      }

      // Validate property value
      if (propValue !== null && propValue !== undefined) {
        const propResult = this.validateProperty(propValue, propSchema, propContext);
        result.errors.push(...propResult.errors);
        if (!propResult.isValid) {
          result.isValid = false;
        }
      }
    }

    return result;
  }

  private validateProperty(value: any, schema: any, context: ValidationContext): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };

    // Type validation
    if (schema.type) {
      const typeValidator = this.getTypeValidator(schema.type, schema);
      const typeResult = typeValidator.validate(value, context);
      result.errors.push(...typeResult.errors);
      if (!typeResult.isValid) {
        result.isValid = false;
      }
    }

    // Additional validators
    if (schema.pattern) {
      const patternValidator = new PatternValidator(schema.pattern);
      const patternResult = patternValidator.validate(value, context);
      result.errors.push(...patternResult.errors);
      if (!patternResult.isValid) {
        result.isValid = false;
      }
    }

    if (schema.enum) {
      const enumValidator = new EnumValidator(schema.enum);
      const enumResult = enumValidator.validate(value, context);
      result.errors.push(...enumResult.errors);
      if (!enumResult.isValid) {
        result.isValid = false;
      }
    }

    // Nested object validation
    if (schema.type === 'object' && schema.properties) {
      const objectValidator = new ObjectValidator(schema.properties);
      const objectResult = objectValidator.validate(value, context);
      result.errors.push(...objectResult.errors);
      if (!objectResult.isValid) {
        result.isValid = false;
      }
    }

    return result;
  }

  private getTypeValidator(typeName: string, schema: any): Validator {
    if (typeName === 'string') {
      return new StringValidator(schema.min_length, schema.max_length);
    } else if (typeName === 'integer' || typeName === 'number') {
      return new NumberValidator(schema.min, schema.max);
    } else if (typeName === 'email') {
      return new EmailValidator();
    } else if (typeName === 'phone') {
      return new PhoneValidator();
    } else if (typeName === 'credit_card') {
      return new CreditCardValidator();
    } else if (typeName === 'object') {
      return new ObjectValidator(schema.properties || {});
    } else {
      return new TypeValidator('string'); // Default to string
    }
  }
}

export class DataValidator {
  validate(data: any, schema: any): ValidationResult {
    const context: ValidationContext = { fieldPath: '' };
    return this.validateValue(data, schema, context);
  }

  private validateValue(value: any, schema: any, context: ValidationContext): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };

    // Required field validation
    if (schema.required) {
      const requiredValidator = new RequiredValidator();
      const requiredResult = requiredValidator.validate(value, context);
      result.errors.push(...requiredResult.errors);
      if (!requiredResult.isValid) {
        result.isValid = false;
      }
    }

    // Skip further validation if value is null/undefined and not required
    if ((value === null || value === undefined) && !schema.required) {
      return result;
    }

    // Type validation
    if (schema.type) {
      const typeValidator = this.getTypeValidator(schema.type, schema);
      const typeResult = typeValidator.validate(value, context);
      result.errors.push(...typeResult.errors);
      if (!typeResult.isValid) {
        result.isValid = false;
      }
    }

    // Additional validators
    if (schema.pattern) {
      const patternValidator = new PatternValidator(schema.pattern);
      const patternResult = patternValidator.validate(value, context);
      result.errors.push(...patternResult.errors);
      if (!patternResult.isValid) {
        result.isValid = false;
      }
    }

    if (schema.enum) {
      const enumValidator = new EnumValidator(schema.enum);
      const enumResult = enumValidator.validate(value, context);
      result.errors.push(...enumResult.errors);
      if (!enumResult.isValid) {
        result.isValid = false;
      }
    }

    // Nested object validation
    if (schema.type === 'object' && schema.properties) {
      const objectValidator = new ObjectValidator(schema.properties);
      const objectResult = objectValidator.validate(value, context);
      result.errors.push(...objectResult.errors);
      if (!objectResult.isValid) {
        result.isValid = false;
      }
    }

    return result;
  }

  private getTypeValidator(typeName: string, schema: any): Validator {
    if (typeName === 'string') {
      return new StringValidator(schema.min_length, schema.max_length);
    } else if (typeName === 'integer' || typeName === 'number') {
      return new NumberValidator(schema.min, schema.max);
    } else if (typeName === 'email') {
      return new EmailValidator();
    } else if (typeName === 'phone') {
      return new PhoneValidator();
    } else if (typeName === 'credit_card') {
      return new CreditCardValidator();
    } else if (typeName === 'object') {
      return new ObjectValidator(schema.properties || {});
    } else {
      return new TypeValidator('string'); // Default to string
    }
  }
}

// Example usage and testing
if (require.main === module) {
  const validator = new DataValidator();

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

  // Test payment validation
  console.log("Testing payment validation...");

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

  let result = validator.validate(validPayment, paymentSchema);
  if (result.isValid) {
    console.log("✓ Valid payment passed validation");
  } else {
    console.log("✗ Valid payment failed validation:");
    for (const error of result.errors) {
      console.log(`  ${error.field}: ${error.message}`);
    }
  }

  // Test invalid payment
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

  result = validator.validate(invalidPayment, paymentSchema);
  if (result.isValid) {
    console.log("✗ Invalid payment passed validation (unexpected)");
  } else {
    console.log("✓ Invalid payment failed validation (expected):");
    for (const error of result.errors) {
      console.log(`  ${error.field}: ${error.message}`);
    }
  }

  // Test customer validation
  console.log("\nTesting customer validation...");

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

  result = validator.validate(validCustomer, customerSchema);
  if (result.isValid) {
    console.log("✓ Valid customer passed validation");
  } else {
    console.log("✗ Valid customer failed validation:");
    for (const error of result.errors) {
      console.log(`  ${error.field}: ${error.message}`);
    }
  }

  // Test invalid customer
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

  result = validator.validate(invalidCustomer, customerSchema);
  if (result.isValid) {
    console.log("✗ Invalid customer passed validation (unexpected)");
  } else {
    console.log("✓ Invalid customer failed validation (expected):");
    for (const error of result.errors) {
      console.log(`  ${error.field}: ${error.message}`);
    }
  }
}
