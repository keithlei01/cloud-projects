const { PaymentRetryManager } = require('./solution');

describe('Payment Retry Logic', () => {
  let retryManager;

  beforeEach(() => {
    retryManager = new PaymentRetryManager({
      maxRetries: 2,
      baseDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 2,
      jitterRange: 0.1
    });
  });

  describe('Successful Operations', () => {
    test('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await retryManager.executeWithRetry(operation);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(1);
      expect(result.error).toBeUndefined();
      expect(operation).toHaveBeenCalledTimes(1);
    });

    test('should succeed after retries', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('network timeout'))
        .mockRejectedValueOnce(new Error('temporary failure'))
        .mockResolvedValue('success');
      
      const result = await retryManager.executeWithRetry(operation);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(3);
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  describe('Failed Operations', () => {
    test('should fail after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('network timeout'));
      
      const result = await retryManager.executeWithRetry(operation);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('network timeout');
      expect(result.attempts).toBe(3); // maxRetries + 1
      expect(operation).toHaveBeenCalledTimes(3);
    });

    test('should not retry non-retryable errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('invalid payment method'));
      
      const result = await retryManager.executeWithRetry(operation);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid payment method');
      expect(result.attempts).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    test('should respect custom retryable error property', async () => {
      const error = new Error('custom error');
      error.isRetryable = false;
      const operation = jest.fn().mockRejectedValue(error);
      
      const result = await retryManager.executeWithRetry(operation);
      
      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
    });
  });

  describe('Exponential Backoff', () => {
    test('should implement exponential backoff', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('network timeout'));
      const startTime = Date.now();
      
      await retryManager.executeWithRetry(operation);
      
      const totalTime = Date.now() - startTime;
      // Should have delays of ~100ms, ~200ms (with jitter)
      expect(totalTime).toBeGreaterThan(250);
      expect(totalTime).toBeLessThan(500);
    });

    test('should respect max delay', async () => {
      const retryManagerWithLongDelay = new PaymentRetryManager({
        maxRetries: 1,
        baseDelay: 1000,
        maxDelay: 200,
        backoffMultiplier: 10,
        jitterRange: 0
      });
      
      const operation = jest.fn().mockRejectedValue(new Error('network timeout'));
      const startTime = Date.now();
      
      await retryManagerWithLongDelay.executeWithRetry(operation);
      
      const totalTime = Date.now() - startTime;
      // Should cap at maxDelay (200ms) instead of 10000ms
      expect(totalTime).toBeLessThan(500);
    });
  });

  describe('Retry After Header', () => {
    test('should respect retry-after header', async () => {
      const error = new Error('rate limit exceeded');
      error.retryAfter = 0.1; // 100ms
      const operation = jest.fn().mockRejectedValue(error);
      
      const startTime = Date.now();
      await retryManager.executeWithRetry(operation);
      const totalTime = Date.now() - startTime;
      
      // Should wait at least 100ms for retry-after
      expect(totalTime).toBeGreaterThan(90);
    });
  });

  describe('Circuit Breaker', () => {
    test('should open circuit breaker after threshold failures', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('network timeout'));
      
      // Trigger multiple failures to open circuit breaker
      for (let i = 0; i < 6; i++) {
        await retryManager.executeWithRetry(operation);
      }
      
      const status = retryManager.getCircuitBreakerStatus();
      expect(status.isOpen).toBe(true);
      expect(status.failures).toBeGreaterThanOrEqual(5);
    });

    test('should fail immediately when circuit breaker is open', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('network timeout'));
      
      // Open circuit breaker
      for (let i = 0; i < 6; i++) {
        await retryManager.executeWithRetry(operation);
      }
      
      // Next call should fail immediately
      const result = await retryManager.executeWithRetry(operation);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Circuit breaker is open');
      expect(result.attempts).toBe(0);
    });

    test('should reset circuit breaker on success', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('network timeout'));
      const successOperation = jest.fn().mockResolvedValue('success');
      
      // Open circuit breaker
      for (let i = 0; i < 6; i++) {
        await retryManager.executeWithRetry(failingOperation);
      }
      
      // Success should reset circuit breaker
      const result = await retryManager.executeWithRetry(successOperation);
      expect(result.success).toBe(true);
      
      const status = retryManager.getCircuitBreakerStatus();
      expect(status.failures).toBe(0);
    });
  });

  describe('Error Types', () => {
    test('should retry network-related errors', async () => {
      const retryableErrors = [
        'network timeout',
        'connection failed',
        'rate limit exceeded',
        'temporary service unavailable',
        'internal server error'
      ];
      
      for (const errorMessage of retryableErrors) {
        const operation = jest.fn().mockRejectedValue(new Error(errorMessage));
        const result = await retryManager.executeWithRetry(operation);
        expect(result.attempts).toBeGreaterThan(1);
      }
    });

    test('should not retry non-retryable errors', async () => {
      const nonRetryableErrors = [
        'invalid payment method',
        'insufficient funds',
        'card declined',
        'authentication failed'
      ];
      
      for (const errorMessage of nonRetryableErrors) {
        const operation = jest.fn().mockRejectedValue(new Error(errorMessage));
        const result = await retryManager.executeWithRetry(operation);
        expect(result.attempts).toBe(1);
      }
    });
  });
});
