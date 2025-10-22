# Webhook Signature Validation

## Problem Statement

Stripe sends webhooks to your application to notify you of events like successful payments, failed charges, etc. To ensure the webhook is authentic and hasn't been tampered with, Stripe includes a signature in the webhook headers.

Your task is to implement a webhook signature validator that:
1. Verifies the webhook signature using HMAC-SHA256
2. Validates the timestamp to prevent replay attacks
3. Returns appropriate validation results

## Requirements

- Implement `WebhookValidator` class with a `validateSignature` method
- The method should accept: payload (string), signature (string), secret (string), timestamp (number)
- Return validation result with success/failure and error message
- Reject signatures older than 5 minutes (300 seconds)
- Use HMAC-SHA256 for signature verification

## Example Usage

```typescript
const validator = new WebhookValidator();
const result = validator.validateSignature(
  '{"type":"payment.succeeded","data":{...}}',
  't=1234567890,v1=abc123...',
  'whsec_secret_key',
  1234567890
);
```

## Expected Output

```typescript
{
  isValid: boolean;
  error?: string;
}
```
