# Payment Data Transformation

## Problem Statement

When integrating with Stripe, you often need to transform payment data between different formats and structures. This includes:

1. Converting between different currency formats
2. Normalizing payment method data
3. Mapping between internal and external data schemas
4. Validating and sanitizing payment information

## Requirements

- Implement `PaymentDataTransformer` class with transformation methods
- Convert between different currency representations (cents, dollars, formatted strings)
- Normalize payment method data (credit cards, bank accounts, etc.)
- Map between internal payment schema and Stripe's API format
- Validate and sanitize sensitive data

## Example Usage

```typescript
const transformer = new PaymentDataTransformer();

// Convert currency formats
const amountInCents = transformer.convertToCents('$10.50', 'USD');
const formattedAmount = transformer.formatCurrency(1050, 'USD');

// Normalize payment method
const normalizedCard = transformer.normalizePaymentMethod({
  card_number: '4242424242424242',
  expiry_month: '12',
  expiry_year: '2025',
  cvc: '123'
});

// Transform for Stripe API
const stripePayment = transformer.transformForStripeAPI({
  amount: 1050,
  currency: 'USD',
  payment_method: normalizedCard,
  customer_id: 'cus_123'
});
```

## Expected Output

```typescript
{
  amount: number; // in cents
  currency: string;
  payment_method: object;
  customer_id?: string;
  metadata?: object;
}
```
