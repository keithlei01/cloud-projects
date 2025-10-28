# API Rate Limit Calculator

## Problem Statement

When integrating with Stripe's API, you need to manage rate limits to avoid hitting API quotas. Stripe has different rate limits for different endpoints and account types. You need to implement a rate limit calculator that:

1. Tracks API usage across different endpoints
2. Calculates remaining requests before hitting limits
3. Provides recommendations for optimal request timing
4. Handles different rate limit windows (per second, per minute, per hour)

## Requirements

- Implement `RateLimitCalculator` class with usage tracking
- Support multiple rate limit windows (1s, 1m, 1h)
- Track usage per endpoint and account type
- Calculate remaining requests and optimal timing
- Provide warnings when approaching limits

## Example Usage

```typescript
const calculator = new RateLimitCalculator();

// Add rate limit configuration
calculator.addEndpoint('payments', {
  requestsPerSecond: 100,
  requestsPerMinute: 1000,
  requestsPerHour: 10000
});

// Track API usage
calculator.recordRequest('payments', 'live');
calculator.recordRequest('payments', 'live');

// Get status
const status = calculator.getStatus('payments', 'live');
console.log(status.remainingRequests); // 98 per second
```

## Expected Output

```typescript
{
  endpoint: string;
  accountType: string;
  remainingRequests: {
    perSecond: number;
    perMinute: number;
    perHour: number;
  };
  nextResetTime: {
    perSecond: number;
    perMinute: number;
    perHour: number;
  };
  warnings: string[];
}
```
