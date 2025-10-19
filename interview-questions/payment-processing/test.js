// Jest tests for Payment Processing solution
const { PaymentService, PaymentError, InvalidPaymentMethodError, InsufficientFundsError, FraudDetectedError } = require('./solution');

describe('Payment Processing', () => {
  let paymentService;

  beforeEach(() => {
    paymentService = new PaymentService();
  });

  describe('Payment Service Creation', () => {
    test('should create PaymentService successfully', () => {
      expect(paymentService).toBeDefined();
      expect(paymentService).toBeInstanceOf(PaymentService);
    });
  });

  describe('Error Classes', () => {
    test('should create PaymentError correctly', () => {
      const error = new PaymentError('Payment failed');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Payment failed');
    });

    test('should create InvalidPaymentMethodError correctly', () => {
      const error = new InvalidPaymentMethodError('Invalid payment method');
      expect(error).toBeInstanceOf(PaymentError);
      expect(error.message).toBe('Invalid payment method');
    });

    test('should create InsufficientFundsError correctly', () => {
      const error = new InsufficientFundsError('Insufficient funds');
      expect(error).toBeInstanceOf(PaymentError);
      expect(error.message).toBe('Insufficient funds');
    });

    test('should create FraudDetectedError correctly', () => {
      const error = new FraudDetectedError('Fraud detected');
      expect(error).toBeInstanceOf(PaymentError);
      expect(error.message).toBe('Fraud detected');
    });
  });

  describe('Payment Creation', () => {
    test('should create payment successfully', async () => {
      const paymentData = {
        amount: 1000,
        currency: 'USD',
        payment_method: 'credit_card',
        customer_id: 'cus_test123',
        description: 'Test payment'
      };

      const payment = await paymentService.createPayment(paymentData);
      expect(payment).toBeDefined();
      expect(payment.id).toBeDefined();
      expect(payment.status).toBe('pending');
      expect(payment.amount).toBe(1000);
    });

    test('should validate payment data', async () => {
      const invalidPaymentData = {
        amount: -100, // Invalid amount
        currency: 'USD',
        payment_method: 'credit_card',
        customer_id: 'cus_test123'
      };

      await expect(paymentService.createPayment(invalidPaymentData)).rejects.toThrow(PaymentError);
    });

    test('should handle missing required fields', async () => {
      const incompletePaymentData = {
        amount: 1000,
        currency: 'USD'
        // Missing payment_method and customer_id
      };

      await expect(paymentService.createPayment(incompletePaymentData)).rejects.toThrow(PaymentError);
    });
  });

  describe('Payment Processing', () => {
    test('should process payment successfully', async () => {
      const paymentData = {
        amount: 1000,
        currency: 'USD',
        payment_method: 'credit_card',
        customer_id: 'cus_test123',
        description: 'Test payment'
      };

      const payment = await paymentService.createPayment(paymentData);
      const result = await paymentService.processPayment(payment.id);

      expect(result.status).toBe('succeeded');
    });

    test('should handle payment failures', async () => {
      const paymentData = {
        amount: 1000,
        currency: 'USD',
        payment_method: 'invalid_method',
        customer_id: 'cus_test123',
        description: 'Test payment'
      };

      const payment = await paymentService.createPayment(paymentData);
      await expect(paymentService.processPayment(payment.id)).rejects.toThrow(InvalidPaymentMethodError);
    });
  });

  describe('Payment Authorization', () => {
    test('should authorize payment', async () => {
      const paymentData = {
        amount: 1000,
        currency: 'USD',
        payment_method: 'credit_card',
        customer_id: 'cus_test123',
        description: 'Test payment'
      };

      const payment = await paymentService.createPayment(paymentData);
      const result = await paymentService.authorizePayment(payment.id);

      expect(result.status).toBe('authorized');
    });

    test('should handle authorization failures', async () => {
      const paymentData = {
        amount: 1000000, // Very large amount
        currency: 'USD',
        payment_method: 'credit_card',
        customer_id: 'cus_test123',
        description: 'Test payment'
      };

      const payment = await paymentService.createPayment(paymentData);
      await expect(paymentService.authorizePayment(payment.id)).rejects.toThrow();
    });
  });

  describe('Payment Capture', () => {
    test('should capture authorized payment', async () => {
      const paymentData = {
        amount: 1000,
        currency: 'USD',
        payment_method: 'credit_card',
        customer_id: 'cus_test123',
        description: 'Test payment'
      };

      const payment = await paymentService.createPayment(paymentData);
      await paymentService.authorizePayment(payment.id);
      const result = await paymentService.capturePayment(payment.id);

      expect(result.status).toBe('succeeded');
    });

    test('should handle capture of non-authorized payment', async () => {
      const paymentData = {
        amount: 1000,
        currency: 'USD',
        payment_method: 'credit_card',
        customer_id: 'cus_test123',
        description: 'Test payment'
      };

      const payment = await paymentService.createPayment(paymentData);
      await expect(paymentService.capturePayment(payment.id)).rejects.toThrow(PaymentError);
    });
  });

  describe('Payment Refund', () => {
    test('should refund successful payment', async () => {
      const paymentData = {
        amount: 1000,
        currency: 'USD',
        payment_method: 'credit_card',
        customer_id: 'cus_test123',
        description: 'Test payment'
      };

      const payment = await paymentService.createPayment(paymentData);
      await paymentService.processPayment(payment.id);
      const result = await paymentService.refundPayment(payment.id, 500);

      expect(result.status).toBe('refunded');
      expect(result.refunded_amount).toBe(500);
    });

    test('should handle full refund', async () => {
      const paymentData = {
        amount: 1000,
        currency: 'USD',
        payment_method: 'credit_card',
        customer_id: 'cus_test123',
        description: 'Test payment'
      };

      const payment = await paymentService.createPayment(paymentData);
      await paymentService.processPayment(payment.id);
      const result = await paymentService.refundPayment(payment.id);

      expect(result.status).toBe('refunded');
      expect(result.refunded_amount).toBe(1000);
    });

    test('should handle refund of non-successful payment', async () => {
      const paymentData = {
        amount: 1000,
        currency: 'USD',
        payment_method: 'credit_card',
        customer_id: 'cus_test123',
        description: 'Test payment'
      };

      const payment = await paymentService.createPayment(paymentData);
      await expect(paymentService.refundPayment(payment.id)).rejects.toThrow(PaymentError);
    });
  });

  describe('Payment Cancellation', () => {
    test('should cancel pending payment', async () => {
      const paymentData = {
        amount: 1000,
        currency: 'USD',
        payment_method: 'credit_card',
        customer_id: 'cus_test123',
        description: 'Test payment'
      };

      const payment = await paymentService.createPayment(paymentData);
      const result = await paymentService.cancelPayment(payment.id);

      expect(result.status).toBe('cancelled');
    });

    test('should handle cancellation of processed payment', async () => {
      const paymentData = {
        amount: 1000,
        currency: 'USD',
        payment_method: 'credit_card',
        customer_id: 'cus_test123',
        description: 'Test payment'
      };

      const payment = await paymentService.createPayment(paymentData);
      await paymentService.processPayment(payment.id);
      await expect(paymentService.cancelPayment(payment.id)).rejects.toThrow(PaymentError);
    });
  });

  describe('Fraud Detection', () => {
    test('should detect high-risk payments', async () => {
      const paymentData = {
        amount: 1000,
        currency: 'USD',
        payment_method: 'credit_card',
        customer_id: 'cus_test123',
        description: 'Test payment',
        metadata: {
          risk_score: 0.9 // High risk
        }
      };

      const payment = await paymentService.createPayment(paymentData);
      await expect(paymentService.processPayment(payment.id)).rejects.toThrow(FraudDetectedError);
    });

    test('should allow low-risk payments', async () => {
      const paymentData = {
        amount: 1000,
        currency: 'USD',
        payment_method: 'credit_card',
        customer_id: 'cus_test123',
        description: 'Test payment',
        metadata: {
          risk_score: 0.1 // Low risk
        }
      };

      const payment = await paymentService.createPayment(paymentData);
      const result = await paymentService.processPayment(payment.id);

      expect(result.status).toBe('succeeded');
    });
  });

  describe('Payment Methods', () => {
    test('should handle credit card payments', async () => {
      const paymentData = {
        amount: 1000,
        currency: 'USD',
        payment_method: 'credit_card',
        customer_id: 'cus_test123',
        description: 'Test payment'
      };

      const payment = await paymentService.createPayment(paymentData);
      expect(payment.payment_method).toBe('credit_card');
    });

    test('should handle bank transfer payments', async () => {
      const paymentData = {
        amount: 1000,
        currency: 'USD',
        payment_method: 'bank_transfer',
        customer_id: 'cus_test123',
        description: 'Test payment'
      };

      const payment = await paymentService.createPayment(paymentData);
      expect(payment.payment_method).toBe('bank_transfer');
    });

    test('should reject invalid payment methods', async () => {
      const paymentData = {
        amount: 1000,
        currency: 'USD',
        payment_method: 'invalid_method',
        customer_id: 'cus_test123',
        description: 'Test payment'
      };

      await expect(paymentService.createPayment(paymentData)).rejects.toThrow(InvalidPaymentMethodError);
    });
  });

  describe('Currency Support', () => {
    test('should handle multiple currencies', async () => {
      const currencies = ['USD', 'EUR', 'GBP', 'JPY'];

      for (const currency of currencies) {
        const paymentData = {
          amount: 1000,
          currency: currency,
          payment_method: 'credit_card',
          customer_id: 'cus_test123',
          description: 'Test payment'
        };

        const payment = await paymentService.createPayment(paymentData);
        expect(payment.currency).toBe(currency);
      }
    });

    test('should reject unsupported currencies', async () => {
      const paymentData = {
        amount: 1000,
        currency: 'INVALID',
        payment_method: 'credit_card',
        customer_id: 'cus_test123',
        description: 'Test payment'
      };

      await expect(paymentService.createPayment(paymentData)).rejects.toThrow(PaymentError);
    });
  });

  describe('Payment Retrieval', () => {
    test('should retrieve payment by ID', async () => {
      const paymentData = {
        amount: 1000,
        currency: 'USD',
        payment_method: 'credit_card',
        customer_id: 'cus_test123',
        description: 'Test payment'
      };

      const createdPayment = await paymentService.createPayment(paymentData);
      const retrievedPayment = await paymentService.getPayment(createdPayment.id);

      expect(retrievedPayment.id).toBe(createdPayment.id);
      expect(retrievedPayment.amount).toBe(1000);
    });

    test('should handle non-existent payment', async () => {
      await expect(paymentService.getPayment('non_existent_id')).rejects.toThrow(PaymentError);
    });
  });

  describe('Payment History', () => {
    test('should retrieve customer payment history', async () => {
      const customerId = 'cus_test123';
      const paymentData = {
        amount: 1000,
        currency: 'USD',
        payment_method: 'credit_card',
        customer_id: customerId,
        description: 'Test payment'
      };

      await paymentService.createPayment(paymentData);
      const history = await paymentService.getCustomerPayments(customerId);

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });
  });
});