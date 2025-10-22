const { PaymentDataTransformer } = require('./solution');

describe('Payment Data Transformation', () => {
  let transformer;

  beforeEach(() => {
    transformer = new PaymentDataTransformer();
  });

  describe('Currency Conversion', () => {
    test('should convert dollar amounts to cents', () => {
      expect(transformer.convertToCents('$10.50', 'USD')).toBe(1050);
      expect(transformer.convertToCents('10.50', 'USD')).toBe(1050);
      expect(transformer.convertToCents('$1,234.56', 'USD')).toBe(123456);
    });

    test('should convert numeric amounts to cents', () => {
      expect(transformer.convertToCents(10.50, 'USD')).toBe(1050);
      expect(transformer.convertToCents(0.99, 'USD')).toBe(99);
      expect(transformer.convertToCents(100, 'USD')).toBe(10000);
    });

    test('should handle European number format', () => {
      expect(transformer.convertToCents('1.234,56', 'EUR')).toBe(123456);
      expect(transformer.convertToCents('10,50', 'EUR')).toBe(1050);
    });

    test('should handle different currency symbols', () => {
      expect(transformer.convertToCents('€10.50', 'EUR')).toBe(1050);
      expect(transformer.convertToCents('£25.00', 'GBP')).toBe(2500);
      expect(transformer.convertToCents('¥1000', 'JPY')).toBe(100000);
    });

    test('should throw error for invalid amount format', () => {
      expect(() => transformer.convertToCents('invalid', 'USD')).toThrow('Invalid amount format');
      expect(() => transformer.convertToCents('', 'USD')).toThrow('Invalid amount format');
    });
  });

  describe('Currency Formatting', () => {
    test('should format USD amounts correctly', () => {
      expect(transformer.formatCurrency(1050, 'USD')).toBe('$10.50');
      expect(transformer.formatCurrency(10000, 'USD')).toBe('$100.00');
      expect(transformer.formatCurrency(1, 'USD')).toBe('$0.01');
    });

    test('should format EUR amounts correctly', () => {
      expect(transformer.formatCurrency(1050, 'EUR')).toBe('€10.50');
      expect(transformer.formatCurrency(2500, 'EUR')).toBe('€25.00');
    });

    test('should format JPY amounts without decimals', () => {
      expect(transformer.formatCurrency(1000, 'JPY')).toBe('¥1,000');
      expect(transformer.formatCurrency(100000, 'JPY')).toBe('¥1,000');
    });

    test('should throw error for unsupported currency', () => {
      expect(() => transformer.formatCurrency(1000, 'BTC')).toThrow('Unsupported currency');
    });
  });

  describe('Payment Method Normalization', () => {
    test('should normalize credit card data', () => {
      const cardData = {
        card_number: '4242 4242 4242 4242',
        expiry_month: '12',
        expiry_year: '2025',
        cvc: '123'
      };

      const normalized = transformer.normalizePaymentMethod(cardData);
      
      expect(normalized.type).toBe('card');
      expect(normalized.card.number).toBe('4242424242424242');
      expect(normalized.card.exp_month).toBe(12);
      expect(normalized.card.exp_year).toBe(2025);
      expect(normalized.card.cvc).toBe('123');
    });

    test('should handle different card field names', () => {
      const cardData = {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2025,
        cvv: '123'
      };

      const normalized = transformer.normalizePaymentMethod(cardData);
      
      expect(normalized.type).toBe('card');
      expect(normalized.card.number).toBe('4242424242424242');
      expect(normalized.card.cvc).toBe('123');
    });

    test('should normalize bank account data', () => {
      const bankData = {
        account_number: '123456789',
        routing_number: '021000021',
        account_holder_name: 'John Doe',
        account_holder_type: 'individual'
      };

      const normalized = transformer.normalizePaymentMethod(bankData);
      
      expect(normalized.type).toBe('bank_account');
      expect(normalized.bank_account.account_number).toBe('123456789');
      expect(normalized.bank_account.routing_number).toBe('021000021');
      expect(normalized.bank_account.account_holder_name).toBe('John Doe');
      expect(normalized.bank_account.account_holder_type).toBe('individual');
    });

    test('should throw error for invalid payment method', () => {
      expect(() => transformer.normalizePaymentMethod(null)).toThrow('Payment method is required');
      expect(() => transformer.normalizePaymentMethod({})).toThrow('Unsupported payment method type');
    });
  });

  describe('Stripe API Transformation', () => {
    test('should transform complete payment data', () => {
      const internalData = {
        amount: '$10.50',
        currency: 'USD',
        payment_method: {
          card_number: '4242424242424242',
          expiry_month: '12',
          expiry_year: '2025',
          cvc: '123'
        },
        customer_id: 'cus_123',
        description: 'Test payment',
        metadata: {
          order_id: 'order_123',
          user_id: 'user_456'
        }
      };

      const stripeData = transformer.transformForStripeAPI(internalData);
      
      expect(stripeData.amount).toBe(1050);
      expect(stripeData.currency).toBe('usd');
      expect(stripeData.customer).toBe('cus_123');
      expect(stripeData.description).toBe('Test payment');
      expect(stripeData.payment_method.type).toBe('card');
      expect(stripeData.metadata.order_id).toBe('order_123');
    });

    test('should sanitize sensitive metadata', () => {
      const internalData = {
        amount: 1000,
        currency: 'USD',
        payment_method: {
          card_number: '4242424242424242',
          expiry_month: '12',
          expiry_year: '2025',
          cvc: '123'
        },
        metadata: {
          order_id: 'order_123',
          password: 'secret123',
          api_key: 'sk_test_123',
          ssn: '123-45-6789'
        }
      };

      const stripeData = transformer.transformForStripeAPI(internalData);
      
      expect(stripeData.metadata.order_id).toBe('order_123');
      expect(stripeData.metadata.password).toBe('[REDACTED]');
      expect(stripeData.metadata.api_key).toBe('[REDACTED]');
      expect(stripeData.metadata.ssn).toBe('[REDACTED]');
    });
  });

  describe('Payment Data Validation', () => {
    test('should validate correct payment data', () => {
      const validData = {
        amount: '$10.50',
        currency: 'USD',
        payment_method: {
          card_number: '4242424242424242',
          expiry_month: '12',
          expiry_year: '2025',
          cvc: '123'
        }
      };

      const result = transformer.validatePaymentData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect invalid currency', () => {
      const invalidData = {
        amount: '$10.50',
        currency: 'BTC',
        payment_method: {
          card_number: '4242424242424242',
          expiry_month: '12',
          expiry_year: '2025',
          cvc: '123'
        }
      };

      const result = transformer.validatePaymentData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unsupported currency: BTC');
    });

    test('should detect invalid amount', () => {
      const invalidData = {
        amount: 'invalid',
        currency: 'USD',
        payment_method: {
          card_number: '4242424242424242',
          expiry_month: '12',
          expiry_year: '2025',
          cvc: '123'
        }
      };

      const result = transformer.validatePaymentData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid amount'))).toBe(true);
    });

    test('should detect invalid card number length', () => {
      const invalidData = {
        amount: '$10.50',
        currency: 'USD',
        payment_method: {
          card_number: '1234',
          expiry_month: '12',
          expiry_year: '2025',
          cvc: '123'
        }
      };

      const result = transformer.validatePaymentData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid card number length');
    });

    test('should detect invalid Luhn check', () => {
      const invalidData = {
        amount: '$10.50',
        currency: 'USD',
        payment_method: {
          card_number: '4242424242424241', // Invalid Luhn
          expiry_month: '12',
          expiry_year: '2025',
          cvc: '123'
        }
      };

      const result = transformer.validatePaymentData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid card number (Luhn check failed)');
    });
  });

  describe('Supported Currencies', () => {
    test('should return supported currencies', () => {
      const currencies = transformer.getSupportedCurrencies();
      expect(currencies).toContain('USD');
      expect(currencies).toContain('EUR');
      expect(currencies).toContain('GBP');
      expect(currencies).toContain('CAD');
      expect(currencies).toContain('AUD');
      expect(currencies).toContain('JPY');
    });
  });
});
