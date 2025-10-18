# Error Handling and Retry Logic

## Problem Description

Implement a robust error handling and retry system for distributed systems and API integrations. This is crucial for building reliable payment processing systems that can handle network failures, service outages, and transient errors.

### Requirements

1. **Retry Strategies**: Implement different retry strategies (exponential backoff, linear backoff, fixed delay).

2. **Circuit Breaker**: Implement circuit breaker pattern to prevent cascading failures.

3. **Error Classification**: Classify errors into retryable and non-retryable categories.

4. **Dead Letter Queue**: Handle permanently failed operations.

5. **Monitoring**: Track retry attempts, success rates, and error patterns.

6. **Configuration**: Make retry behavior configurable per operation type.

### Error Types to Handle

- **Network Errors**: Connection timeouts, DNS failures, network unreachable
- **HTTP Errors**: 5xx server errors, 429 rate limiting, 503 service unavailable
- **Business Logic Errors**: Invalid data, authentication failures, authorization errors
- **Resource Errors**: Database connection failures, file system errors
- **External Service Errors**: Third-party API failures, webhook delivery failures

### Retry Strategies

1. **Exponential Backoff**: `delay = base_delay * (2 ^ attempt) + jitter`
2. **Linear Backoff**: `delay = base_delay * attempt`
3. **Fixed Delay**: `delay = base_delay`
4. **Custom Backoff**: User-defined delay calculation

### Circuit Breaker States

- **Closed**: Normal operation, requests pass through
- **Open**: Circuit is open, requests fail fast
- **Half-Open**: Testing if service has recovered

### Implementation Requirements

1. **Retry Manager**: Central retry logic with configurable strategies
2. **Error Classifier**: Categorize errors for retry decisions
3. **Circuit Breaker**: Implement circuit breaker pattern
4. **Dead Letter Queue**: Store permanently failed operations
5. **Metrics Collection**: Track retry statistics and success rates
6. **Configuration System**: Flexible retry configuration

### Example Usage

```python
# Configure retry for API calls
retry_config = RetryConfig(
    max_attempts=3,
    base_delay=1.0,
    max_delay=60.0,
    backoff_strategy=BackoffStrategy.EXPONENTIAL,
    jitter=True
)

# Use with API client
api_client = APIClient(retry_config=retry_config)

try:
    response = api_client.make_request("GET", "/api/payments")
except MaxRetriesExceededError:
    # Handle permanent failure
    dead_letter_queue.add_operation(operation)
except CircuitBreakerOpenError:
    # Handle circuit breaker open
    fallback_service.handle_request()
```

### Configuration Examples

```python
# Different retry configs for different operations
configs = {
    "payment_processing": RetryConfig(
        max_attempts=5,
        base_delay=2.0,
        backoff_strategy=BackoffStrategy.EXPONENTIAL
    ),
    "webhook_delivery": RetryConfig(
        max_attempts=10,
        base_delay=1.0,
        backoff_strategy=BackoffStrategy.LINEAR
    ),
    "database_operations": RetryConfig(
        max_attempts=3,
        base_delay=0.5,
        backoff_strategy=BackoffStrategy.FIXED
    )
}
```

### Extensions

1. **Adaptive Retry**: Adjust retry behavior based on success rates
2. **Retry Budget**: Limit total retry attempts across all operations
3. **Priority Queuing**: Prioritize retry attempts based on operation importance
4. **Distributed Retry**: Coordinate retries across multiple service instances
5. **Retry Analytics**: Advanced analytics and reporting on retry patterns

### Monitoring and Alerting

- Track retry attempt counts
- Monitor success/failure rates
- Alert on high retry rates
- Track circuit breaker state changes
- Monitor dead letter queue size

### Evaluation Criteria

- Error classification accuracy
- Retry strategy implementation
- Circuit breaker logic
- Configuration flexibility
- Monitoring and observability
- Code organization and testability
- Performance impact
- Edge case handling
