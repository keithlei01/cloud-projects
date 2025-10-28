const { WebhookValidator } = require('./my-solution');
const crypto = require('crypto');

describe('Webhook Signature Validation', () => {
  let validator;
  const secret = 'whsec_test_secret_key';
  const payload = '{"type":"payment.succeeded","data":{"id":"pi_123"}}';

  beforeEach(() => {
    validator = new WebhookValidator();
  });

  describe('Valid Signatures', () => {
    test('should validate correct signature', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const signedPayload = `${timestamp}.${payload}`;
      const signature = crypto
        .createHmac('sha256', secret)
        .update(signedPayload, 'utf8')
        .digest('hex');
      const signatureHeader = `t=${timestamp},v1=${signature}`;

      const result = validator.validateSignature(payload, signatureHeader, secret, timestamp);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should validate signature within time window', () => {
      const timestamp = Math.floor(Date.now() / 1000) - 100; // 100 seconds ago
      const signedPayload = `${timestamp}.${payload}`;
      const signature = crypto
        .createHmac('sha256', secret)
        .update(signedPayload, 'utf8')
        .digest('hex');
      const signatureHeader = `t=${timestamp},v1=${signature}`;

      const result = validator.validateSignature(payload, signatureHeader, secret, timestamp + 100);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Invalid Signatures', () => {
    test('should reject invalid signature', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const signatureHeader = `t=${timestamp},v1=invalid_signature`;

      const result = validator.validateSignature(payload, signatureHeader, secret, timestamp);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid signature');
    });

    test('should reject old signatures', () => {
      const timestamp = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago
      const signedPayload = `${timestamp}.${payload}`;
      const signature = crypto
        .createHmac('sha256', secret)
        .update(signedPayload, 'utf8')
        .digest('hex');
      const signatureHeader = `t=${timestamp},v1=${signature}`;

      const result = validator.validateSignature(payload, signatureHeader, secret, timestamp + 400);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Signature too old');
    });

    test('should reject malformed signature header', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const signatureHeader = 'invalid_format';

      const result = validator.validateSignature(payload, signatureHeader, secret, timestamp);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid signature format');
    });

    test('should reject signature with missing timestamp', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const signatureHeader = 'v1=some_signature';

      const result = validator.validateSignature(payload, signatureHeader, secret, timestamp);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid signature format');
    });

    test('should reject signature with missing v1', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const signatureHeader = `t=${timestamp}`;

      const result = validator.validateSignature(payload, signatureHeader, secret, timestamp);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid signature format');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty payload', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const signedPayload = `${timestamp}.`;
      const signature = crypto
        .createHmac('sha256', secret)
        .update(signedPayload, 'utf8')
        .digest('hex');
      const signatureHeader = `t=${timestamp},v1=${signature}`;

      const result = validator.validateSignature('', signatureHeader, secret, timestamp);
      expect(result.isValid).toBe(true);
    });

    test('should handle special characters in payload', () => {
      const specialPayload = '{"type":"payment.succeeded","data":{"id":"pi_123","amount":"$100.00"}}';
      const timestamp = Math.floor(Date.now() / 1000);
      const signedPayload = `${timestamp}.${specialPayload}`;
      const signature = crypto
        .createHmac('sha256', secret)
        .update(signedPayload, 'utf8')
        .digest('hex');
      const signatureHeader = `t=${timestamp},v1=${signature}`;

      const result = validator.validateSignature(specialPayload, signatureHeader, secret, timestamp);
      expect(result.isValid).toBe(true);
    });
  });
});
