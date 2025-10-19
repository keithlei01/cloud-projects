/**
 * Error Handling and Retry Logic Solution
 * 
 * This solution implements a comprehensive error handling and retry system with:
 * 1. Multiple retry strategies (exponential, linear, fixed backoff)
 * 2. Circuit breaker pattern implementation
 * 3. Error classification and categorization
 * 4. Dead letter queue for failed operations
 * 5. Comprehensive monitoring and metrics
 * 6. Configurable retry behavior
 */

import { Database } from 'sqlite3';

enum ErrorType {
  RETRYABLE = "retryable",
  NON_RETRYABLE = "non_retryable",
  CIRCUIT_BREAKER = "circuit_breaker"
}

enum BackoffStrategy {
  EXPONENTIAL = "exponential",
  LINEAR = "linear",
  FIXED = "fixed"
}

enum CircuitBreakerState {
  CLOSED = "closed",
  OPEN = "open",
  HALF_OPEN = "half_open"
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffStrategy: BackoffStrategy;
  jitter: boolean;
  jitterRange: number; // ±10% jitter
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number; // seconds
  successThreshold: number;
  timeout: number; // seconds
}

export interface Operation {
  id: string;
  operationType: string;
  function: () => Promise<any>;
  args: any[];
  config?: RetryConfig;
  createdAt: number;
  attempts: number;
  lastError?: Error;
}

export class RetryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetryError';
  }
}

export class MaxRetriesExceededError extends RetryError {
  constructor(message: string) {
    super(message);
    this.name = 'MaxRetriesExceededError';
  }
}

export class CircuitBreakerOpenError extends RetryError {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

export class NonRetryableError extends RetryError {
  constructor(message: string) {
    super(message);
    this.name = 'NonRetryableError';
  }
}

export interface RetryResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

class ErrorClassifier {
  private retryablePatterns = [
    "timeout",
    "connection",
    "network",
    "temporary",
    "unavailable",
    "busy",
    "overloaded"
  ];

  private nonRetryablePatterns = [
    "authentication",
    "authorization",
    "permission",
    "not found",
    "invalid",
    "malformed",
    "bad request"
  ];

  private retryableStatusCodes = new Set([429, 500, 502, 503, 504]);
  private nonRetryableStatusCodes = new Set([400, 401, 403, 404, 422]);

  classifyError(error: Error): ErrorType {
    const errorStr = error.message.toLowerCase();
    const errorType = error.constructor.name.toLowerCase();

    // Check for non-retryable patterns
    for (const pattern of this.nonRetryablePatterns) {
      if (errorStr.includes(pattern) || errorType.includes(pattern)) {
        return ErrorType.NON_RETRYABLE;
      }
    }

    // Check for retryable patterns
    for (const pattern of this.retryablePatterns) {
      if (errorStr.includes(pattern) || errorType.includes(pattern)) {
        return ErrorType.RETRYABLE;
      }
    }

    // Check HTTP status codes (if available)
    const statusCode = (error as any).statusCode;
    if (statusCode) {
      if (this.retryableStatusCodes.has(statusCode)) {
        return ErrorType.RETRYABLE;
      } else if (this.nonRetryableStatusCodes.has(statusCode)) {
        return ErrorType.NON_RETRYABLE;
      }
    }

    // Default to retryable for unknown errors
    return ErrorType.RETRYABLE;
  }

  isRetryable(error: Error): boolean {
    // Check for custom isRetryable property first
    if ('isRetryable' in error && typeof (error as any).isRetryable === 'boolean') {
      return (error as any).isRetryable;
    }
    
    const errorType = this.classifyError(error);
    return errorType === ErrorType.RETRYABLE;
  }
}

class BackoffCalculator {
  static calculateDelay(attempt: number, config: RetryConfig): number {
    let delay: number;

    if (config.backoffStrategy === BackoffStrategy.EXPONENTIAL) {
      delay = config.baseDelay * Math.pow(2, attempt);
    } else if (config.backoffStrategy === BackoffStrategy.LINEAR) {
      delay = config.baseDelay * (attempt + 1);
    } else if (config.backoffStrategy === BackoffStrategy.FIXED) {
      delay = config.baseDelay;
    } else {
      delay = config.baseDelay;
    }

    // Apply max delay limit
    delay = Math.min(delay, config.maxDelay);

    // Apply jitter if enabled
    if (config.jitter) {
      const jitterAmount = delay * config.jitterRange;
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }

    return Math.max(0, delay);
  }
}

class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState;
  private failureCount: number;
  private successCount: number;
  private lastFailureTime: number;
  private lock: boolean = false;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }

  async call<T>(func: () => Promise<T>): Promise<T> {
    if (this.lock) {
      throw new CircuitBreakerOpenError("Circuit breaker is locked");
    }

    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.recoveryTimeout * 1000) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new CircuitBreakerOpenError("Circuit breaker is open");
      }
    }

    try {
      const result = await func();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitBreakerState.CLOSED;
        this.failureCount = 0;
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
    }
  }

  getState(): string {
    return this.state;
  }
}

class DeadLetterQueue {
  private db: Database;

  constructor(dbPath: string = "dead_letter_queue.db") {
    this.db = new Database(dbPath);
    this.initDatabase();
  }

  private initDatabase(): void {
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS failed_operations (
          id TEXT PRIMARY KEY,
          operation_type TEXT NOT NULL,
          function_name TEXT NOT NULL,
          args TEXT,
          kwargs TEXT,
          error_message TEXT,
          attempts INTEGER,
          created_at REAL,
          failed_at REAL
        )
      `);
    });
  }

  addOperation(operation: Operation, error: Error): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT OR REPLACE INTO failed_operations 
        (id, operation_type, function_name, args, kwargs, 
         error_message, attempts, created_at, failed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        operation.id,
        operation.operationType,
        operation.function.name,
        JSON.stringify(operation.args),
        JSON.stringify({}), // kwargs not used in this implementation
        error.message,
        operation.attempts,
        operation.createdAt,
        Date.now()
      ], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  getFailedOperations(limit: number = 100): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM failed_operations 
        ORDER BY failed_at DESC 
        LIMIT ?
      `, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

class RetryMetrics {
  private metrics: Map<string, {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    retryCounts: number[];
    errorTypes: Map<string, number>;
    circuitBreakerOpens: number;
  }> = new Map();

  recordAttempt(operationType: string, success: boolean, error?: Error): void {
    if (!this.metrics.has(operationType)) {
      this.metrics.set(operationType, {
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        retryCounts: [],
        errorTypes: new Map(),
        circuitBreakerOpens: 0
      });
    }

    const metrics = this.metrics.get(operationType)!;
    metrics.totalAttempts++;

    if (success) {
      metrics.successfulAttempts++;
    } else {
      metrics.failedAttempts++;
      if (error) {
        const errorType = error.constructor.name;
        metrics.errorTypes.set(errorType, (metrics.errorTypes.get(errorType) || 0) + 1);
      }
    }
  }

  recordRetryCount(operationType: string, retryCount: number): void {
    if (!this.metrics.has(operationType)) {
      this.metrics.set(operationType, {
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        retryCounts: [],
        errorTypes: new Map(),
        circuitBreakerOpens: 0
      });
    }

    const metrics = this.metrics.get(operationType)!;
    metrics.retryCounts.push(retryCount);
    
    // Keep only last 1000 retry counts
    if (metrics.retryCounts.length > 1000) {
      metrics.retryCounts = metrics.retryCounts.slice(-1000);
    }
  }

  recordCircuitBreakerOpen(operationType: string): void {
    if (!this.metrics.has(operationType)) {
      this.metrics.set(operationType, {
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        retryCounts: [],
        errorTypes: new Map(),
        circuitBreakerOpens: 0
      });
    }

    this.metrics.get(operationType)!.circuitBreakerOpens++;
  }

  getMetrics(operationType: string): any {
    const metrics = this.metrics.get(operationType);
    if (!metrics) {
      return {
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        successRate: 0,
        blockRate: 0,
        averageRetryCount: 0,
        maxRetryCount: 0,
        averageRetryTime: 0,
        errorTypes: {},
        circuitBreakerOpens: 0
      };
    }

    const retryCounts = metrics.retryCounts;
    const total = metrics.totalAttempts;

    return {
      totalAttempts: metrics.totalAttempts,
      successfulAttempts: metrics.successfulAttempts,
      failedAttempts: metrics.failedAttempts,
      successRate: total > 0 ? metrics.successfulAttempts / total : 0,
      blockRate: total > 0 ? metrics.failedAttempts / total : 0,
      averageRetryCount: retryCounts.length > 0 ? 
        retryCounts.reduce((a, b) => a + b, 0) / retryCounts.length : 0,
      maxRetryCount: retryCounts.length > 0 ? Math.max(...retryCounts) : 0,
      averageRetryTime: retryCounts.length > 0 ? 
        retryCounts.reduce((a, b) => a + b, 0) / retryCounts.length * 1000 : 0, // Convert to milliseconds
      errorTypes: Object.fromEntries(metrics.errorTypes),
      circuitBreakerOpens: metrics.circuitBreakerOpens
    };
  }
}

export class RetryManager {
  private defaultConfig: RetryConfig;
  private circuitBreakerConfig: CircuitBreakerConfig;
  private deadLetterQueue: DeadLetterQueue;
  private errorClassifier: ErrorClassifier;
  private metrics: RetryMetrics;
  private circuitBreakers: Map<string, CircuitBreaker>;

  constructor(
    defaultConfig?: RetryConfig,
    circuitBreakerConfig?: CircuitBreakerConfig,
    deadLetterQueue?: DeadLetterQueue
  ) {
    // Provide default configurations if none provided
    this.defaultConfig = defaultConfig || {
      maxAttempts: 3,
      baseDelay: 1.0,
      maxDelay: 30.0,
      backoffStrategy: BackoffStrategy.EXPONENTIAL,
      jitterRange: 0.1
    };
    
    this.circuitBreakerConfig = circuitBreakerConfig || {
      failureThreshold: 5,
      recoveryTimeout: 60,
      monitoringWindow: 120
    };
    
    this.validateRetryConfig(this.defaultConfig);
    this.deadLetterQueue = deadLetterQueue || new DeadLetterQueue();
    this.errorClassifier = new ErrorClassifier();
    this.metrics = new RetryMetrics();
    this.circuitBreakers = new Map();
  }

  private validateRetryConfig(config: RetryConfig): void {
    if (config.maxAttempts <= 0) {
      throw new Error('maxAttempts must be greater than 0');
    }
    if (config.baseDelay < 0) {
      throw new Error('baseDelay must be non-negative');
    }
    if (config.maxDelay < 0) {
      throw new Error('maxDelay must be non-negative');
    }
    if (config.jitterRange < 0 || config.jitterRange > 1) {
      throw new Error('jitterRange must be between 0 and 1');
    }
  }

  private getCircuitBreaker(operationType: string): CircuitBreaker {
    if (!this.circuitBreakers.has(operationType)) {
      this.circuitBreakers.set(operationType, new CircuitBreaker(this.circuitBreakerConfig));
    }
    return this.circuitBreakers.get(operationType)!;
  }

  async executeWithRetry(operation: Operation): Promise<any> {
    const config = operation.config || this.defaultConfig;
    const circuitBreaker = this.getCircuitBreaker(operation.operationType);

    for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
      operation.attempts = attempt + 1;

      try {
        // Execute through circuit breaker
        const result = await circuitBreaker.call(operation.function);

        // Record successful attempt
        this.metrics.recordAttempt(operation.operationType, true);
        this.metrics.recordRetryCount(operation.operationType, attempt);

        console.log(`Operation ${operation.id} succeeded on attempt ${attempt + 1}`);
        return result;
      } catch (error: any) {
        operation.lastError = error;

        if (error instanceof CircuitBreakerOpenError) {
          this.metrics.recordCircuitBreakerOpen(operation.operationType);
          console.warn(`Circuit breaker open for ${operation.operationType}`);
          throw error;
        }

        // Classify error
        const errorType = this.errorClassifier.classifyError(error);

        if (errorType === ErrorType.NON_RETRYABLE) {
          console.warn(`Non-retryable error for ${operation.id}: ${error.message}`);
          this.metrics.recordAttempt(operation.operationType, false, error);
          throw new NonRetryableError(`Non-retryable error: ${error.message}`);
        }

        // Record failed attempt
        this.metrics.recordAttempt(operation.operationType, false, error);

        // Check if this was the last attempt
        if (attempt === config.maxAttempts - 1) {
          console.error(`Operation ${operation.id} failed after ${config.maxAttempts} attempts`);

          // Add to dead letter queue
          await this.deadLetterQueue.addOperation(operation, error);
          throw new MaxRetriesExceededError(`Max retries exceeded for ${operation.id}`);
        }

        // Calculate delay for next attempt
        const delay = BackoffCalculator.calculateDelay(attempt, config);

        console.log(`Operation ${operation.id} failed on attempt ${attempt + 1}, retrying in ${delay.toFixed(2)} seconds: ${error.message}`);

        await new Promise(resolve => setTimeout(resolve, delay * 1000));
      }
    }

    // This should never be reached, but just in case
    throw new MaxRetriesExceededError(`Unexpected retry loop exit for ${operation.id}`);
  }

  getMetrics(operationType: string): any {
    return this.metrics.getMetrics(operationType);
  }

  async getFailedOperations(limit: number = 100): Promise<any[]> {
    return this.deadLetterQueue.getFailedOperations(limit);
  }

  isRetryableError(error: Error): boolean {
    return this.errorClassifier.isRetryable(error);
  }

  getCircuitBreakerState(operationType: string): string {
    const circuitBreaker = this.circuitBreakers.get(operationType);
    if (!circuitBreaker) {
      return 'closed';
    }
    return circuitBreaker.getState();
  }
}

