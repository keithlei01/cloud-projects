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
    if (!this.rates[fromCurrency]) {
      this.rates[fromCurrency] = {};
    }
    if (!this.reverseRates[toCurrency]) {
      this.reverseRates[toCurrency] = {};
    }
    
    this.rates[fromCurrency][toCurrency] = rate;
    this.reverseRates[toCurrency][fromCurrency] = 1.0 / rate;
  }

  parseRatesString(ratesString: string): void {
    if (!ratesString) {
      return;
    }

    const ratePairs = ratesString.split(',');
    for (const ratePair of ratePairs) {
      const parts = ratePair.trim().split(':');
      if (parts.length !== 3) {
        continue;
      }

      const [fromCurrency, toCurrency, rateStr] = parts;
      if (fromCurrency && toCurrency && rateStr) {
        const rate = parseFloat(rateStr);
        
        if (rate > 0) {
          this.addRate(fromCurrency, toCurrency, rate);
        }
      }
    }
  }

  getDirectRate(fromCurrency: string, toCurrency: string): number | null {
    if (fromCurrency === toCurrency) {
      return 1.0;
    }

    return this.rates[fromCurrency]?.[toCurrency] || null;
  }

  getBestRate(fromCurrency: string, toCurrency: string): number | null {
    if (fromCurrency === toCurrency) {
      return 1.0;
    }

    // Check direct rate first
    const directRate = this.getDirectRate(fromCurrency, toCurrency);
    if (directRate !== null) {
      return directRate;
    }

    // Use BFS to find all possible conversion paths
    const queue: ConversionPath[] = [{ currency: fromCurrency, rate: 1.0, path: [] }];
    const visited = new Set<string>();
    let bestRate = 0.0;

    while (queue.length > 0) {
      const { currency: currentCurrency, rate: currentRate } = queue.shift()!;

      if (visited.has(currentCurrency)) {
        continue;
      }
      visited.add(currentCurrency);

      // Check all possible conversions from current currency
      const conversions = this.rates[currentCurrency] || {};
      for (const [nextCurrency, rate] of Object.entries(conversions)) {
        const newRate = currentRate * rate;

        if (nextCurrency === toCurrency) {
          bestRate = Math.max(bestRate, newRate);
        } else if (!visited.has(nextCurrency)) {
          queue.push({ currency: nextCurrency, rate: newRate, path: [] });
        }
      }
    }

    return bestRate > 0 ? bestRate : null;
  }

  getConversionPath(fromCurrency: string, toCurrency: string): string[] | null {
    if (fromCurrency === toCurrency) {
      return [fromCurrency];
    }

    // Use BFS to find the path
    const queue: ConversionPath[] = [{ 
      currency: fromCurrency, 
      rate: 1.0, 
      path: [fromCurrency] 
    }];
    const visited = new Set<string>();
    let bestPath: string[] | null = null;
    let bestRate = 0.0;

    while (queue.length > 0) {
      const { currency: currentCurrency, rate: currentRate, path } = queue.shift()!;

      if (visited.has(currentCurrency)) {
        continue;
      }
      visited.add(currentCurrency);

      const conversions = this.rates[currentCurrency] || {};
      for (const [nextCurrency, rate] of Object.entries(conversions)) {
        const newRate = currentRate * rate;
        const newPath = [...path, nextCurrency];

        if (nextCurrency === toCurrency && newRate > bestRate) {
          bestRate = newRate;
          bestPath = newPath;
        } else if (!visited.has(nextCurrency)) {
          queue.push({ currency: nextCurrency, rate: newRate, path: newPath });
        }
      }
    }

    return bestPath;
  }
}

export function getExchangeRate(
  ratesString: string, 
  fromCurrency: string, 
  toCurrency: string
): number | null {
  const converter = new CurrencyConverter();
  converter.parseRatesString(ratesString);
  return converter.getBestRate(fromCurrency, toCurrency);
}

