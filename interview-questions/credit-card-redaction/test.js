// Jest tests for Credit Card Redaction solution
const { CreditCardRedactor } = require('./solution');

describe('Credit Card Redaction', () => {
  let redactor;
  let redactorCustom;

  beforeEach(() => {
    redactor = new CreditCardRedactor();
    redactorCustom = new CreditCardRedactor("XXX");
  });

  describe('Basic Redaction', () => {
    test('should redact single credit card number', () => {
      const text = "Payment with card 4532 0151 1283 0366 successful";
      const result = redactor.redactText(text);
      const expected = "Payment with card [REDACTED] successful";
      expect(result).toBe(expected);
    });

    test('should redact multiple credit card numbers', () => {
      const text = "Cards: 4532 0151 1283 0366 and 5555 5555 5555 4444";
      const result = redactor.redactText(text);
      const expected = "Cards: [REDACTED] and [REDACTED]";
      expect(result).toBe(expected);
    });

    test('should handle different card formats', () => {
      const text = "Card 4532-0151-1283-0366 or 4532015112830366";
      const result = redactor.redactText(text);
      const expected = "Card [REDACTED] or [REDACTED]";
      expect(result).toBe(expected);
    });

    test('should leave text unchanged when no cards present', () => {
      const text = "No card numbers in this text";
      const result = redactor.redactText(text);
      expect(result).toBe(text);
    });
  });

  describe('Custom Placeholder', () => {
    test('should use custom placeholder', () => {
      const customRedactor = new CreditCardRedactor("***");
      const text = "Card 4532 0151 1283 0366";
      const result = customRedactor.redactText(text);
      const expected = "Card ***";
      expect(result).toBe(expected);
    });

    test('should use custom placeholder for class method', () => {
      const text = "Processing 4532 0151 1283 0366...";
      const result = redactorCustom.redactText(text);
      const expected = "Processing XXX...";
      expect(result).toBe(expected);
    });
  });

  describe('Partial Redaction', () => {
    test('should show last 4 digits in partial redaction', () => {
      const text = "Processing 4532 0151 1283 0366...";
      const result = redactorCustom.redactWithPartialDisplay(text, 4);
      const expected = "Processing **** **** **** 0366...";
      expect(result).toBe(expected);
    });

    test('should handle different showLast values', () => {
      const text = "Card 4532 0151 1283 0366";
      const result = redactor.redactWithPartialDisplay(text, 2);
      const expected = "Card **** **** **** 66";
      expect(result).toBe(expected);
    });
  });

  describe('Card Type Detection', () => {
    test('should detect Visa cards', () => {
      const card = "4532 0151 1283 0366";
      const result = redactor.getCardType(card);
      expect(result).toBe('Visa');
    });

    test('should detect MasterCard', () => {
      const card = "5555 5555 5555 4444";
      const result = redactor.getCardType(card);
      expect(result).toBe('MasterCard');
    });

    test('should detect American Express', () => {
      const card = "3782 822463 10005";
      const result = redactor.getCardType(card);
      expect(result).toBe('American Express');
    });

    test('should detect Discover', () => {
      const card = "6011 1111 1111 1117";
      const result = redactor.getCardType(card);
      expect(result).toBe('Discover');
    });

    test('should return Unknown for unrecognized cards', () => {
      const card = "1234 5678 9012 3456";
      const result = redactor.getCardType(card);
      expect(result).toBe('Unknown');
    });
  });

  describe('Luhn Algorithm Validation', () => {
    test('should validate correct Luhn checksum', () => {
      const validCard = "4532015112830366";
      const result = redactor.luhnChecksum(validCard);
      expect(result).toBe(true);
    });

    test('should reject invalid Luhn checksum', () => {
      const invalidCard = "1234567890123456";
      const result = redactor.luhnChecksum(invalidCard);
      expect(result).toBe(false);
    });

    test('should reject non-numeric input', () => {
      const nonNumeric = "abcd1234efgh5678";
      const result = redactor.luhnChecksum(nonNumeric);
      expect(result).toBe(false);
    });

    test('should reject cards with wrong length', () => {
      const shortCard = "123456789012";
      const longCard = "12345678901234567890";
      expect(redactor.luhnChecksum(shortCard)).toBe(false);
      expect(redactor.luhnChecksum(longCard)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle mixed separators', () => {
      const text = "Edge case: 4532-1234 5678 9012 (mixed separators)";
      const result = redactor.redactText(text);
      // Should not redact invalid cards (wrong Luhn checksum)
      expect(result).toBe(text);
    });

    test('should handle invalid card numbers', () => {
      const text = "Invalid: 1234 5678 9012 (too short)";
      const result = redactor.redactText(text);
      expect(result).toBe(text);
    });

    test('should handle empty string', () => {
      const result = redactor.redactText("");
      expect(result).toBe("");
    });

    test('should handle text with only spaces', () => {
      const text = "   ";
      const result = redactor.redactText(text);
      expect(result).toBe(text);
    });
  });

  describe('Complex Scenarios', () => {
    const testCases = [
      {
        name: 'Payment with valid card',
        input: "Payment with card 4532 0151 1283 0366 successful",
        expected: "Payment with card [REDACTED] successful"
      },
      {
        name: 'Multiple valid cards',
        input: "Multiple cards: 4532 0151 1283 0366 and 5555 5555 5555 4444",
        expected: "Multiple cards: [REDACTED] and [REDACTED]"
      },
      {
        name: 'Customer payment with amount',
        input: "Customer payment: 4532 0151 1283 0366, amount: $100.00",
        expected: "Customer payment: [REDACTED], amount: $100.00"
      }
    ];

    testCases.forEach(({ name, input, expected }) => {
      test(`should handle ${name}`, () => {
        const result = redactor.redactText(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Performance and Robustness', () => {
    test('should handle large text with multiple cards', () => {
      const largeText = Array(100).fill("Payment with card 4532 0151 1283 0366").join(" ");
      const result = redactor.redactText(largeText);
      expect(result).toContain("[REDACTED]");
      expect(result).not.toContain("4532 0151 1283 0366");
    });

    test('should maintain text structure', () => {
      const text = "Processing payment 4532 0151 1283 0366 for customer John Doe.";
      const result = redactor.redactText(text);
      expect(result).toBe("Processing payment [REDACTED] for customer John Doe.");
    });
  });
});