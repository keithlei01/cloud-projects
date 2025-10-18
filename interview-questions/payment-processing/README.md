# Payment Processing System

## Problem Description

Design and implement a payment processing system that can handle multiple payment methods, currencies, and business rules. This system should be robust, secure, and scalable for handling real-world payment scenarios.

### Requirements

1. **Multiple Payment Methods**: Support credit cards, bank transfers, digital wallets, and cryptocurrency.

2. **Multi-Currency Support**: Handle payments in different currencies with proper conversion.

3. **Payment States**: Implement a state machine for payment lifecycle management.

4. **Fraud Detection**: Basic fraud detection and risk assessment.

5. **Compliance**: Handle PCI DSS compliance requirements and data protection.

6. **Reporting**: Generate payment reports and analytics.

### Payment Methods to Support

- **Credit Cards**: Visa, MasterCard, American Express, Discover
- **Bank Transfers**: ACH, Wire transfers, SEPA
- **Digital Wallets**: PayPal, Apple Pay, Google Pay
- **Cryptocurrency**: Bitcoin, Ethereum (basic support)

### Payment States

Implement a state machine with these states:

- `pending` - Payment initiated but not processed
- `processing` - Payment being processed
- `succeeded` - Payment completed successfully
- `failed` - Payment failed
- `cancelled` - Payment cancelled by user or system
- `refunded` - Payment refunded
- `disputed` - Payment under dispute
- `expired` - Payment expired

### Data Models

```python
# Payment model
{
    "id": "pay_1234567890",
    "amount": 1000,  # in cents
    "currency": "USD",
    "payment_method": "credit_card",
    "payment_method_details": {
        "card": {
            "brand": "visa",
            "last4": "4242",
            "exp_month": 12,
            "exp_year": 2025
        }
    },
    "status": "succeeded",
    "customer_id": "cus_1234567890",
    "description": "Payment for services",
    "metadata": {
        "order_id": "order_123",
        "product_id": "prod_456"
    },
    "fraud_score": 0.1,
    "risk_level": "low",
    "created_at": "2023-12-01T10:00:00Z",
    "updated_at": "2023-12-01T10:00:05Z"
}

# Customer model
{
    "id": "cus_1234567890",
    "email": "customer@example.com",
    "name": "John Doe",
    "address": {
        "line1": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "postal_code": "94105",
        "country": "US"
    },
    "payment_methods": ["pay_1234567890"],
    "risk_profile": "low",
    "created_at": "2023-12-01T09:00:00Z"
}
```

### Business Rules

1. **Amount Validation**: Minimum $0.50, maximum $100,000 per transaction
2. **Currency Support**: USD, EUR, GBP, JPY, CAD, AUD
3. **Fraud Detection**: Block payments with fraud score > 0.8
4. **Rate Limiting**: Max 10 payments per customer per hour
5. **Refund Policy**: Full refunds within 30 days, partial refunds after

### Implementation Requirements

1. **Payment Service**: Core payment processing logic
2. **Payment Method Handlers**: Separate handlers for each payment method
3. **State Machine**: Implement payment state transitions
4. **Fraud Detection**: Basic risk scoring system
5. **Database Layer**: Store payments, customers, and transactions
6. **API Layer**: RESTful API for payment operations
7. **Event System**: Publish payment events for other services

### API Endpoints

- `POST /api/v1/payments` - Create new payment
- `GET /api/v1/payments/{id}` - Get payment details
- `POST /api/v1/payments/{id}/capture` - Capture authorized payment
- `POST /api/v1/payments/{id}/refund` - Refund payment
- `POST /api/v1/payments/{id}/cancel` - Cancel payment
- `GET /api/v1/customers/{id}/payments` - List customer payments

### Example Usage

```python
# Create payment
payment_data = {
    "amount": 1000,
    "currency": "USD",
    "payment_method": "credit_card",
    "payment_method_details": {
        "card": {
            "number": "4242424242424242",
            "exp_month": 12,
            "exp_year": 2025,
            "cvc": "123"
        }
    },
    "customer_id": "cus_1234567890",
    "description": "Payment for services"
}

payment = payment_service.create_payment(payment_data)
print(f"Payment created: {payment.id} with status {payment.status}")

# Process payment
result = payment_service.process_payment(payment.id)
print(f"Payment result: {result.status}")
```

### Extensions

1. **Subscription Payments**: Handle recurring payments
2. **Split Payments**: Distribute payments to multiple recipients
3. **International Payments**: Handle cross-border payments
4. **Payment Plans**: Installment payment support
5. **Loyalty Programs**: Integrate with customer loyalty systems
6. **Analytics Dashboard**: Real-time payment analytics

### Security Considerations

- Encrypt sensitive payment data
- Implement proper authentication and authorization
- Use secure communication (HTTPS/TLS)
- Follow PCI DSS compliance guidelines
- Implement audit logging
- Handle data retention policies

### Evaluation Criteria

- System architecture and design
- Payment state management
- Error handling and edge cases
- Security implementation
- Code organization and maintainability
- Database design
- API design and documentation
- Testing strategy
