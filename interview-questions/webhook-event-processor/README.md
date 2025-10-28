# Webhook Event Processor

## Problem Statement

When integrating with Stripe, you receive webhook events for various payment-related activities. You need to process these events efficiently, handle duplicates, and ensure proper event ordering. You need to implement a webhook event processor that:

1. Processes incoming webhook events
2. Handles duplicate events (idempotency)
3. Manages event ordering and retries
4. Provides event filtering and routing
5. Tracks processing status and failures

## Requirements

- Implement `WebhookEventProcessor` class with event handling
- Support event deduplication using event IDs
- Handle event ordering and retry logic
- Provide event filtering by type and status
- Track processing metrics and failures

## Example Usage

```typescript
const processor = new WebhookEventProcessor();

// Process a webhook event
const result = await processor.processEvent({
  id: 'evt_123',
  type: 'payment.succeeded',
  data: { object: { id: 'pay_456' } },
  created: 1234567890
});

console.log(result.success); // true
console.log(result.processed); // true

// Process duplicate event
const duplicateResult = await processor.processEvent({
  id: 'evt_123', // Same ID
  type: 'payment.succeeded',
  data: { object: { id: 'pay_456' } },
  created: 1234567890
});

console.log(duplicateResult.processed); // false (already processed)
```

## Expected Output

```typescript
{
  success: boolean;
  processed: boolean;
  error?: string;
  eventId: string;
  processingTime: number;
}
```
