const { RateLimitCalculator } = require('./solution');

describe('API Rate Limit Calculator', () => {
  let calculator;

  beforeEach(() => {
    calculator = new RateLimitCalculator();
  });

  describe('Endpoint Configuration', () => {
    test('should add endpoint configuration', () => {
      calculator.addEndpoint('payments', {
        requestsPerSecond: 100,
        requestsPerMinute: 1000,
        requestsPerHour: 10000
      });

      // Should not throw error
      expect(() => calculator.getStatus('payments', 'live')).not.toThrow();
    });

    test('should throw error for unknown endpoint', () => {
      expect(() => calculator.getStatus('unknown', 'live')).toThrow('No rate limit configuration found for endpoint: unknown');
    });
  });

  describe('Request Recording', () => {
    test('should record requests', () => {
      calculator.addEndpoint('payments', {
        requestsPerSecond: 100,
        requestsPerMinute: 1000,
        requestsPerHour: 10000
      });

      calculator.recordRequest('payments', 'live');
      calculator.recordRequest('payments', 'live');

      const status = calculator.getStatus('payments', 'live');
      expect(status.remainingRequests.perSecond).toBe(98);
    });

    test('should track different account types separately', () => {
      calculator.addEndpoint('payments', {
        requestsPerSecond: 100,
        requestsPerMinute: 1000,
        requestsPerHour: 10000
      });

      calculator.recordRequest('payments', 'live');
      calculator.recordRequest('payments', 'test');

      const liveStatus = calculator.getStatus('payments', 'live');
      const testStatus = calculator.getStatus('payments', 'test');

      expect(liveStatus.remainingRequests.perSecond).toBe(99);
      expect(testStatus.remainingRequests.perSecond).toBe(99);
    });
  });

  describe('Rate Limit Status', () => {
    test('should calculate remaining requests correctly', () => {
      calculator.addEndpoint('payments', {
        requestsPerSecond: 5,
        requestsPerMinute: 50,
        requestsPerHour: 500
      });

      // Record 3 requests
      calculator.recordRequest('payments', 'live');
      calculator.recordRequest('payments', 'live');
      calculator.recordRequest('payments', 'live');

      const status = calculator.getStatus('payments', 'live');
      expect(status.remainingRequests.perSecond).toBe(2);
      expect(status.remainingRequests.perMinute).toBe(47);
      expect(status.remainingRequests.perHour).toBe(497);
    });

    test('should not go below zero for remaining requests', () => {
      calculator.addEndpoint('payments', {
        requestsPerSecond: 2,
        requestsPerMinute: 20,
        requestsPerHour: 200
      });

      // Record more requests than limit
      for (let i = 0; i < 5; i++) {
        calculator.recordRequest('payments', 'live');
      }

      const status = calculator.getStatus('payments', 'live');
      expect(status.remainingRequests.perSecond).toBe(0);
      expect(status.remainingRequests.perMinute).toBe(15);
      expect(status.remainingRequests.perHour).toBe(195);
    });

    test('should include correct endpoint and account type in status', () => {
      calculator.addEndpoint('customers', {
        requestsPerSecond: 100,
        requestsPerMinute: 1000,
        requestsPerHour: 10000
      });

      const status = calculator.getStatus('customers', 'test');
      expect(status.endpoint).toBe('customers');
      expect(status.accountType).toBe('test');
    });
  });

  describe('Warnings', () => {
    test('should generate warnings when approaching limits', () => {
      calculator.addEndpoint('payments', {
        requestsPerSecond: 10,
        requestsPerMinute: 100,
        requestsPerHour: 1000
      });

      // Record 9 requests (90% of limit)
      for (let i = 0; i < 9; i++) {
        calculator.recordRequest('payments', 'live');
      }

      const status = calculator.getStatus('payments', 'live');
      expect(status.warnings).toContain('Approaching per-second rate limit');
    });

    test('should generate warnings when limits exceeded', () => {
      calculator.addEndpoint('payments', {
        requestsPerSecond: 5,
        requestsPerMinute: 50,
        requestsPerHour: 500
      });

      // Record more requests than limit
      for (let i = 0; i < 6; i++) {
        calculator.recordRequest('payments', 'live');
      }

      const status = calculator.getStatus('payments', 'live');
      expect(status.warnings).toContain('Per-second rate limit exceeded');
    });

    test('should generate multiple warnings for different limits', () => {
      calculator.addEndpoint('payments', {
        requestsPerSecond: 10,
        requestsPerMinute: 100,
        requestsPerHour: 1000
      });

      // Record requests to trigger multiple warnings
      for (let i = 0; i < 95; i++) {
        calculator.recordRequest('payments', 'live');
      }

      const status = calculator.getStatus('payments', 'live');
      expect(status.warnings.length).toBeGreaterThan(1);
    });
  });

  describe('Optimal Delay', () => {
    test('should return 0 delay when requests available', () => {
      calculator.addEndpoint('payments', {
        requestsPerSecond: 100,
        requestsPerMinute: 1000,
        requestsPerHour: 10000
      });

      const delay = calculator.getOptimalDelay('payments', 'live');
      expect(delay).toBe(0);
    });

    test('should return delay when rate limit exceeded', () => {
      calculator.addEndpoint('payments', {
        requestsPerSecond: 1,
        requestsPerMinute: 10,
        requestsPerHour: 100
      });

      // Exceed the per-second limit
      calculator.recordRequest('payments', 'live');

      const delay = calculator.getOptimalDelay('payments', 'live');
      expect(delay).toBeGreaterThan(0);
    });
  });

  describe('Cleanup', () => {
    test('should clean up old records', () => {
      calculator.addEndpoint('payments', {
        requestsPerSecond: 100,
        requestsPerMinute: 1000,
        requestsPerHour: 10000
      });

      // Record some requests
      calculator.recordRequest('payments', 'live');
      calculator.recordRequest('payments', 'live');

      // Manually add old records (simulate time passing)
      const oldRecord = {
        timestamp: Date.now() - 7200000, // 2 hours ago
        endpoint: 'payments',
        accountType: 'live'
      };
      calculator.usageHistory.push(oldRecord);

      calculator.cleanupOldRecords();

      // Should still have recent records but not old ones
      const status = calculator.getStatus('payments', 'live');
      expect(status.remainingRequests.perSecond).toBe(98);
    });
  });

  describe('Usage Statistics', () => {
    test('should calculate usage statistics', () => {
      calculator.addEndpoint('payments', {
        requestsPerSecond: 100,
        requestsPerMinute: 1000,
        requestsPerHour: 10000
      });

      // Record some requests
      calculator.recordRequest('payments', 'live');
      calculator.recordRequest('payments', 'live');
      calculator.recordRequest('payments', 'live');

      const stats = calculator.getUsageStats('payments', 'live');
      expect(stats.totalRequests).toBe(3);
      expect(stats.averagePerMinute).toBe(3);
      expect(stats.averagePerHour).toBe(3);
    });

    test('should handle empty usage history', () => {
      calculator.addEndpoint('payments', {
        requestsPerSecond: 100,
        requestsPerMinute: 1000,
        requestsPerHour: 10000
      });

      const stats = calculator.getUsageStats('payments', 'live');
      expect(stats.totalRequests).toBe(0);
      expect(stats.averagePerSecond).toBe(0);
      expect(stats.averagePerMinute).toBe(0);
      expect(stats.averagePerHour).toBe(0);
    });
  });

  describe('Time Windows', () => {
    test('should handle different time windows correctly', async () => {
      calculator.addEndpoint('payments', {
        requestsPerSecond: 2,
        requestsPerMinute: 10,
        requestsPerHour: 100
      });

      // Record requests
      calculator.recordRequest('payments', 'live');
      calculator.recordRequest('payments', 'live');

      const status = calculator.getStatus('payments', 'live');
      expect(status.remainingRequests.perSecond).toBe(0);
      expect(status.remainingRequests.perMinute).toBe(8);
      expect(status.remainingRequests.perHour).toBe(98);

      // Wait for second window to reset (simulate)
      await new Promise(resolve => setTimeout(resolve, 1100));

      const newStatus = calculator.getStatus('payments', 'live');
      expect(newStatus.remainingRequests.perSecond).toBe(2);
    });
  });
});
