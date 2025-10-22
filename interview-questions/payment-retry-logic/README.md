# Payment Retry Logic

## Problem Statement

When processing payments through Stripe, temporary failures can occur due to network issues, rate limits, or temporary service unavailability. You need to implement a robust retry mechanism that:

1. Retries failed payments with exponential backoff
2. Respects rate limits and backoff headers
3. Handles different types of errors appropriately
4. Implements circuit breaker pattern for persistent failures

## Requirements

- Implement `PaymentRetryManager` class with retry logic
- Support exponential backoff with jitter
- Handle different error types (retryable vs non-retryable)
- Implement circuit breaker to prevent cascading failures
- Track retry attempts and success/failure rates

## Example Usage

```typescript
const retryManager = new PaymentRetryManager({
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
});

const result = await retryManager.executeWithRetry(async () => {
  return await stripe.paymentIntents.create(paymentData);
});
```

## Expected Output

```typescript
{
  success: boolean;
  result?: any;
  error?: string;
  attempts: number;
  totalTime: number;
}
```
