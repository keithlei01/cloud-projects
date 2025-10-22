export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitterRange: number; // 0-1, adds randomness to delay
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: string;
  attempts: number;
  totalTime: number;
}

export interface RetryableError {
  isRetryable: boolean;
  retryAfter?: number; // seconds to wait before retry
}

export class PaymentRetryManager {
  private config: RetryConfig;
  private circuitBreakerFailures: number = 0;
  private circuitBreakerThreshold: number = 5;
  private circuitBreakerTimeout: number = 1000; // 1 second for testing
  private circuitBreakerLastFailure: number = 0;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      jitterRange: 0.1,
      ...config
    };
  }

  /**
   * Executes a function with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    _context?: string
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      // Check circuit breaker before each attempt (except first attempt)
      if (attempt > 0 && this.isCircuitBreakerOpen()) {
        return {
          success: false,
          error: 'Circuit breaker is open',
          attempts: attempt,
          totalTime: Date.now() - startTime
        };
      }

      try {
        const result = await operation();
        
        // Reset circuit breaker on success
        this.resetCircuitBreaker();
        
        return {
          success: true,
          result,
          attempts: attempt + 1,
          totalTime: Date.now() - startTime
        };
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        if (!this.isRetryableError(error as Error)) {
          return {
            success: false,
            error: lastError.message,
            attempts: attempt + 1,
            totalTime: Date.now() - startTime
          };
        }

        // Don't retry on last attempt
        if (attempt === this.config.maxRetries) {
          this.recordCircuitBreakerFailure();
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt, error as Error);
        await this.sleep(delay);
      }
    }

    this.recordCircuitBreakerFailure();
    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      attempts: this.config.maxRetries + 1,
      totalTime: Date.now() - startTime
    };
  }

  /**
   * Determines if an error is retryable
   */
  private isRetryableError(error: Error): boolean {
    // Check if error has custom retryable property
    if ('isRetryable' in error && typeof (error as any).isRetryable === 'boolean') {
      return (error as any).isRetryable;
    }

    // Check error message for retryable patterns
    const retryablePatterns = [
      'timeout',
      'network',
      'connection',
      'rate limit',
      'temporary',
      'service unavailable',
      'internal server error'
    ];

    const errorMessage = error.message.toLowerCase();
    return retryablePatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * Calculates delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number, error: Error): number {
    // Check for retry-after header or custom retry delay
    let baseDelay = this.config.baseDelay;
    if ('retryAfter' in error && typeof (error as any).retryAfter === 'number') {
      baseDelay = (error as any).retryAfter * 1000; // convert to milliseconds
    }

    // Exponential backoff
    const exponentialDelay = baseDelay * Math.pow(this.config.backoffMultiplier, attempt);
    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelay);

    // Add jitter to prevent thundering herd
    const jitter = cappedDelay * this.config.jitterRange * Math.random();
    const finalDelay = cappedDelay + jitter;

    return Math.floor(finalDelay);
  }

  /**
   * Sleeps for the specified number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Checks if circuit breaker is open
   */
  private isCircuitBreakerOpen(): boolean {
    if (this.circuitBreakerFailures < this.circuitBreakerThreshold) {
      return false;
    }

    const timeSinceLastFailure = Date.now() - this.circuitBreakerLastFailure;
    return timeSinceLastFailure < this.circuitBreakerTimeout;
  }

  /**
   * Records a circuit breaker failure
   */
  private recordCircuitBreakerFailure(): void {
    this.circuitBreakerFailures++;
    this.circuitBreakerLastFailure = Date.now();
  }

  /**
   * Resets the circuit breaker
   */
  private resetCircuitBreaker(): void {
    this.circuitBreakerFailures = 0;
  }

  /**
   * Gets current circuit breaker status
   */
  getCircuitBreakerStatus(): { isOpen: boolean; failures: number; lastFailure: number } {
    return {
      isOpen: this.isCircuitBreakerOpen(),
      failures: this.circuitBreakerFailures,
      lastFailure: this.circuitBreakerLastFailure
    };
  }

  /**
   * Resets the circuit breaker (for testing purposes)
   */
  resetCircuitBreakerForTesting(): void {
    this.circuitBreakerFailures = 0;
    this.circuitBreakerLastFailure = 0;
  }
}
