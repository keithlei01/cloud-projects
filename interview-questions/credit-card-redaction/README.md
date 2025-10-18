# Credit Card Number Redaction

## Problem Description

Develop a filter that redacts credit card numbers from strings to prevent logging sensitive information. This is a critical security requirement for payment processing systems.

### Requirements

1. **Pattern Detection**: Identify various credit card number formats in text strings.

2. **Redaction**: Replace detected credit card numbers with a placeholder (e.g., `[REDACTED]`).

3. **Multiple Formats**: Handle different credit card number formats and separators.

4. **Context Preservation**: Maintain the original text structure while redacting sensitive data.

### Credit Card Number Formats

Credit card numbers can appear in various formats:
- **Spaces**: `4532 1234 5678 9012`
- **Dashes**: `4532-1234-5678-9012`
- **No separators**: `4532123456789012`
- **Mixed separators**: `4532-1234 5678 9012`

### Validation Rules

Credit card numbers typically:
- Are 13-19 digits long
- May contain spaces, dashes, or other separators
- Follow specific patterns for different card types

### Examples

```python
# Input text with credit card numbers
text = "Customer payment: 4532 1234 5678 9012, amount: $100.00"

# Expected output
"Customer payment: [REDACTED], amount: $100.00"
```

### Test Cases

```python
test_cases = [
    "Payment with card 4532 1234 5678 9012 successful",
    "Card number 4532-1234-5678-9012 is valid",
    "Processing 4532123456789012...",
    "Multiple cards: 4532 1234 5678 9012 and 5555 4444 3333 2222",
    "No card numbers in this text",
    "Invalid: 1234 5678 9012 (too short)",
    "Edge case: 4532-1234 5678 9012 (mixed separators)"
]
```

### Extensions

1. **Luhn Algorithm**: Implement the Luhn algorithm to validate credit card numbers before redaction.

2. **Partial Redaction**: Show only the last 4 digits: `****-****-****-9012`.

3. **Card Type Detection**: Identify and log the card type (Visa, MasterCard, etc.) before redaction.

4. **Multiple Placeholders**: Use different placeholders for different card types.

5. **Logging Integration**: Create a logging filter that automatically redacts credit card numbers.

### Evaluation Criteria

- Accuracy of pattern matching
- Handling of edge cases
- Performance with large text blocks
- Code maintainability
- Security considerations

### Security Notes

- Never log actual credit card numbers
- Consider PCI DSS compliance requirements
- Test thoroughly with various input formats
- Handle international card number formats
