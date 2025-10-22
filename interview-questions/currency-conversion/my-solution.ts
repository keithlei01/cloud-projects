/**
 * Currency Conversion Solution
 * 
 * This solution implements a currency conversion system that can handle:
 * 1. Direct currency conversions
 * 2. Indirect conversions through intermediate currencies
 * 3. Finding the best exchange rate when multiple paths exist
 */

interface ConversionRates {
  [fromCurrency: string]: { [toCurrency: string]: number };
}

interface ConversionPath {
  currency: string;
  rate: number;
  path: string[];
}

class CurrencyConverter {
  private rates: ConversionRates = {};
  private reverseRates: ConversionRates = {};

  addRate(fromCurrency: string, toCurrency: string, rate: number): void {
  
  }

  parseRatesString(ratesString: string): void {
    
  }

  getDirectRate(fromCurrency: string, toCurrency: string): number | null {
    
    return null;
  }

  getBestRate(fromCurrency: string, toCurrency: string): number | null {
    
    return null;
  }

  getConversionPath(fromCurrency: string, toCurrency: string): string[] | null {
    
    return null;
  }
}

export function getExchangeRate(
  ratesString: string, 
  fromCurrency: string, 
  toCurrency: string
): number | null {
  
  return null;
}

