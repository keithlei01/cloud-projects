# Payment Status Tracker

## Problem Statement

When processing payments through Stripe, you need to track payment status changes and handle state transitions properly. Payments can move through various states: pending, processing, succeeded, failed, canceled, refunded, etc. You need to implement a payment status tracker that:

1. Tracks payment status changes over time
2. Validates state transitions (not all transitions are allowed)
3. Provides status history and audit trail
4. Handles status change notifications and callbacks

## Requirements

- Implement `PaymentStatusTracker` class with state management
- Support valid state transitions (pending → processing → succeeded/failed)
- Track status change history with timestamps
- Validate state transitions and reject invalid ones
- Provide status change notifications

## Example Usage

```typescript
const tracker = new PaymentStatusTracker();

// Create a new payment
const payment = tracker.createPayment('pay_123', 'pending');

// Update status with validation
const result = tracker.updateStatus('pay_123', 'processing');
console.log(result.success); // true

// Try invalid transition
const invalidResult = tracker.updateStatus('pay_123', 'pending');
console.log(invalidResult.success); // false
console.log(invalidResult.error); // "Invalid state transition"
```

## Expected Output

```typescript
{
  success: boolean;
  error?: string;
  payment?: {
    id: string;
    status: string;
    history: Array<{
      status: string;
      timestamp: number;
      reason?: string;
    }>;
  };
}
```
