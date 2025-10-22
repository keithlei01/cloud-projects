import * as crypto from 'crypto';

export interface WebhookValidationResult {
  isValid: boolean;
  error?: string;
}

export class WebhookValidator {
  private readonly maxAgeSeconds: number = 300; // 5 minutes

  /**
   * Validates a Stripe webhook signature
   * @param payload - The raw webhook payload
   * @param signature - The signature header from Stripe
   * @param secret - The webhook secret
   * @param timestamp - Current timestamp for validation
   * @returns Validation result
   */
  validateSignature(
    payload: string,
    signature: string,
    secret: string,
    timestamp: number
  ): WebhookValidationResult {
    try {
      // Parse the signature header
      const signatureData = this.parseSignature(signature);
      if (!signatureData) {
        return { isValid: false, error: 'Invalid signature format' };
      }

      // Check timestamp age
      const age = timestamp - signatureData.timestamp;
      if (age > this.maxAgeSeconds) {
        return { isValid: false, error: 'Signature too old' };
      }

      // Reconstruct the signed payload
      const signedPayload = `${signatureData.timestamp}.${payload}`;

      // Calculate expected signature
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(signedPayload, 'utf8')
        .digest('hex');

      // Compare signatures using constant-time comparison
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signatureData.signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );

      return { isValid, error: isValid ? undefined : 'Invalid signature' };
    } catch (error) {
      return { isValid: false, error: 'Validation error' };
    }
  }

  /**
   * Parses the Stripe signature header format: "t=timestamp,v1=signature"
   */
  private parseSignature(signature: string): { timestamp: number; signature: string } | null {
    const parts = signature.split(',');
    let timestamp: number | null = null;
    let signatureValue: string | null = null;

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 't') {
        timestamp = parseInt(value, 10);
      } else if (key === 'v1') {
        signatureValue = value;
      }
    }

    if (timestamp === null || signatureValue === null) {
      return null;
    }

    return { timestamp, signature: signatureValue };
  }
}
