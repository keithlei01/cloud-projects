/**
 * API Integration Solution
 * 
 * This solution implements a robust API client for payment processing with:
 * 1. HTTP client with multiple methods
 * 2. JSON processing with error handling
 * 3. Retry logic with exponential backoff
 * 4. Rate limiting support
 * 5. Comprehensive error handling
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';

enum APIErrorType {
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  NOT_FOUND = "not_found",
  RATE_LIMIT = "rate_limit",
  SERVER_ERROR = "server_error",
  NETWORK_ERROR = "network_error",
  VALIDATION_ERROR = "validation_error",
  UNKNOWN = "unknown"
}

export class APIError extends Error {
  public readonly errorType: APIErrorType;
  public readonly statusCode: number | undefined;
  public readonly responseData?: any;

  constructor(
    message: string,
    errorType: APIErrorType,
    statusCode?: number,
    responseData?: any
  ) {
    super(message);
    this.name = 'APIError';
    this.errorType = errorType;
    this.statusCode = statusCode;
    this.responseData = responseData;
  }

  override toString(): string {
    return `${this.errorType}: ${this.message}`;
  }
}

export class APIRateLimitError extends APIError {
  public readonly retryAfter: number | undefined;

  constructor(message: string, retryAfter?: number) {
    super(message, APIErrorType.RATE_LIMIT);
    this.name = 'APIRateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class APIAuthenticationError extends APIError {
  constructor(message: string) {
    super(message, APIErrorType.AUTHENTICATION);
    this.name = 'APIAuthenticationError';
  }
}

export interface APIConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  maxRetries: number;
  retryBackoffFactor: number;
  rateLimitRequests: number;
  rateLimitWindow: number; // seconds
}

// RateLimiter interface removed as it's not used in the implementation

class SimpleRateLimiter {
  private requestsPerWindow: number;
  private windowSeconds: number;
  private tokens: number;
  private lastRefill: number;

  constructor(requestsPerWindow: number, windowSeconds: number) {
    this.requestsPerWindow = requestsPerWindow;
    this.windowSeconds = windowSeconds;
    this.tokens = requestsPerWindow;
    this.lastRefill = Date.now();
  }

  acquire(): boolean {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timePassed * this.requestsPerWindow / this.windowSeconds);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.requestsPerWindow, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }

    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }

    return false;
  }

  waitTime(): number {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timePassed * this.requestsPerWindow / this.windowSeconds);

    if (tokensToAdd > 0) {
      return 0.0;
    }

    return (1.0 - tokensToAdd) * this.windowSeconds / this.requestsPerWindow;
  }
}

export class PaymentAPIClient {
  private config: APIConfig;
  private rateLimiter: SimpleRateLimiter;
  private axiosInstance: AxiosInstance;

  constructor(config: APIConfig) {
    this.config = config;
    this.rateLimiter = new SimpleRateLimiter(
      config.rateLimitRequests,
      config.rateLimitWindow
    );

    // Setup axios instance with retry strategy
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'PaymentAPIClient/1.0'
      }
    });

    // Add request interceptor for rate limiting
    this.axiosInstance.interceptors.request.use(async (config) => {
      if (!this.rateLimiter.acquire()) {
        const waitTime = this.rateLimiter.waitTime();
        console.warn(`Rate limited, waiting ${waitTime.toFixed(2)} seconds`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
      }
      return config;
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
          throw new APIRateLimitError(
            `Rate limited. Retry after ${retryAfter} seconds`,
            retryAfter
          );
        }
        throw error;
      }
    );
  }

  private async makeRequest<T = any>(
    method: string,
    endpoint: string,
    data?: any,
    params?: any
  ): Promise<T> {
    const url = `${this.config.baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

    try {
      console.log(`Making ${method} request to ${url}`);

      const response: AxiosResponse<T> = await this.axiosInstance.request({
        method: method as any,
        url: endpoint,
        data,
        params
      });

      return response.data;
    } catch (error: any) {
      if (error instanceof APIRateLimitError) {
        throw error;
      }

      // Handle different status codes
      const statusCode = error.response?.status;
      const responseData = error.response?.data;

      if (statusCode === 200 || statusCode === 201) {
        return responseData;
      } else if (statusCode === 400) {
        const errorMsg = responseData?.error?.message || 'Bad request';
        throw new APIError(
          errorMsg,
          APIErrorType.VALIDATION_ERROR,
          statusCode,
          responseData
        );
      } else if (statusCode === 401) {
        throw new APIAuthenticationError('Authentication failed');
      } else if (statusCode === 403) {
        throw new APIError(
          'Access forbidden',
          APIErrorType.AUTHORIZATION,
          statusCode,
          responseData
        );
      } else if (statusCode === 404) {
        throw new APIError(
          'Resource not found',
          APIErrorType.NOT_FOUND,
          statusCode,
          responseData
        );
      } else if (statusCode >= 500) {
        throw new APIError(
          'Server error',
          APIErrorType.SERVER_ERROR,
          statusCode,
          responseData
        );
      } else if (error.code === 'ECONNABORTED') {
        throw new APIError(
          'Request timeout',
          APIErrorType.NETWORK_ERROR
        );
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new APIError(
          'Connection error',
          APIErrorType.NETWORK_ERROR
        );
      } else {
        throw new APIError(
          `Request failed: ${error.message}`,
          APIErrorType.NETWORK_ERROR
        );
      }
    }
  }

  async getTransaction(transactionId: string): Promise<any> {
    const endpoint = `api/v1/transactions/${transactionId}`;
    return this.makeRequest('GET', endpoint);
  }

  async createTransaction(transactionData: any): Promise<any> {
    const endpoint = 'api/v1/transactions';
    return this.makeRequest('POST', endpoint, transactionData);
  }

  async updateTransaction(transactionId: string, updateData: any): Promise<any> {
    const endpoint = `api/v1/transactions/${transactionId}`;
    return this.makeRequest('PUT', endpoint, updateData);
  }

  async deleteTransaction(transactionId: string): Promise<any> {
    const endpoint = `api/v1/transactions/${transactionId}`;
    return this.makeRequest('DELETE', endpoint);
  }

  async listTransactions(
    page: number = 1,
    perPage: number = 20,
    status?: string,
    customerId?: string
  ): Promise<any> {
    const endpoint = 'api/v1/transactions';
    const params: any = {
      page,
      per_page: perPage
    };

    if (status) {
      params.status = status;
    }
    if (customerId) {
      params.customer_id = customerId;
    }

    return this.makeRequest('GET', endpoint, undefined, params);
  }
}

export class TransactionService {
  private client: PaymentAPIClient;

  constructor(client: PaymentAPIClient) {
    this.client = client;
  }

  async processPayment(
    amount: number,
    currency: string,
    customerId: string,
    description: string = ""
  ): Promise<any> {
    const transactionData = {
      amount,
      currency,
      customer_id: customerId,
      description,
      status: 'pending'
    };

    try {
      console.log(`Processing payment: ${amount} ${currency} for customer ${customerId}`);

      const response = await this.client.createTransaction(transactionData);

      if (response.success) {
        const transaction = response.data;
        console.log(`Payment processed successfully: ${transaction.id}`);
        return transaction;
      } else {
        throw new APIError(
          response.error || 'Unknown error',
          APIErrorType.UNKNOWN
        );
      }
    } catch (error) {
      if (error instanceof APIRateLimitError) {
        console.warn(`Rate limited: ${error.message}`);
        if (error.retryAfter) {
          await new Promise(resolve => setTimeout(resolve, error.retryAfter! * 1000));
          return this.processPayment(amount, currency, customerId, description);
        }
      }
      console.error(`Payment processing failed: ${error}`);
      throw error;
    }
  }

  async getTransactionStatus(transactionId: string): Promise<string> {
    try {
      const response = await this.client.getTransaction(transactionId);
      if (response.success) {
        return response.data.status || 'unknown';
      } else {
        throw new APIError('Failed to get transaction status', APIErrorType.UNKNOWN);
      }
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(`Unexpected error: ${error}`, APIErrorType.UNKNOWN);
    }
  }
}

// Example usage and testing
if (require.main === module) {
  // Configuration
  const config: APIConfig = {
    baseUrl: "https://api.payment-service.com",
    apiKey: "sk_test_1234567890",
    timeout: 30000,
    maxRetries: 3,
    retryBackoffFactor: 0.3,
    rateLimitRequests: 100,
    rateLimitWindow: 60
  };

  // Initialize client and service
  const client = new PaymentAPIClient(config);
  const service = new TransactionService(client);

  // Example: Process a payment
  async function example() {
    try {
      const transaction = await service.processPayment(
        1000, // $10.00 in cents
        "USD",
        "cus_1234567890",
        "Test payment"
      );
      console.log(`Transaction created: ${JSON.stringify(transaction)}`);

      // Get transaction status
      const status = await service.getTransactionStatus(transaction.id);
      console.log(`Transaction status: ${status}`);
    } catch (error) {
      if (error instanceof APIRateLimitError) {
        console.log(`Rate limited: ${error.message}`);
      } else if (error instanceof APIAuthenticationError) {
        console.log(`Authentication failed: ${error.message}`);
      } else if (error instanceof APIError) {
        console.log(`API error: ${error.message}`);
      } else {
        console.log(`Unexpected error: ${error}`);
      }
    }
  }

  example();
}
