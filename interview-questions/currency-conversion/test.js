// Jest tests for Currency Conversion solution
const { getExchangeRate } = require('./solution');

describe('Currency Conversion', () => {
  describe('Basic Conversion', () => {
    test('should handle direct conversion', () => {
      const rates = "AUD:USD:0.7,AUD:JPY:100,USD:CAD:1.2";
      const result = getExchangeRate(rates, 'AUD', 'USD');
      expect(result).toBe(0.7);
    });

    test('should handle same currency conversion', () => {
      const rates = "AUD:USD:0.7,AUD:JPY:100,USD:CAD:1.2";
      const result = getExchangeRate(rates, 'USD', 'USD');
      expect(result).toBe(1.0);
    });
  });

  describe('Indirect Conversion', () => {
    test('should handle indirect conversion through one intermediate currency', () => {
      const rates = "AUD:USD:0.7,AUD:JPY:100,USD:CAD:1.2";
      const result = getExchangeRate(rates, 'AUD', 'CAD');
      expect(result).toBe(0.84); // 0.7 * 1.2
    });

    test('should handle complex multi-step conversion', () => {
      const rates = "USD:EUR:0.85,EUR:GBP:0.9,GBP:JPY:150,USD:CAD:1.25";
      const result = getExchangeRate(rates, 'USD', 'JPY');
      expect(result).toBe(114.75); // 0.85 * 0.9 * 150
    });
  });

  describe('Error Handling', () => {
    test('should return null for impossible conversion', () => {
      const rates = "AUD:USD:0.7,AUD:JPY:100,USD:CAD:1.2";
      const result = getExchangeRate(rates, 'CAD', 'JPY');
      expect(result).toBeNull();
    });

    test('should return null for empty rates string', () => {
      const result = getExchangeRate("", 'USD', 'EUR');
      expect(result).toBeNull();
    });

    test('should return null for invalid currency codes', () => {
      const rates = "AUD:USD:0.7,AUD:JPY:100,USD:CAD:1.2";
      const result = getExchangeRate(rates, 'INVALID', 'USD');
      expect(result).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    test('should handle rates with different formats', () => {
      const rates = "USD:EUR:0.85,EUR:GBP:0.9,GBP:JPY:150.0";
      const result = getExchangeRate(rates, 'USD', 'JPY');
      expect(result).toBe(114.75);
    });

    test('should handle single rate conversion', () => {
      const rates = "USD:EUR:0.85";
      const result = getExchangeRate(rates, 'USD', 'EUR');
      expect(result).toBe(0.85);
    });

    test('should handle reverse conversion', () => {
      const rates = "USD:EUR:0.85";
      const result = getExchangeRate(rates, 'EUR', 'USD');
      expect(result).toBeCloseTo(1.176, 2); // 1/0.85
    });
  });

  describe('Performance and Robustness', () => {
    test('should handle large rate sets efficiently', () => {
      const rates = Array.from({length: 50}, (_, i) => 
        `CUR${i}:CUR${i+1}:${1 + i * 0.1}`
      ).join(',');
      
      const result = getExchangeRate(rates, 'CUR0', 'CUR10');
      expect(result).toBeGreaterThan(0);
    });

    test('should handle circular rate dependencies', () => {
      const rates = "USD:EUR:0.85,EUR:GBP:0.9,GBP:USD:1.31";
      const result = getExchangeRate(rates, 'USD', 'GBP');
      expect(result).toBeCloseTo(0.765, 2); // 0.85 * 0.9
    });
  });
});