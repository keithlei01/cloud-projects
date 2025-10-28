const { WebhookEventProcessor } = require('./solution');

describe('Webhook Event Processor', () => {
  let processor;

  beforeEach(() => {
    processor = new WebhookEventProcessor();
  });

  describe('Event Processing', () => {
    test('should process valid webhook event', async () => {
      const event = {
        id: 'evt_123',
        type: 'payment.succeeded',
        data: {
          object: {
            id: 'pay_456',
            amount: 2000,
            currency: 'usd'
          }
        },
        created: 1234567890,
        livemode: true
      };

      const result = await processor.processEvent(event);

      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      expect(result.eventId).toBe('evt_123');
      expect(result.processingTime).toBeGreaterThan(0);
    });

    test('should handle duplicate events', async () => {
      const event = {
        id: 'evt_123',
        type: 'payment.succeeded',
        data: {
          object: {
            id: 'pay_456',
            amount: 2000
          }
        },
        created: 1234567890,
        livemode: true
      };

      // Process first time
      const firstResult = await processor.processEvent(event);
      expect(firstResult.processed).toBe(true);

      // Process duplicate
      const duplicateResult = await processor.processEvent(event);
      expect(duplicateResult.processed).toBe(false);
      expect(duplicateResult.success).toBe(true);
    });

    test('should validate required fields', async () => {
      const invalidEvent = {
        id: '',
        type: 'payment.succeeded',
        data: { object: {} },
        created: 1234567890,
        livemode: true
      };

      const result = await processor.processEvent(invalidEvent);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Event ID is required');
    });

    test('should handle different event types', async () => {
      const paymentEvent = {
        id: 'evt_1',
        type: 'payment.succeeded',
        data: { object: { id: 'pay_1' } },
        created: 1234567890,
        livemode: true
      };

      const customerEvent = {
        id: 'evt_2',
        type: 'customer.created',
        data: { object: { id: 'cus_1', email: 'test@example.com' } },
        created: 1234567890,
        livemode: true
      };

      const paymentResult = await processor.processEvent(paymentEvent);
      const customerResult = await processor.processEvent(customerEvent);

      expect(paymentResult.success).toBe(true);
      expect(customerResult.success).toBe(true);
    });
  });

  describe('Event Type Handling', () => {
    test('should handle payment succeeded events', async () => {
      const event = {
        id: 'evt_123',
        type: 'payment.succeeded',
        data: {
          object: {
            id: 'pay_456',
            amount: 2000,
            currency: 'usd'
          }
        },
        created: 1234567890,
        livemode: true
      };

      const result = await processor.processEvent(event);
      expect(result.success).toBe(true);
    });

    test('should handle payment failed events', async () => {
      const event = {
        id: 'evt_123',
        type: 'payment.failed',
        data: {
          object: {
            id: 'pay_456',
            failure_reason: 'insufficient_funds'
          }
        },
        created: 1234567890,
        livemode: true
      };

      const result = await processor.processEvent(event);
      expect(result.success).toBe(true);
    });

    test('should handle dispute created events', async () => {
      const event = {
        id: 'evt_123',
        type: 'charge.dispute.created',
        data: {
          object: {
            id: 'dp_456',
            amount: 1000,
            reason: 'fraudulent'
          }
        },
        created: 1234567890,
        livemode: true
      };

      const result = await processor.processEvent(event);
      expect(result.success).toBe(true);
    });

    test('should handle generic events', async () => {
      const event = {
        id: 'evt_123',
        type: 'unknown.event.type',
        data: {
          object: {
            id: 'obj_456'
          }
        },
        created: 1234567890,
        livemode: true
      };

      const result = await processor.processEvent(event);
      expect(result.success).toBe(true);
    });
  });

  describe('Event Tracking', () => {
    test('should track processed events', async () => {
      const event = {
        id: 'evt_123',
        type: 'payment.succeeded',
        data: { object: { id: 'pay_456' } },
        created: 1234567890,
        livemode: true
      };

      await processor.processEvent(event);

      expect(processor.isEventProcessed('evt_123')).toBe(true);
      expect(processor.isEventProcessed('evt_nonexistent')).toBe(false);
    });

    test('should track event history', async () => {
      const event = {
        id: 'evt_123',
        type: 'payment.succeeded',
        data: { object: { id: 'pay_456' } },
        created: 1234567890,
        livemode: true
      };

      await processor.processEvent(event);

      const history = processor.getEventHistory('evt_123');
      expect(history).not.toBeNull();
      expect(history?.success).toBe(true);
      expect(history?.timestamp).toBeGreaterThan(0);
    });

    test('should get all processed event IDs', async () => {
      const events = [
        {
          id: 'evt_1',
          type: 'payment.succeeded',
          data: { object: { id: 'pay_1' } },
          created: 1234567890,
          livemode: true
        },
        {
          id: 'evt_2',
          type: 'customer.created',
          data: { object: { id: 'cus_1' } },
          created: 1234567890,
          livemode: true
        }
      ];

      for (const event of events) {
        await processor.processEvent(event);
      }

      const processedIds = processor.getProcessedEventIds();
      expect(processedIds).toContain('evt_1');
      expect(processedIds).toContain('evt_2');
      expect(processedIds).toHaveLength(2);
    });
  });

  describe('Metrics', () => {
    test('should track processing metrics', async () => {
      const events = [
        {
          id: 'evt_1',
          type: 'payment.succeeded',
          data: { object: { id: 'pay_1' } },
          created: 1234567890,
          livemode: true
        },
        {
          id: 'evt_2',
          type: 'payment.succeeded',
          data: { object: { id: 'pay_2' } },
          created: 1234567890,
          livemode: true
        },
        {
          id: 'evt_3',
          type: 'customer.created',
          data: { object: { id: 'cus_1' } },
          created: 1234567890,
          livemode: true
        }
      ];

      for (const event of events) {
        await processor.processEvent(event);
      }

      const metrics = processor.getMetrics();

      expect(metrics.totalProcessed).toBe(3);
      expect(metrics.totalFailed).toBe(0);
      expect(metrics.averageProcessingTime).toBeGreaterThan(0);
      expect(metrics.eventsByType['payment.succeeded']).toBe(2);
      expect(metrics.eventsByType['customer.created']).toBe(1);
    });

    test('should track failure metrics', async () => {
      const invalidEvent = {
        id: '',
        type: 'payment.succeeded',
        data: { object: {} },
        created: 1234567890,
        livemode: true
      };

      await processor.processEvent(invalidEvent);

      const metrics = processor.getMetrics();
      expect(metrics.totalFailed).toBe(1);
    });
  });

  describe('Event Filtering', () => {
    test('should filter events by criteria', async () => {
      const events = [
        {
          id: 'evt_1',
          type: 'payment.succeeded',
          data: { object: { id: 'pay_1' } },
          created: 1234567890,
          livemode: true
        },
        {
          id: 'evt_2',
          type: 'customer.created',
          data: { object: { id: 'cus_1' } },
          created: 1234567890,
          livemode: false
        }
      ];

      for (const event of events) {
        await processor.processEvent(event);
      }

      const liveEvents = processor.filterEvents({ livemode: true });
      const testEvents = processor.filterEvents({ livemode: false });

      expect(liveEvents.length).toBeGreaterThan(0);
      expect(testEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Cleanup', () => {
    test('should clean up old events', async () => {
      const event = {
        id: 'evt_123',
        type: 'payment.succeeded',
        data: { object: { id: 'pay_456' } },
        created: 1234567890,
        livemode: true
      };

      await processor.processEvent(event);

      // Clean up events older than 0ms (all events)
      const removedCount = processor.cleanupOldEvents(0);

      expect(removedCount).toBe(1);
      expect(processor.isEventProcessed('evt_123')).toBe(false);
    });
  });

  describe('Reset', () => {
    test('should reset processor state', async () => {
      const event = {
        id: 'evt_123',
        type: 'payment.succeeded',
        data: { object: { id: 'pay_456' } },
        created: 1234567890,
        livemode: true
      };

      await processor.processEvent(event);
      expect(processor.isEventProcessed('evt_123')).toBe(true);

      processor.reset();
      expect(processor.isEventProcessed('evt_123')).toBe(false);

      const metrics = processor.getMetrics();
      expect(metrics.totalProcessed).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle processing errors gracefully', async () => {
      const event = {
        id: 'evt_123',
        type: 'payment.succeeded',
        data: null, // Invalid data
        created: 1234567890,
        livemode: true
      };

      const result = await processor.processEvent(event);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.processed).toBe(false);
    });

    test('should not mark event as processed on error', async () => {
      const event = {
        id: 'evt_123',
        type: 'payment.succeeded',
        data: null,
        created: 1234567890,
        livemode: true
      };

      await processor.processEvent(event);

      expect(processor.isEventProcessed('evt_123')).toBe(false);
    });
  });
});
