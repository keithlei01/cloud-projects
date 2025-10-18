# Data Validation System

## Problem Description

Implement a comprehensive data validation system for payment processing that can validate various data types, formats, and business rules. This system should be flexible, extensible, and provide clear error messages for validation failures.

### Requirements

1. **Multiple Data Types**: Support validation for strings, numbers, emails, dates, credit cards, addresses, etc.

2. **Custom Validators**: Allow creation of custom validation rules for business logic.

3. **Validation Chains**: Support chaining multiple validators together.

4. **Error Reporting**: Provide detailed error messages with field paths and validation reasons.

5. **Schema Validation**: Validate complex nested data structures against schemas.

6. **Performance**: Efficient validation for high-volume data processing.

### Data Types to Validate

- **Basic Types**: String, Integer, Float, Boolean, Date, DateTime
- **Financial**: Currency codes, amounts, credit card numbers, bank account numbers
- **Contact**: Email addresses, phone numbers, postal addresses
- **Business**: Tax IDs, business registration numbers, customer IDs
- **Custom**: Payment method specific data, transaction metadata

### Validation Rules

1. **Required Fields**: Ensure required fields are present
2. **Type Validation**: Validate data types and formats
3. **Range Validation**: Check numeric ranges, string lengths
4. **Pattern Matching**: Regex validation for formats
5. **Business Rules**: Custom business logic validation
6. **Cross-Field Validation**: Validate relationships between fields

### Example Schemas

```python
# Payment validation schema
payment_schema = {
    "amount": {
        "type": "integer",
        "required": True,
        "min": 1,
        "max": 10000000  # $100,000 in cents
    },
    "currency": {
        "type": "string",
        "required": True,
        "enum": ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"]
    },
    "customer_id": {
        "type": "string",
        "required": True,
        "pattern": r"^cus_[a-zA-Z0-9]+$"
    },
    "payment_method": {
        "type": "string",
        "required": True,
        "enum": ["credit_card", "bank_transfer", "digital_wallet"]
    },
    "payment_method_details": {
        "type": "object",
        "required": True,
        "properties": {
            "card": {
                "type": "object",
                "properties": {
                    "number": {
                        "type": "string",
                        "pattern": r"^\d{13,19}$"
                    },
                    "exp_month": {
                        "type": "integer",
                        "min": 1,
                        "max": 12
                    },
                    "exp_year": {
                        "type": "integer",
                        "min": 2023
                    }
                }
            }
        }
    }
}

# Customer validation schema
customer_schema = {
    "email": {
        "type": "email",
        "required": True
    },
    "name": {
        "type": "string",
        "required": True,
        "min_length": 1,
        "max_length": 100
    },
    "address": {
        "type": "object",
        "required": True,
        "properties": {
            "line1": {"type": "string", "required": True},
            "city": {"type": "string", "required": True},
            "state": {"type": "string", "required": True},
            "postal_code": {"type": "string", "required": True},
            "country": {"type": "string", "required": True, "enum": ["US", "CA", "GB", "DE", "FR"]}
        }
    }
}
```

### Implementation Requirements

1. **Validator Base Class**: Abstract base class for all validators
2. **Built-in Validators**: Common validators for standard data types
3. **Schema Validator**: Validate data against JSON Schema-like definitions
4. **Validation Context**: Track validation state and errors
5. **Error Collection**: Collect and format validation errors
6. **Custom Validators**: Framework for creating custom validation rules

### Example Usage

```python
# Create validator
validator = DataValidator()

# Validate payment data
payment_data = {
    "amount": 1000,
    "currency": "USD",
    "customer_id": "cus_1234567890",
    "payment_method": "credit_card",
    "payment_method_details": {
        "card": {
            "number": "4242424242424242",
            "exp_month": 12,
            "exp_year": 2025
        }
    }
}

result = validator.validate(payment_data, payment_schema)

if result.is_valid:
    print("Validation passed")
else:
    print("Validation errors:")
    for error in result.errors:
        print(f"  {error.field}: {error.message}")
```

### Extensions

1. **Async Validation**: Support for asynchronous validation operations
2. **Validation Caching**: Cache validation results for performance
3. **Internationalization**: Support for multiple languages in error messages
4. **Validation Metrics**: Track validation performance and error rates
5. **Schema Evolution**: Handle schema versioning and migration
6. **Conditional Validation**: Validate fields based on other field values

### Performance Considerations

- Lazy validation (stop on first error vs. collect all errors)
- Validation result caching
- Efficient regex compilation
- Memory usage for large datasets
- Parallel validation for independent fields

### Evaluation Criteria

- Validation accuracy and completeness
- Error message clarity and usefulness
- Code organization and extensibility
- Performance with large datasets
- Schema definition flexibility
- Custom validator framework
- Error handling and edge cases
