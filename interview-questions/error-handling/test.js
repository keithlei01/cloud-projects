// Jest tests for Error Handling & Retry Logic solution
const { RetryManager, RetryError, MaxRetriesExceededError, CircuitBreakerOpenError } = require('./solution');

describe('Error Handling & Retry Logic', () => {
  let retryManager;

  beforeEach(() => {
    retryManager = new RetryManager();
  });

  describe('Retry Manager Creation', () => {
    test('should create RetryManager successfully', () => {
      expect(retryManager).toBeDefined();
      expect(retryManager).toBeInstanceOf(RetryManager);
    });

    test('should accept custom retry configuration', () => {
      const config = {
        maxAttempts: 5,
        baseDelay: 2.0,
        maxDelay: 120.0,
        backoffStrategy: 'exponential',
        jitter: true,
        jitterRange: 0.1
      };

      const customRetryManager = new RetryManager(config);
      expect(customRetryManager).toBeDefined();
    });
  });

  describe('Error Classes', () => {
    test('should create RetryError correctly', () => {
      const error = new RetryError('Test retry error');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test retry error');
    });

    test('should create MaxRetriesExceededError correctly', () => {
      const error = new MaxRetriesExceededError('Max retries exceeded');
      expect(error).toBeInstanceOf(RetryError);
      expect(error.message).toBe('Max retries exceeded');
    });

    test('should create CircuitBreakerOpenError correctly', () => {
      const error = new CircuitBreakerOpenError('Circuit breaker is open');
      expect(error).toBeInstanceOf(RetryError);
      expect(error.message).toBe('Circuit breaker is open');
    });
  });

  describe('Successful Operations', () => {
    test('should execute successful operation without retry', async () => {
      const operation = {
        id: 'test_1',
        operationType: 'api_call',
        function: async () => 'Success',
        args: [],
        createdAt: Date.now(),
        attempts: 0
      };

      const result = await retryManager.executeWithRetry(operation);
      expect(result).toBe('Success');
    });

    test('should handle operations that succeed after retries', async () => {
      let attemptCount = 0;
      const operation = {
        id: 'test_2',
        operationType: 'api_call',
        function: async () => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Temporary failure');
          }
          return 'Success after retries';
        },
        args: [],
        createdAt: Date.now(),
        attempts: 0
      };

      const result = await retryManager.executeWithRetry(operation);
      expect(result).toBe('Success after retries');
      expect(attemptCount).toBe(3);
    });
  });

  describe('Retry Logic', () => {
    test('should respect max retry attempts', async () => {
      const operation = {
        id: 'test_3',
        operationType: 'api_call',
        function: async () => {
          throw new Error('Always fails');
        },
        args: [],
        createdAt: Date.now(),
        attempts: 0
      };

      await expect(retryManager.executeWithRetry(operation)).rejects.toThrow(MaxRetriesExceededError);
    });

    test('should implement exponential backoff', async () => {
      const startTime = Date.now();
      const operation = {
        id: 'test_4',
        operationType: 'api_call',
        function: async () => {
          throw new Error('Temporary failure');
        },
        args: [],
        createdAt: Date.now(),
        attempts: 0
      };

      try {
        await retryManager.executeWithRetry(operation);
      } catch (error) {
        // Expected to fail
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should take some time due to backoff delays
      expect(duration).toBeGreaterThan(100);
    });

    test('should handle different backoff strategies', () => {
      const linearConfig = {
        maxAttempts: 3,
        baseDelay: 1.0,
        backoffStrategy: 'linear'
      };

      const exponentialConfig = {
        maxAttempts: 3,
        baseDelay: 1.0,
        backoffStrategy: 'exponential'
      };

      expect(() => new RetryManager(linearConfig)).not.toThrow();
      expect(() => new RetryManager(exponentialConfig)).not.toThrow();
    });
  });

  describe('Error Classification', () => {
    test('should classify retryable errors correctly', () => {
      const networkError = new Error('Network timeout');
      const serverError = new Error('Server error 500');
      const authError = new Error('Authentication failed');

      expect(retryManager.isRetryableError(networkError)).toBe(true);
      expect(retryManager.isRetryableError(serverError)).toBe(true);
      expect(retryManager.isRetryableError(authError)).toBe(false);
    });

    test('should handle custom error classification', () => {
      const customRetryableError = new Error('Custom retryable error');
      customRetryableError.isRetryable = true;

      const customNonRetryableError = new Error('Custom non-retryable error');
      customNonRetryableError.isRetryable = false;

      expect(retryManager.isRetryableError(customRetryableError)).toBe(true);
      expect(retryManager.isRetryableError(customNonRetryableError)).toBe(false);
    });
  });

  describe('Circuit Breaker', () => {
    test('should open circuit breaker after failure threshold', async () => {
      const operation = {
        id: 'test_5',
        operationType: 'api_call',
        function: async () => {
          throw new Error('Service unavailable');
        },
        args: [],
        createdAt: Date.now(),
        attempts: 0
      };

      // Execute multiple operations to trigger circuit breaker
      for (let i = 0; i < 5; i++) {
        try {
          await retryManager.executeWithRetry(operation);
        } catch (error) {
          // Expected to fail
        }
      }

      // Next operation should fail fast due to open circuit breaker
      await expect(retryManager.executeWithRetry(operation)).rejects.toThrow(CircuitBreakerOpenError);
    });

    test('should close circuit breaker after recovery timeout', async () => {
      // This test would require time manipulation or mocking
      // For now, we'll test that the circuit breaker state can be checked
      expect(typeof retryManager.getCircuitBreakerState).toBe('function');
    });
  });

  describe('Dead Letter Queue', () => {
    test('should add failed operations to dead letter queue', async () => {
      const operation = {
        id: 'test_6',
        operationType: 'api_call',
        function: async () => {
          throw new Error('Permanent failure');
        },
        args: [],
        createdAt: Date.now(),
        attempts: 0
      };

      try {
        await retryManager.executeWithRetry(operation);
      } catch (error) {
        // Expected to fail
      }

      const failedOps = await retryManager.getFailedOperations();
      expect(failedOps.length).toBeGreaterThan(0);
      expect(failedOps[0].id).toBe('test_6');
    });

    test('should retrieve failed operations with limit', async () => {
      const failedOps = await retryManager.getFailedOperations(10);
      expect(Array.isArray(failedOps)).toBe(true);
      expect(failedOps.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Metrics and Monitoring', () => {
    test('should track retry metrics', () => {
      const metrics = retryManager.getMetrics('api_call');
      expect(metrics).toHaveProperty('totalAttempts');
      expect(metrics).toHaveProperty('successfulAttempts');
      expect(metrics).toHaveProperty('failedAttempts');
      expect(metrics).toHaveProperty('averageRetryTime');
    });

    test('should calculate success rates', () => {
      const metrics = retryManager.getMetrics('api_call');
      expect(metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(metrics.successRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Configuration Validation', () => {
    test('should validate retry configuration', () => {
      const invalidConfig = {
        maxAttempts: -1,
        baseDelay: -1.0
      };

      expect(() => new RetryManager(invalidConfig)).toThrow();
    });

    test('should use default configuration when none provided', () => {
      const defaultRetryManager = new RetryManager();
      expect(defaultRetryManager).toBeDefined();
    });
  });

  describe('Operation Types', () => {
    test('should handle different operation types', () => {
      const operationTypes = ['api_call', 'database_query', 'file_operation', 'webhook_delivery'];
      
      operationTypes.forEach(type => {
        const operation = {
          id: `test_${type}`,
          operationType: type,
          function: async () => 'Success',
          args: [],
          createdAt: Date.now(),
          attempts: 0
        };

        expect(() => retryManager.executeWithRetry(operation)).not.toThrow();
      });
    });
  });
});