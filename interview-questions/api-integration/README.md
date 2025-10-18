# API Integration and JSON Handling

## Problem Description

Build a robust API integration system that can send HTTP requests, process JSON responses, and handle various error scenarios. This is a core skill for integration engineers working with payment systems and third-party services.

### Requirements

1. **HTTP Client**: Implement a client that can make GET, POST, PUT, and DELETE requests.

2. **JSON Processing**: Handle JSON serialization and deserialization with proper error handling.

3. **Error Handling**: Implement comprehensive error handling for various HTTP status codes and network issues.

4. **Retry Logic**: Add exponential backoff retry mechanism for transient failures.

5. **Rate Limiting**: Implement rate limiting to respect API quotas.

6. **Authentication**: Handle different authentication methods (API keys, OAuth, etc.).

### API Endpoints to Implement

Create a client for a mock payment processing API with these endpoints:

- `GET /api/v1/transactions/{id}` - Retrieve transaction details
- `POST /api/v1/transactions` - Create a new transaction
- `PUT /api/v1/transactions/{id}` - Update transaction
- `DELETE /api/v1/transactions/{id}` - Cancel transaction
- `GET /api/v1/transactions` - List transactions with pagination

### Data Models

```python
# Transaction model
{
    "id": "txn_1234567890",
    "amount": 1000,  # in cents
    "currency": "USD",
    "status": "pending",
    "description": "Payment for services",
    "customer_id": "cus_1234567890",
    "created_at": "2023-12-01T10:00:00Z",
    "updated_at": "2023-12-01T10:00:00Z"
}

# API Response wrapper
{
    "success": true,
    "data": { ... },
    "error": null,
    "pagination": {
        "page": 1,
        "per_page": 20,
        "total": 100,
        "total_pages": 5
    }
}
```

### Error Scenarios to Handle

1. **HTTP Status Codes**:
   - 200: Success
   - 400: Bad Request
   - 401: Unauthorized
   - 403: Forbidden
   - 404: Not Found
   - 429: Rate Limited
   - 500: Internal Server Error
   - 502: Bad Gateway
   - 503: Service Unavailable

2. **Network Issues**:
   - Connection timeout
   - DNS resolution failure
   - SSL/TLS errors
   - Network unreachable

3. **JSON Parsing Errors**:
   - Malformed JSON
   - Unexpected data types
   - Missing required fields

### Implementation Requirements

1. **Base API Client Class**: Create a reusable base class for API interactions.

2. **Transaction Service**: Implement a service class for transaction operations.

3. **Error Classes**: Define custom exception classes for different error types.

4. **Configuration**: Support for different environments (dev, staging, prod).

5. **Logging**: Implement comprehensive logging for debugging and monitoring.

### Example Usage

```python
# Initialize client
client = PaymentAPIClient(
    base_url="https://api.payment-service.com",
    api_key="sk_test_1234567890",
    timeout=30
)

# Create transaction
transaction_data = {
    "amount": 1000,
    "currency": "USD",
    "description": "Test payment"
}

try:
    response = client.create_transaction(transaction_data)
    print(f"Transaction created: {response['id']}")
except APIRateLimitError:
    print("Rate limited, retrying...")
except APIAuthenticationError:
    print("Authentication failed")
except APIError as e:
    print(f"API error: {e}")
```

### Extensions

1. **Webhook Verification**: Implement webhook signature verification.

2. **Batch Operations**: Support for batch API calls.

3. **Caching**: Add response caching with TTL.

4. **Metrics**: Collect and report API usage metrics.

5. **Circuit Breaker**: Implement circuit breaker pattern for failing services.

### Evaluation Criteria

- Code organization and structure
- Error handling completeness
- Retry logic implementation
- JSON handling robustness
- Configuration management
- Logging and debugging support
- Performance considerations
