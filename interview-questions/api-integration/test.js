// Jest tests for API Integration solution
const { PaymentAPIClient, APIError, APIRateLimitError, APIAuthenticationError } = require('./solution');

describe('API Integration', () => {
  let client;

  beforeEach(() => {
    const config = {
      baseUrl: 'https://api.payment-service.com',
      apiKey: 'test_api_key_12345',
      timeout: 5000,
      maxRetries: 3,
      retryBackoffFactor: 2,
      rateLimitRequests: 100,
      rateLimitWindow: 60
    };
    client = new PaymentAPIClient(config);
  });

  describe('Client Creation', () => {
    test('should create PaymentAPIClient successfully', () => {
      expect(client).toBeDefined();
      expect(client).toBeInstanceOf(PaymentAPIClient);
    });

    test('should handle invalid configuration', () => {
      expect(() => {
        new PaymentAPIClient({});
      }).toThrow();
    });
  });

  describe('Error Classes', () => {
    test('should create APIError correctly', () => {
      const error = new APIError('Test error', 'network_error');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.type).toBe('network_error');
    });

    test('should create APIRateLimitError correctly', () => {
      const error = new APIRateLimitError('Rate limited', 30);
      expect(error).toBeInstanceOf(APIError);
      expect(error.message).toBe('Rate limited');
      expect(error.retryAfter).toBe(30);
    });

    test('should create APIAuthenticationError correctly', () => {
      const error = new APIAuthenticationError('Invalid credentials');
      expect(error).toBeInstanceOf(APIError);
      expect(error.message).toBe('Invalid credentials');
      expect(error.type).toBe('authentication_error');
    });
  });

  describe('API Methods', () => {
    test('should have getTransaction method', () => {
      expect(typeof client.getTransaction).toBe('function');
    });

    test('should have createTransaction method', () => {
      expect(typeof client.createTransaction).toBe('function');
    });

    test('should have updateTransaction method', () => {
      expect(typeof client.updateTransaction).toBe('function');
    });

    test('should have deleteTransaction method', () => {
      expect(typeof client.deleteTransaction).toBe('function');
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      const invalidClient = new PaymentAPIClient({
        baseUrl: 'https://invalid-url-that-does-not-exist.com',
        apiKey: 'test_key',
        timeout: 1000,
        maxRetries: 1,
        retryBackoffFactor: 2,
        rateLimitRequests: 100,
        rateLimitWindow: 60
      });

      await expect(invalidClient.getTransaction('txn_test')).rejects.toThrow();
    });

    test('should handle timeout errors', async () => {
      const timeoutClient = new PaymentAPIClient({
        baseUrl: 'https://httpstat.us/200?sleep=5000',
        apiKey: 'test_key',
        timeout: 1000,
        maxRetries: 1,
        retryBackoffFactor: 2,
        rateLimitRequests: 100,
        rateLimitWindow: 60
      });

      await expect(timeoutClient.getTransaction('txn_test')).rejects.toThrow();
    });
  });

  describe('Configuration', () => {
    test('should accept valid configuration', () => {
      const config = {
        baseUrl: 'https://api.example.com',
        apiKey: 'sk_test_123',
        timeout: 30000,
        maxRetries: 5,
        retryBackoffFactor: 1.5,
        rateLimitRequests: 1000,
        rateLimitWindow: 3600
      };

      expect(() => new PaymentAPIClient(config)).not.toThrow();
    });

    test('should use default values for missing configuration', () => {
      const minimalConfig = {
        baseUrl: 'https://api.example.com',
        apiKey: 'sk_test_123'
      };

      expect(() => new PaymentAPIClient(minimalConfig)).not.toThrow();
    });
  });

  describe('Rate Limiting', () => {
    test('should track rate limit headers', () => {
      // This would be tested with actual API responses in integration tests
      expect(client.rateLimiter).toBeDefined();
    });
  });

  describe('Retry Logic', () => {
    test('should have retry configuration', () => {
      expect(client.config.maxRetries).toBeDefined();
      expect(client.config.retryBackoffFactor).toBeDefined();
    });

    test('should implement exponential backoff', () => {
      // This would be tested with actual retry scenarios
      expect(typeof client.calculateRetryDelay).toBe('function');
    });
  });

  describe('Request Building', () => {
    test('should build correct request headers', () => {
      const headers = client.buildHeaders();
      expect(headers).toHaveProperty('Authorization');
      expect(headers).toHaveProperty('Content-Type');
      expect(headers['Content-Type']).toBe('application/json');
    });

    test('should include API key in headers', () => {
      const headers = client.buildHeaders();
      expect(headers.Authorization).toContain('test_api_key_12345');
    });
  });

  describe('Response Handling', () => {
    test('should parse JSON responses', () => {
      const mockResponse = '{"success": true, "data": {"id": "txn_123"}}';
      const parsed = client.parseResponse(mockResponse);
      expect(parsed).toEqual({ success: true, data: { id: 'txn_123' } });
    });

    test('should handle malformed JSON', () => {
      const malformedResponse = '{"invalid": json}';
      expect(() => client.parseResponse(malformedResponse)).toThrow();
    });
  });
});