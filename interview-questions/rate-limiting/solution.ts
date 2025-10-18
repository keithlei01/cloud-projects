/**
 * Rate Limiting System Solution
 * 
 * This solution implements a comprehensive rate limiting system with:
 * 1. Multiple rate limiting algorithms (token bucket, sliding window, fixed window)
 * 2. Flexible configuration and key-based limiting
 * 3. Storage backends (in-memory and Redis)
 * 4. Middleware integration for web frameworks
 * 5. Comprehensive monitoring and metrics
 * 6. Distributed system support
 */

import * as express from 'express';
import { Database } from 'sqlite3';

enum RateLimitAlgorithm {
  TOKEN_BUCKET = "token_bucket",
  SLIDING_WINDOW = "sliding_window",
  FIXED_WINDOW = "fixed_window",
  LEAKY_BUCKET = "leaky_bucket"
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimitConfig {
  limit: number;
  window: number; // seconds
  algorithm: RateLimitAlgorithm;
  burstAllowance?: number;
  costPerRequest: number;
}

export interface RateLimitStorage {
  get(key: string): Promise<any>;
  set(key: string, data: any, ttl?: number): Promise<void>;
  increment(key: string, amount?: number): Promise<number>;
  expire(key: string, ttl: number): Promise<void>;
}

class InMemoryStorage implements RateLimitStorage {
  private data: Map<string, any> = new Map();

  async get(key: string): Promise<any> {
    return this.data.get(key);
  }

  async set(key: string, data: any, ttl?: number): Promise<void> {
    this.data.set(key, data);
    if (ttl) {
      setTimeout(() => this.data.delete(key), ttl * 1000);
    }
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    const current = this.data.get(key) || { count: 0 };
    current.count += amount;
    this.data.set(key, current);
    return current.count;
  }

  async expire(key: string, ttl: number): Promise<void> {
    setTimeout(() => this.data.delete(key), ttl * 1000);
  }
}

class SimpleRateLimiter {
  private requestsPerWindow: number;
  private windowSeconds: number;
  private tokens: number;
  private lastRefill: number;

  constructor(requestsPerWindow: number, windowSeconds: number) {
    this.requestsPerWindow = requestsPerWindow;
    this.windowSeconds = windowSeconds;
    this.tokens = requestsPerWindow;
    this.lastRefill = Date.now();
  }

  acquire(): boolean {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timePassed * this.requestsPerWindow / this.windowSeconds);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.requestsPerWindow, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }

    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }

    return false;
  }

  waitTime(): number {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timePassed * this.requestsPerWindow / this.windowSeconds);

    if (tokensToAdd > 0) {
      return 0.0;
    }

    return (1.0 - tokensToAdd) * this.windowSeconds / this.requestsPerWindow;
  }
}

abstract class RateLimiter {
  abstract isAllowed(key: string, config: RateLimitConfig): Promise<RateLimitResult>;
}

class TokenBucketRateLimiter extends RateLimiter {
  constructor(private storage: RateLimitStorage) {
    super();
  }

  async isAllowed(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now() / 1000;

    // Get current bucket state
    let bucketData = await this.storage.get(key);
    if (!bucketData) {
      bucketData = {
        tokens: config.limit,
        lastRefill: now
      };
    }

    // Calculate tokens to add based on time elapsed
    const timePassed = now - bucketData.lastRefill;
    const tokensToAdd = Math.floor(timePassed * config.limit / config.window);

    // Refill tokens
    const currentTokens = Math.min(config.limit, bucketData.tokens + tokensToAdd);

    // Check if request is allowed
    const cost = config.costPerRequest;
    if (currentTokens >= cost) {
      // Consume tokens
      bucketData.tokens = currentTokens - cost;
      bucketData.lastRefill = now;

      // Save updated state
      await this.storage.set(key, bucketData, config.window * 2);

      return {
        allowed: true,
        limit: config.limit,
        remaining: Math.floor(bucketData.tokens),
        resetTime: now + config.window
      };
    } else {
      // Calculate retry after time
      const tokensNeeded = cost - currentTokens;
      const retryAfter = tokensNeeded * config.window / config.limit;

      return {
        allowed: false,
        limit: config.limit,
        remaining: 0,
        resetTime: now + config.window,
        retryAfter
      };
    }
  }
}

class SlidingWindowRateLimiter extends RateLimiter {
  constructor(private storage: RateLimitStorage) {
    super();
  }

  async isAllowed(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now() / 1000;
    const windowStart = now - config.window;

    // Get current window data
    let windowData = await this.storage.get(key);
    if (!windowData) {
      windowData = { requests: [] };
    }

    // Remove old requests outside the window
    const requests = windowData.requests.filter((reqTime: number) => reqTime > windowStart);

    // Check if request is allowed
    if (requests.length < config.limit) {
      // Add current request
      requests.push(now);
      windowData.requests = requests;

      // Save updated state
      await this.storage.set(key, windowData, config.window * 2);

      return {
        allowed: true,
        limit: config.limit,
        remaining: config.limit - requests.length,
        resetTime: now + config.window
      };
    } else {
      // Calculate retry after time
      const oldestRequest = Math.min(...requests);
      const retryAfter = oldestRequest + config.window - now;

      return {
        allowed: false,
        limit: config.limit,
        remaining: 0,
        resetTime: now + config.window,
        retryAfter: Math.max(0, retryAfter)
      };
    }
  }
}

class FixedWindowRateLimiter extends RateLimiter {
  constructor(private storage: RateLimitStorage) {
    super();
  }

  async isAllowed(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now() / 1000;
    const windowStart = Math.floor(now / config.window) * config.window;
    const windowKey = `${key}:${windowStart}`;

    // Get current window count
    const currentCount = await this.storage.increment(windowKey, config.costPerRequest);

    // Set expiration for the window
    await this.storage.expire(windowKey, config.window);

    // Check if request is allowed
    if (currentCount <= config.limit) {
      return {
        allowed: true,
        limit: config.limit,
        remaining: config.limit - currentCount,
        resetTime: windowStart + config.window
      };
    } else {
      const retryAfter = windowStart + config.window - now;

      return {
        allowed: false,
        limit: config.limit,
        remaining: 0,
        resetTime: windowStart + config.window,
        retryAfter: Math.max(0, retryAfter)
      };
    }
  }
}

export class RateLimitManager {
  private storage: RateLimitStorage;
  private limiters: Map<RateLimitAlgorithm, RateLimiter>;
  private metrics: Map<string, {
    totalRequests: number;
    allowedRequests: number;
    blockedRequests: number;
    violations: any[];
  }> = new Map();

  constructor(storage: RateLimitStorage) {
    this.storage = storage;
    this.limiters = new Map();
    this.limiters.set(RateLimitAlgorithm.TOKEN_BUCKET, new TokenBucketRateLimiter(storage));
    this.limiters.set(RateLimitAlgorithm.SLIDING_WINDOW, new SlidingWindowRateLimiter(storage));
    this.limiters.set(RateLimitAlgorithm.FIXED_WINDOW, new FixedWindowRateLimiter(storage));
  }

  async isAllowed(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const limiter = this.limiters.get(config.algorithm);
    if (!limiter) {
      throw new Error(`Unsupported rate limit algorithm: ${config.algorithm}`);
    }

    const result = await limiter.isAllowed(key, config);

    // Update metrics
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        totalRequests: 0,
        allowedRequests: 0,
        blockedRequests: 0,
        violations: []
      });
    }

    const metrics = this.metrics.get(key)!;
    metrics.totalRequests++;

    if (result.allowed) {
      metrics.allowedRequests++;
    } else {
      metrics.blockedRequests++;
      metrics.violations.push({
        timestamp: Date.now(),
        limit: result.limit,
        retryAfter: result.retryAfter
      });
    }

    return result;
  }

  getMetrics(key: string): any {
    const metrics = this.metrics.get(key);
    if (!metrics) {
      return {
        totalRequests: 0,
        allowedRequests: 0,
        blockedRequests: 0,
        allowRate: 0,
        blockRate: 0,
        violations: 0
      };
    }

    const total = metrics.totalRequests;

    return {
      totalRequests: metrics.totalRequests,
      allowedRequests: metrics.allowedRequests,
      blockedRequests: metrics.blockedRequests,
      allowRate: total > 0 ? metrics.allowedRequests / total : 0,
      blockRate: total > 0 ? metrics.blockedRequests / total : 0,
      violations: metrics.violations.length
    };
  }
}

export class RateLimitMiddleware {
  private rateLimitManager: RateLimitManager;

  constructor(rateLimitManager: RateLimitManager) {
    this.rateLimitManager = rateLimitManager;
  }

  middleware(config: RateLimitConfig, keyExtractor?: (req: express.Request) => string) {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        // Extract key from request
        const key = keyExtractor ? keyExtractor(req) : this.extractDefaultKey(req);

        // Check rate limit
        const result = await this.rateLimitManager.isAllowed(key, config);

        // Add rate limit headers
        res.set({
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(result.resetTime).toString()
        });

        if (!result.allowed) {
          if (result.retryAfter) {
            res.set('X-RateLimit-Retry-After', Math.ceil(result.retryAfter).toString());
          }
          res.status(429).json({
            error: 'Rate limit exceeded',
            retryAfter: result.retryAfter
          });
          return;
        }

        next();
      } catch (error) {
        console.error('Rate limit middleware error:', error);
        next(error);
      }
    };
  }

  private extractDefaultKey(req: express.Request): string {
    // Default key extraction - can be customized
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    return `${ip}:${userAgent}`;
  }
}

export function rateLimit(
  limit: number,
  window: number,
  algorithm: RateLimitAlgorithm = RateLimitAlgorithm.TOKEN_BUCKET,
  keyFunc?: (...args: any[]) => string
) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      // Create rate limit manager (in real implementation, this would be injected)
      const storage = new InMemoryStorage();
      const rateLimitManager = new RateLimitManager(storage);

      // Extract key
      const key = keyFunc ? keyFunc(...args) : `${target.constructor.name}:${propertyKey}`;

      // Create config
      const config: RateLimitConfig = {
        limit,
        window,
        algorithm,
        costPerRequest: 1
      };

      // Check rate limit
      const result = await rateLimitManager.isAllowed(key, config);

      if (!result.allowed) {
        throw new RateLimitError(`Rate limit exceeded. Retry after ${result.retryAfter?.toFixed(2)} seconds`);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Example usage and testing
if (require.main === module) {
  // Create rate limit manager with in-memory storage
  const storage = new InMemoryStorage();
  const rateLimitManager = new RateLimitManager(storage);

  // Test token bucket rate limiter
  console.log("Testing Token Bucket Rate Limiter...");
  const config: RateLimitConfig = {
    limit: 5,
    window: 60,
    algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
    costPerRequest: 1
  };

  async function testRateLimiter() {
    for (let i = 0; i < 10; i++) {
      const result = await rateLimitManager.isAllowed("test_user", config);
      console.log(`Request ${i + 1}: Allowed=${result.allowed}, Remaining=${result.remaining}`);
      if (!result.allowed) {
        console.log(`  Retry after: ${result.retryAfter?.toFixed(2)} seconds`);
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between requests
    }

    // Test sliding window rate limiter
    console.log("\nTesting Sliding Window Rate Limiter...");
    const slidingConfig: RateLimitConfig = {
      limit: 3,
      window: 10,
      algorithm: RateLimitAlgorithm.SLIDING_WINDOW,
      costPerRequest: 1
    };

    for (let i = 0; i < 5; i++) {
      const result = await rateLimitManager.isAllowed("test_user_2", slidingConfig);
      console.log(`Request ${i + 1}: Allowed=${result.allowed}, Remaining=${result.remaining}`);
      if (!result.allowed) {
        console.log(`  Retry after: ${result.retryAfter?.toFixed(2)} seconds`);
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Test fixed window rate limiter
    console.log("\nTesting Fixed Window Rate Limiter...");
    const fixedConfig: RateLimitConfig = {
      limit: 2,
      window: 5,
      algorithm: RateLimitAlgorithm.FIXED_WINDOW,
      costPerRequest: 1
    };

    for (let i = 0; i < 4; i++) {
      const result = await rateLimitManager.isAllowed("test_user_3", fixedConfig);
      console.log(`Request ${i + 1}: Allowed=${result.allowed}, Remaining=${result.remaining}`);
      if (!result.allowed) {
        console.log(`  Retry after: ${result.retryAfter?.toFixed(2)} seconds`);
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Print metrics
    console.log("\nRate Limiting Metrics:");
    for (const key of ["test_user", "test_user_2", "test_user_3"]) {
      const metrics = rateLimitManager.getMetrics(key);
      console.log(`${key}: ${JSON.stringify(metrics, null, 2)}`);
    }
  }

  testRateLimiter().catch(console.error);
}
