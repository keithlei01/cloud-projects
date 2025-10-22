export interface PaymentMethod {
  type: 'card' | 'bank_account' | 'sepa_debit';
  card?: {
    number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
  };
  bank_account?: {
    account_number: string;
    routing_number: string;
    account_holder_name: string;
    account_holder_type: 'individual' | 'company';
  };
}

export interface InternalPaymentData {
  amount: number | string;
  currency: string;
  payment_method: any;
  customer_id?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface StripePaymentData {
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  customer?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export class PaymentDataTransformer {
  private readonly supportedCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];
  private readonly currencySymbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'CAD': 'C$',
    'AUD': 'A$',
    'JPY': '¥'
  };

  /**
   * Converts various currency formats to cents
   */
  convertToCents(amount: string | number, _currency: string): number {
    if (typeof amount === 'number') {
      return Math.round(amount * 100);
    }

    // Remove currency symbols and whitespace
    const cleanAmount = amount.replace(/[^\d.,]/g, '');
    
    // Handle different decimal separators
    let normalizedAmount: string;
    if (cleanAmount.includes(',') && cleanAmount.includes('.')) {
      // European format: 1.234,56 or US format: 1,234.56
      const lastComma = cleanAmount.lastIndexOf(',');
      const lastDot = cleanAmount.lastIndexOf('.');
      if (lastComma > lastDot) {
        // European format: 1.234,56
        normalizedAmount = cleanAmount.replace(/\./g, '').replace(',', '.');
      } else {
        // US format: 1,234.56
        normalizedAmount = cleanAmount.replace(/,/g, '');
      }
    } else if (cleanAmount.includes(',')) {
      // Could be either format, check if it looks like thousands separator
      const parts = cleanAmount.split(',');
      if (parts.length === 2 && parts[1] && parts[1].length <= 2) {
        // Likely decimal separator: 123,45
        normalizedAmount = cleanAmount.replace(',', '.');
      } else {
        // Likely thousands separator: 1,234
        normalizedAmount = cleanAmount.replace(/,/g, '');
      }
    } else {
      normalizedAmount = cleanAmount;
    }

    const parsedAmount = parseFloat(normalizedAmount);
    if (isNaN(parsedAmount)) {
      throw new Error(`Invalid amount format: ${amount}`);
    }

    return Math.round(parsedAmount * 100);
  }

  /**
   * Formats amount in cents to currency string
   */
  formatCurrency(amountInCents: number, currency: string): string {
    if (!this.supportedCurrencies.includes(currency)) {
      throw new Error(`Unsupported currency: ${currency}`);
    }

    const amount = amountInCents / 100;
    const symbol = this.currencySymbols[currency as keyof typeof this.currencySymbols];
    
    // Handle different currency formatting rules
    if (currency === 'JPY') {
      // Japanese Yen doesn't use decimal places (1 cent = 1 yen)
      return `${symbol}${Math.round(amount).toLocaleString()}`;
    } else {
      return `${symbol}${amount.toFixed(2)}`;
    }
  }

  /**
   * Normalizes payment method data
   */
  normalizePaymentMethod(paymentMethod: any): PaymentMethod {
    if (!paymentMethod) {
      throw new Error('Payment method is required');
    }

    // Handle credit card data
    if (paymentMethod.card_number || paymentMethod.number) {
      return {
        type: 'card',
        card: {
          number: this.sanitizeCardNumber(paymentMethod.card_number || paymentMethod.number),
          exp_month: parseInt(paymentMethod.expiry_month || paymentMethod.exp_month || paymentMethod.month),
          exp_year: parseInt(paymentMethod.expiry_year || paymentMethod.exp_year || paymentMethod.year),
          cvc: paymentMethod.cvc || paymentMethod.cvv || paymentMethod.security_code
        }
      };
    }

    // Handle bank account data
    if (paymentMethod.account_number || paymentMethod.routing_number) {
      return {
        type: 'bank_account',
        bank_account: {
          account_number: paymentMethod.account_number,
          routing_number: paymentMethod.routing_number,
          account_holder_name: paymentMethod.account_holder_name || paymentMethod.holder_name,
          account_holder_type: paymentMethod.account_holder_type || 'individual'
        }
      };
    }

    throw new Error('Unsupported payment method type');
  }

  /**
   * Sanitizes card number by removing non-digits
   */
  private sanitizeCardNumber(cardNumber: string): string {
    return cardNumber.replace(/\D/g, '');
  }

  /**
   * Transforms internal payment data to Stripe API format
   */
  transformForStripeAPI(data: InternalPaymentData): StripePaymentData {
    const transformed: StripePaymentData = {
      amount: this.convertToCents(data.amount, data.currency),
      currency: data.currency.toLowerCase(),
      payment_method: this.normalizePaymentMethod(data.payment_method)
    };

    if (data.customer_id) {
      transformed.customer = data.customer_id;
    }

    if (data.description) {
      transformed.description = data.description;
    }

    if (data.metadata) {
      transformed.metadata = this.sanitizeMetadata(data.metadata);
    }

    return transformed;
  }

  /**
   * Sanitizes metadata by removing sensitive information
   */
  private sanitizeMetadata(metadata: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 'ssn', 'ssn_last4'];

    for (const [key, value] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Validates payment data before transformation
   */
  validatePaymentData(data: InternalPaymentData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate currency
    if (!this.supportedCurrencies.includes(data.currency.toUpperCase())) {
      errors.push(`Unsupported currency: ${data.currency}`);
    }

    // Validate amount
    try {
      this.convertToCents(data.amount, data.currency);
    } catch (error) {
      errors.push(`Invalid amount: ${data.amount}`);
    }

    // Validate payment method
    try {
      this.normalizePaymentMethod(data.payment_method);
    } catch (error) {
      errors.push(`Invalid payment method: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Validate card data if present
    if (data.payment_method?.card_number || data.payment_method?.number) {
      const cardNumber = this.sanitizeCardNumber(
        data.payment_method.card_number || data.payment_method.number
      );
      
      if (cardNumber.length < 13 || cardNumber.length > 19) {
        errors.push('Invalid card number length');
      }

      if (!this.isValidLuhn(cardNumber)) {
        errors.push('Invalid card number (Luhn check failed)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates card number using Luhn algorithm
   */
  private isValidLuhn(cardNumber: string): boolean {
    const digits = cardNumber.split('').map(Number);
    let sum = 0;
    let isEven = false;

    // Process digits from right to left
    for (let i = digits.length - 1; i >= 0; i--) {
      const digit = digits[i];
      if (digit === undefined) continue;

      let processedDigit = digit;
      if (isEven) {
        processedDigit *= 2;
        if (processedDigit > 9) {
          processedDigit -= 9;
        }
      }

      sum += processedDigit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Gets supported currencies
   */
  getSupportedCurrencies(): string[] {
    return [...this.supportedCurrencies];
  }
}
