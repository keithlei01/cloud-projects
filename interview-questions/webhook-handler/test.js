// Jest tests for Webhook Handler solution
const { WebhookHandler, WebhookError, InvalidSignatureError, ProcessingError, DuplicateEventError } = require('./solution');

describe('Webhook Handler', () => {
  let webhookHandler;

  beforeEach(() => {
    webhookHandler = new WebhookHandler('test_webhook_secret');
  });

  describe('Webhook Handler Creation', () => {
    test('should create WebhookHandler successfully', () => {
      expect(webhookHandler).toBeDefined();
      expect(webhookHandler).toBeInstanceOf(WebhookHandler);
    });

    test('should accept webhook secret', () => {
      const handler = new WebhookHandler('custom_secret');
      expect(handler).toBeDefined();
    });
  });

  describe('Error Classes', () => {
    test('should create WebhookError correctly', () => {
      const error = new WebhookError('Webhook failed');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Webhook failed');
    });

    test('should create InvalidSignatureError correctly', () => {
      const error = new InvalidSignatureError('Invalid signature');
      expect(error).toBeInstanceOf(WebhookError);
      expect(error.message).toBe('Invalid signature');
    });

    test('should create ProcessingError correctly', () => {
      const error = new ProcessingError('Processing failed');
      expect(error).toBeInstanceOf(WebhookError);
      expect(error.message).toBe('Processing failed');
    });

    test('should create DuplicateEventError correctly', () => {
      const error = new DuplicateEventError('Duplicate event');
      expect(error).toBeInstanceOf(WebhookError);
      expect(error.message).toBe('Duplicate event');
    });
  });

  describe('Signature Verification', () => {
    test('should verify valid webhook signature', () => {
      const payload = '{"type":"payment.succeeded","data":{"id":"evt_123"}}';
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = webhookHandler.generateSignature(payload, timestamp);

      const isValid = webhookHandler.verifySignature(payload, signature, timestamp);
      expect(isValid).toBe(true);
    });

    test('should reject invalid webhook signature', () => {
      const payload = '{"type":"payment.succeeded","data":{"id":"evt_123"}}';
      const timestamp = Math.floor(Date.now() / 1000);
      const invalidSignature = 'invalid_signature';

      const isValid = webhookHandler.verifySignature(payload, invalidSignature, timestamp);
      expect(isValid).toBe(false);
    });

    test('should reject expired webhook signature', () => {
      const payload = '{"type":"payment.succeeded","data":{"id":"evt_123"}}';
      const expiredTimestamp = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago
      const signature = webhookHandler.generateSignature(payload, expiredTimestamp);

      const isValid = webhookHandler.verifySignature(payload, signature, expiredTimestamp);
      expect(isValid).toBe(false);
    });

    test('should handle malformed signature', () => {
      const payload = '{"type":"payment.succeeded","data":{"id":"evt_123"}}';
      const timestamp = Math.floor(Date.now() / 1000);
      const malformedSignature = 't=123,v1=invalid';

      const isValid = webhookHandler.verifySignature(payload, malformedSignature, timestamp);
      expect(isValid).toBe(false);
    });
  });

  describe('Event Processing', () => {
    test('should process payment.succeeded event', async () => {
      const event = {
        id: 'evt_1234567890',
        type: 'payment.succeeded',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: 'txn_1234567890',
            amount: 1000,
            currency: 'USD',
            status: 'succeeded',
            customer_id: 'cus_1234567890'
          }
        }
      };

      const result = await webhookHandler.processEvent(event);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    test('should process payment.failed event', async () => {
      const event = {
        id: 'evt_1234567891',
        type: 'payment.failed',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: 'txn_1234567891',
            amount: 1000,
            currency: 'USD',
            status: 'failed',
            customer_id: 'cus_1234567890'
          }
        }
      };

      const result = await webhookHandler.processEvent(event);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    test('should process customer.created event', async () => {
      const event = {
        id: 'evt_1234567892',
        type: 'customer.created',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: 'cus_1234567890',
            email: 'test@example.com',
            name: 'Test Customer'
          }
        }
      };

      const result = await webhookHandler.processEvent(event);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    test('should handle unknown event types', async () => {
      const event = {
        id: 'evt_1234567893',
        type: 'unknown.event',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: 'obj_123'
          }
        }
      };

      const result = await webhookHandler.processEvent(event);
      expect(result).toBeDefined();
      expect(result.success).toBe(true); // Should handle gracefully
    });
  });

  describe('Idempotency', () => {
    test('should handle duplicate events', async () => {
      const event = {
        id: 'evt_duplicate_test',
        type: 'payment.succeeded',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: 'txn_duplicate_test',
            amount: 1000,
            currency: 'USD',
            status: 'succeeded'
          }
        }
      };

      // Process event first time
      const result1 = await webhookHandler.processEvent(event);
      expect(result1.success).toBe(true);

      // Process same event again
      const result2 = await webhookHandler.processEvent(event);
      expect(result2.success).toBe(true);
      expect(result2.duplicate).toBe(true);
    });

    test('should track processed events', async () => {
      const event = {
        id: 'evt_tracking_test',
        type: 'payment.succeeded',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: 'txn_tracking_test',
            amount: 1000,
            currency: 'USD',
            status: 'succeeded'
          }
        }
      };

      await webhookHandler.processEvent(event);
      const isProcessed = webhookHandler.isEventProcessed(event.id);
      expect(isProcessed).toBe(true);
    });
  });

  describe('Event Storage', () => {
    test('should store webhook events', async () => {
      const event = {
        id: 'evt_storage_test',
        type: 'payment.succeeded',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: 'txn_storage_test',
            amount: 1000,
            currency: 'USD',
            status: 'succeeded'
          }
        }
      };

      await webhookHandler.processEvent(event);
      const storedEvent = await webhookHandler.getEvent(event.id);
      expect(storedEvent).toBeDefined();
      expect(storedEvent.id).toBe(event.id);
    });

    test('should retrieve event history', async () => {
      const event = {
        id: 'evt_history_test',
        type: 'payment.succeeded',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: 'txn_history_test',
            amount: 1000,
            currency: 'USD',
            status: 'succeeded'
          }
        }
      };

      await webhookHandler.processEvent(event);
      const history = await webhookHandler.getEventHistory();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed event data', async () => {
      const malformedEvent = {
        id: 'evt_malformed',
        type: 'payment.succeeded',
        // Missing required fields
      };

      await expect(webhookHandler.processEvent(malformedEvent)).rejects.toThrow(ProcessingError);
    });

    test('should handle processing failures gracefully', async () => {
      const event = {
        id: 'evt_failure_test',
        type: 'payment.succeeded',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: 'txn_failure_test',
            amount: 1000,
            currency: 'USD',
            status: 'succeeded'
          }
        }
      };

      // Mock a processing failure
      const originalProcessPaymentSucceeded = webhookHandler.processPaymentSucceeded;
      webhookHandler.processPaymentSucceeded = jest.fn().mockRejectedValue(new Error('Processing failed'));

      await expect(webhookHandler.processEvent(event)).rejects.toThrow(ProcessingError);

      // Restore original method
      webhookHandler.processPaymentSucceeded = originalProcessPaymentSucceeded;
    });
  });

  describe('Event Validation', () => {
    test('should validate event structure', () => {
      const validEvent = {
        id: 'evt_123',
        type: 'payment.succeeded',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: 'txn_123',
            amount: 1000,
            currency: 'USD'
          }
        }
      };

      const isValid = webhookHandler.validateEvent(validEvent);
      expect(isValid).toBe(true);
    });

    test('should reject invalid event structure', () => {
      const invalidEvent = {
        // Missing required fields
        type: 'payment.succeeded'
      };

      const isValid = webhookHandler.validateEvent(invalidEvent);
      expect(isValid).toBe(false);
    });
  });

  describe('Security', () => {
    test('should handle replay attacks', () => {
      const payload = '{"type":"payment.succeeded","data":{"id":"evt_123"}}';
      const oldTimestamp = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago
      const signature = webhookHandler.generateSignature(payload, oldTimestamp);

      const isValid = webhookHandler.verifySignature(payload, signature, oldTimestamp);
      expect(isValid).toBe(false);
    });

    test('should validate timestamp format', () => {
      const payload = '{"type":"payment.succeeded","data":{"id":"evt_123"}}';
      const invalidTimestamp = 'invalid_timestamp';
      const signature = webhookHandler.generateSignature(payload, Math.floor(Date.now() / 1000));

      const isValid = webhookHandler.verifySignature(payload, signature, invalidTimestamp);
      expect(isValid).toBe(false);
    });
  });

  describe('Performance', () => {
    test('should handle multiple events efficiently', async () => {
      const events = Array.from({ length: 10 }, (_, i) => ({
        id: `evt_perf_${i}`,
        type: 'payment.succeeded',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: `txn_perf_${i}`,
            amount: 1000,
            currency: 'USD',
            status: 'succeeded'
          }
        }
      }));

      const startTime = Date.now();
      const results = await Promise.all(events.map(event => webhookHandler.processEvent(event)));
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      expect(results.every(result => result.success)).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});