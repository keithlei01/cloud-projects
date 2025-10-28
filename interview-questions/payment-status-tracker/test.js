const { PaymentStatusTracker } = require('./solution');

describe('Payment Status Tracker', () => {
  let tracker;

  beforeEach(() => {
    tracker = new PaymentStatusTracker();
  });

  describe('Payment Creation', () => {
    test('should create payment with default pending status', () => {
      const payment = tracker.createPayment('pay_123');
      
      expect(payment.id).toBe('pay_123');
      expect(payment.status).toBe('pending');
      expect(payment.history).toHaveLength(1);
      expect(payment.history[0].status).toBe('pending');
      expect(payment.history[0].reason).toBe('Payment created');
    });

    test('should create payment with custom initial status', () => {
      const payment = tracker.createPayment('pay_456', 'processing');
      
      expect(payment.id).toBe('pay_456');
      expect(payment.status).toBe('processing');
      expect(payment.history[0].status).toBe('processing');
    });

    test('should track creation timestamp', () => {
      const before = Date.now();
      const payment = tracker.createPayment('pay_789');
      const after = Date.now();
      
      expect(payment.createdAt).toBeGreaterThanOrEqual(before);
      expect(payment.createdAt).toBeLessThanOrEqual(after);
      expect(payment.updatedAt).toBe(payment.createdAt);
    });
  });

  describe('Status Updates', () => {
    test('should update status successfully', () => {
      tracker.createPayment('pay_123');
      
      const result = tracker.updateStatus('pay_123', 'processing', 'Started processing');
      
      expect(result.success).toBe(true);
      expect(result.payment?.status).toBe('processing');
      expect(result.payment?.history).toHaveLength(2);
      expect(result.payment?.history[1].reason).toBe('Started processing');
    });

    test('should reject invalid state transitions', () => {
      tracker.createPayment('pay_123');
      tracker.updateStatus('pay_123', 'processing');
      tracker.updateStatus('pay_123', 'succeeded');
      
      // Try to go back to processing from succeeded
      const result = tracker.updateStatus('pay_123', 'processing');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid state transition');
    });

    test('should reject self-transitions', () => {
      tracker.createPayment('pay_123');
      
      const result = tracker.updateStatus('pay_123', 'pending');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid state transition');
    });

    test('should return error for non-existent payment', () => {
      const result = tracker.updateStatus('pay_nonexistent', 'processing');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Payment not found');
    });
  });

  describe('Valid Transitions', () => {
    test('should allow pending to processing', () => {
      tracker.createPayment('pay_123');
      const result = tracker.updateStatus('pay_123', 'processing');
      expect(result.success).toBe(true);
    });

    test('should allow pending to canceled', () => {
      tracker.createPayment('pay_123');
      const result = tracker.updateStatus('pay_123', 'canceled');
      expect(result.success).toBe(true);
    });

    test('should allow processing to succeeded', () => {
      tracker.createPayment('pay_123');
      tracker.updateStatus('pay_123', 'processing');
      const result = tracker.updateStatus('pay_123', 'succeeded');
      expect(result.success).toBe(true);
    });

    test('should allow processing to failed', () => {
      tracker.createPayment('pay_123');
      tracker.updateStatus('pay_123', 'processing');
      const result = tracker.updateStatus('pay_123', 'failed');
      expect(result.success).toBe(true);
    });

    test('should allow succeeded to refunded', () => {
      tracker.createPayment('pay_123');
      tracker.updateStatus('pay_123', 'processing');
      tracker.updateStatus('pay_123', 'succeeded');
      const result = tracker.updateStatus('pay_123', 'refunded');
      expect(result.success).toBe(true);
    });

    test('should allow partially_refunded to refunded', () => {
      tracker.createPayment('pay_123');
      tracker.updateStatus('pay_123', 'processing');
      tracker.updateStatus('pay_123', 'succeeded');
      tracker.updateStatus('pay_123', 'partially_refunded');
      const result = tracker.updateStatus('pay_123', 'refunded');
      expect(result.success).toBe(true);
    });
  });

  describe('Payment Retrieval', () => {
    test('should get payment by ID', () => {
      tracker.createPayment('pay_123');
      
      const payment = tracker.getPayment('pay_123');
      
      expect(payment).not.toBeNull();
      expect(payment?.id).toBe('pay_123');
    });

    test('should return null for non-existent payment', () => {
      const payment = tracker.getPayment('pay_nonexistent');
      expect(payment).toBeNull();
    });

    test('should get payments by status', () => {
      tracker.createPayment('pay_1');
      tracker.createPayment('pay_2');
      tracker.createPayment('pay_3');
      
      tracker.updateStatus('pay_1', 'processing');
      tracker.updateStatus('pay_2', 'processing');
      
      const processingPayments = tracker.getPaymentsByStatus('processing');
      const pendingPayments = tracker.getPaymentsByStatus('pending');
      
      expect(processingPayments).toHaveLength(2);
      expect(pendingPayments).toHaveLength(1);
    });
  });

  describe('Status History', () => {
    test('should track complete status history', () => {
      tracker.createPayment('pay_123');
      tracker.updateStatus('pay_123', 'processing');
      tracker.updateStatus('pay_123', 'succeeded');
      
      const history = tracker.getStatusHistory('pay_123');
      
      expect(history).toHaveLength(3);
      expect(history[0].status).toBe('pending');
      expect(history[1].status).toBe('processing');
      expect(history[2].status).toBe('succeeded');
    });

    test('should return empty array for non-existent payment', () => {
      const history = tracker.getStatusHistory('pay_nonexistent');
      expect(history).toHaveLength(0);
    });
  });

  describe('Time-based Queries', () => {
    test('should get payments in time range', () => {
      const now = Date.now();
      const oneHourAgo = now - 3600000;
      const twoHoursAgo = now - 7200000;
      
      // Create payments at different times
      tracker.createPayment('pay_1');
      tracker.createPayment('pay_2');
      tracker.createPayment('pay_3');
      
      const recentPayments = tracker.getPaymentsInTimeRange(oneHourAgo, now);
      expect(recentPayments.length).toBeGreaterThan(0);
    });

    test('should detect stuck payments', async () => {
      tracker.createPayment('pay_123');
      tracker.updateStatus('pay_123', 'processing');
      
      // Simulate payment stuck in processing for too long
      const stuckPayments = tracker.getStuckPayments('processing', 1000); // 1 second
      
      expect(stuckPayments).toHaveLength(0); // Should not be stuck yet
      
      // Wait a bit and check again
      await new Promise(resolve => setTimeout(resolve, 200));
      const stuckPaymentsAfterDelay = tracker.getStuckPayments('processing', 100);
      expect(stuckPaymentsAfterDelay.length).toBeGreaterThan(0);
    });
  });

  describe('Statistics', () => {
    test('should calculate status statistics', () => {
      tracker.createPayment('pay_1');
      tracker.createPayment('pay_2');
      tracker.createPayment('pay_3');
      
      tracker.updateStatus('pay_1', 'processing');
      tracker.updateStatus('pay_2', 'processing');
      tracker.updateStatus('pay_2', 'succeeded');
      
      const stats = tracker.getStatusStatistics();
      
      expect(stats.pending).toBe(1);
      expect(stats.processing).toBe(1);
      expect(stats.succeeded).toBe(1);
      expect(stats.failed).toBe(0);
    });

    test('should calculate average processing time', async () => {
      tracker.createPayment('pay_1');
      tracker.updateStatus('pay_1', 'processing');
      
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 100));
      tracker.updateStatus('pay_1', 'succeeded');
      
      const avgTime = tracker.getAverageProcessingTime();
      expect(avgTime).toBeGreaterThan(0);
    });
  });

  describe('Convenience Methods', () => {
    test('should cancel payment', () => {
      tracker.createPayment('pay_123');
      
      const result = tracker.cancelPayment('pay_123', 'Customer requested');
      
      expect(result.success).toBe(true);
      expect(result.payment?.status).toBe('canceled');
    });

    test('should refund payment', () => {
      tracker.createPayment('pay_123');
      tracker.updateStatus('pay_123', 'processing');
      tracker.updateStatus('pay_123', 'succeeded');
      
      const result = tracker.refundPayment('pay_123', 'Customer refund');
      
      expect(result.success).toBe(true);
      expect(result.payment?.status).toBe('refunded');
    });

    test('should get valid transitions', () => {
      const pendingTransitions = tracker.getValidTransitions('pending');
      const succeededTransitions = tracker.getValidTransitions('succeeded');
      
      expect(pendingTransitions).toContain('processing');
      expect(pendingTransitions).toContain('canceled');
      expect(succeededTransitions).toContain('refunded');
      expect(succeededTransitions).toContain('partially_refunded');
    });
  });

  describe('Cleanup', () => {
    test('should clean up old payments', () => {
      tracker.createPayment('pay_1');
      tracker.createPayment('pay_2');
      
      const removedCount = tracker.cleanupOldPayments(-1); // Remove all (negative means all are older)
      
      expect(removedCount).toBe(2);
      
      const payment = tracker.getPayment('pay_1');
      expect(payment).toBeNull();
    });
  });
});
