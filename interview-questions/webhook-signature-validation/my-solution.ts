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
    // TODO: Implement webhook signature validation
    // TODO: Implement webhook signature validation
    const signatureData = this.parseSignature(signature);
    if (!signatureData) {
      return { isValid: false, error: 'Invalid signature format' };
    }

    const ts = signatureData.timestamp;
    const s = signatureData.signature;

    console.log('t=' + ts + ' v1=' + s);

    // ts should be less than 5mins old
    if (timestamp - ts > this.maxAgeSeconds) {
      return { isValid: false, error: 'Signature too old' };
    }

    //reconstruct signed payload
    const signedPayload = `${signatureData.timestamp}.${payload}`;

    // HMAC-SHA256 with webhook secret
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(signedPayload);
    const signed = hmac.digest('hex');

    if (signed === s) {
      return { isValid: true };
    }

    return { isValid: false, error: 'Invalid signature' };
  }

  /**
   * Parses the Stripe signature header format: "t=timestamp,v1=signature"
   */
  private parseSignature(signature: string): { timestamp: number; signature: string } | null {
    // TODO: Implement signature parsing
    const parts = signature.split(',');
    let ts: number | null = null;
    let s: string | null = null;

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 't' && value) {
        ts = parseInt(value);
      } else if (key === 'v1' && value) {
        s = value;
      }
    }

    if (ts === null || s === null) {
      return null;
    }

    return { timestamp: ts, signature: s };
  }
}
