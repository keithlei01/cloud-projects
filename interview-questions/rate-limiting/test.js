// Jest tests for Rate Limiting solution
const { RateLimitManager, RateLimitError, RateLimitMiddleware, RateLimitAlgorithm } = require('./solution');

describe('Rate Limiting', () => {
  let manager;
  let testStorage;

  beforeEach(() => {
    // Create a simple in-memory storage for testing
    class TestStorage {
      constructor() {
        this.data = new Map();
      }
      async get(key) { return this.data.get(key); }
      async set(key, data, ttl) { 
        this.data.set(key, data);
        if (ttl) setTimeout(() => this.data.delete(key), ttl * 1000);
      }
      async increment(key, amount = 1) {
        const current = this.data.get(key) || { count: 0 };
        current.count += amount;
        this.data.set(key, current);
        return current.count;
      }
      async expire(key, ttl) {
        setTimeout(() => this.data.delete(key), ttl * 1000);
      }
    }
    
    testStorage = new TestStorage();
    manager = new RateLimitManager(testStorage);
  });

  describe('Rate Limit Manager Creation', () => {
    test('should create RateLimitManager successfully', () => {
      expect(manager).toBeDefined();
      expect(manager).toBeInstanceOf(RateLimitManager);
    });

    test('should have storage access', () => {
      expect(manager.getStorage()).toBe(testStorage);
    });
  });

  describe('Token Bucket Algorithm', () => {
    test('should allow requests within limit', async () => {
      const config = {
        limit: 5,
        window: 60,
        algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
        costPerRequest: 1
      };

      const result = await manager.isAllowed('user1', config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.limit).toBe(5);
    });

    test('should block requests when limit exceeded', async () => {
      const config = {
        limit: 2,
        window: 60,
        algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
        costPerRequest: 1
      };

      // Make 2 requests (should be allowed)
      await manager.isAllowed('user2', config);
      await manager.isAllowed('user2', config);

      // Third request should be blocked
      const result = await manager.isAllowed('user2', config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
    });

    test('should refill tokens over time', async () => {
      const config = {
        limit: 2,
        window: 1, // 1 second window
        algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
        costPerRequest: 1
      };

      // Exhaust tokens
      await manager.isAllowed('user3', config);
      await manager.isAllowed('user3', config);

      // Wait for refill (in real scenario)
      await new Promise(resolve => setTimeout(resolve, 1100));

      const result = await manager.isAllowed('user3', config);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Sliding Window Algorithm', () => {
    test('should allow requests within sliding window', async () => {
      const config = {
        limit: 3,
        window: 10,
        algorithm: RateLimitAlgorithm.SLIDING_WINDOW,
        costPerRequest: 1
      };

      const result = await manager.isAllowed('user4', config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    test('should block requests when sliding window limit exceeded', async () => {
      const config = {
        limit: 2,
        window: 10,
        algorithm: RateLimitAlgorithm.SLIDING_WINDOW,
        costPerRequest: 1
      };

      // Make 2 requests
      await manager.isAllowed('user5', config);
      await manager.isAllowed('user5', config);

      // Third request should be blocked
      const result = await manager.isAllowed('user5', config);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
    });
  });

  describe('Fixed Window Algorithm', () => {
    test('should allow requests within fixed window', async () => {
      const config = {
        limit: 3,
        window: 5,
        algorithm: RateLimitAlgorithm.FIXED_WINDOW,
        costPerRequest: 1
      };

      const result = await manager.isAllowed('user6', config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    test('should reset at window boundary', async () => {
      const config = {
        limit: 2,
        window: 1, // 1 second window
        algorithm: RateLimitAlgorithm.FIXED_WINDOW,
        costPerRequest: 1
      };

      // Exhaust window
      await manager.isAllowed('user7', config);
      await manager.isAllowed('user7', config);

      // Wait for new window
      await new Promise(resolve => setTimeout(resolve, 1100));

      const result = await manager.isAllowed('user7', config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });
  });

  describe('Rate Limit Middleware', () => {
    test('should create RateLimitMiddleware successfully', () => {
      const middleware = new RateLimitMiddleware(manager);
      expect(middleware).toBeDefined();
      expect(middleware).toBeInstanceOf(RateLimitMiddleware);
    });

    test('should have middleware method', () => {
      const middleware = new RateLimitMiddleware(manager);
      expect(typeof middleware.middleware).toBe('function');
    });
  });

  describe('Error Handling', () => {
    test('should throw error for unsupported algorithm', async () => {
      const config = {
        limit: 5,
        window: 60,
        algorithm: 'unsupported_algorithm',
        costPerRequest: 1
      };

      await expect(manager.isAllowed('user8', config)).rejects.toThrow('Unsupported rate limit algorithm');
    });

    test('should handle invalid configuration', async () => {
      const config = {
        limit: -1, // Invalid limit
        window: 60,
        algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
        costPerRequest: 1
      };

      // Should handle gracefully or throw appropriate error
      await expect(manager.isAllowed('user9', config)).rejects.toThrow();
    });
  });

  describe('Metrics and Monitoring', () => {
    test('should track rate limit metrics', async () => {
      const config = {
        limit: 5,
        window: 60,
        algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
        costPerRequest: 1
      };

      await manager.isAllowed('user10', config);
      const metrics = manager.getMetrics('user10');

      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('allowedRequests');
      expect(metrics).toHaveProperty('blockedRequests');
      expect(metrics).toHaveProperty('allowRate');
      expect(metrics).toHaveProperty('blockRate');
    });

    test('should calculate success rates correctly', async () => {
      const config = {
        limit: 2,
        window: 60,
        algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
        costPerRequest: 1
      };

      // Make 3 requests (2 allowed, 1 blocked)
      await manager.isAllowed('user11', config);
      await manager.isAllowed('user11', config);
      await manager.isAllowed('user11', config);

      const metrics = manager.getMetrics('user11');
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.allowedRequests).toBe(2);
      expect(metrics.blockedRequests).toBe(1);
      expect(metrics.allowRate).toBeCloseTo(0.667, 2);
      expect(metrics.blockRate).toBeCloseTo(0.333, 2);
    });
  });

  describe('Different User Keys', () => {
    test('should handle different user keys independently', async () => {
      const config = {
        limit: 2,
        window: 60,
        algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
        costPerRequest: 1
      };

      // User A makes 2 requests
      await manager.isAllowed('userA', config);
      await manager.isAllowed('userA', config);

      // User B should still be allowed
      const result = await manager.isAllowed('userB', config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });
  });

  describe('Cost Per Request', () => {
    test('should handle different cost per request', async () => {
      const config = {
        limit: 10,
        window: 60,
        algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
        costPerRequest: 3
      };

      // First request should be allowed (cost 3, limit 10)
      const result1 = await manager.isAllowed('user12', config);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(7);

      // Second request should be allowed (cost 3, remaining 7)
      const result2 = await manager.isAllowed('user12', config);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(4);

      // Third request should be allowed (cost 3, remaining 4)
      const result3 = await manager.isAllowed('user12', config);
      expect(result3.allowed).toBe(true);
      expect(result3.remaining).toBe(1);

      // Fourth request should be blocked (cost 3, remaining 1)
      const result4 = await manager.isAllowed('user12', config);
      expect(result4.allowed).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero limit', async () => {
      const config = {
        limit: 0,
        window: 60,
        algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
        costPerRequest: 1
      };

      const result = await manager.isAllowed('user13', config);
      expect(result.allowed).toBe(false);
    });

    test('should handle very large limits', async () => {
      const config = {
        limit: 1000000,
        window: 60,
        algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
        costPerRequest: 1
      };

      const result = await manager.isAllowed('user14', config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(999999);
    });
  });
});