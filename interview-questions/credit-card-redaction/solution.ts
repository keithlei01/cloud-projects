/**
 * Credit Card Number Redaction Solution
 * 
 * This solution implements a credit card number redaction system that:
 * 1. Detects various credit card number formats
 * 2. Validates numbers using the Luhn algorithm
 * 3. Redacts sensitive information while preserving text structure
 */

interface CardMatch {
  cardNumber: string;
  start: number;
  end: number;
}

export class CreditCardRedactor {
  private placeholder: string;
  private cardPattern: RegExp;

  constructor(placeholder: string = "[REDACTED]") {
    this.placeholder = placeholder;
    // Regex pattern to match potential credit card numbers
    // Matches 13-19 digits with optional separators (spaces, dashes, dots)
    this.cardPattern = /\b\d{4}[\s\-\.]?\d{4}[\s\-\.]?\d{4}[\s\-\.]?\d{1,4}\b|\b\d{13,19}\b/g;
  }

  luhnChecksum(cardNumber: string): boolean {
    /**
     * Validate credit card number using Luhn algorithm.
     * 
     * @param cardNumber - Credit card number as string (digits only)
     * @returns True if valid, False otherwise
     */
    if (!/^\d+$/.test(cardNumber)) {
      return false;
    }

    // Remove any non-digit characters
    const digits = cardNumber.split('').map(d => parseInt(d, 10));

    if (digits.length < 13 || digits.length > 19) {
      return false;
    }

    // Luhn algorithm
    let checksum = 0;
    for (let i = 0; i < digits.length - 1; i++) { // Exclude check digit
      const digit = digits[digits.length - 2 - i]; // Start from second-to-last digit
      if (digit !== undefined) {
        if (i % 2 === 0) { // Every second digit from the right (starting with second-to-last)
          const doubled = digit * 2;
          checksum += doubled < 10 ? doubled : doubled - 9;
        } else {
          checksum += digit;
        }
      }
    }
    // Add the check digit (last digit) without modification
    const checkDigit = digits[digits.length - 1];
    if (checkDigit !== undefined) {
      checksum += checkDigit;
    }

    return checksum % 10 === 0;
  }

  extractCardNumbers(text: string): CardMatch[] {
    /**
     * Extract potential credit card numbers from text.
     * 
     * @param text - Input text to search
     * @returns List of card matches with positions
     */
    const matches: CardMatch[] = [];
    let match;

    // Reset regex lastIndex to ensure we start from the beginning
    this.cardPattern.lastIndex = 0;

    while ((match = this.cardPattern.exec(text)) !== null) {
      // Clean the matched string to get digits only
      const cardCandidate = match[0].replace(/\D/g, '');

      // Validate using Luhn algorithm
      if (this.luhnChecksum(cardCandidate)) {
        matches.push({
          cardNumber: match[0],
          start: match.index,
          end: match.index + match[0].length
        });
      }
    }

    return matches;
  }

  redactText(text: string): string {
    /**
     * Redact credit card numbers from text.
     * 
     * @param text - Input text containing potential credit card numbers
     * @returns Text with credit card numbers replaced by placeholder
     */
    const cardNumbers = this.extractCardNumbers(text);

    // IMPORTANT: Redaction must be done in reverse order to avoid index shifting
    // Sort by position in reverse order
    cardNumbers.sort((a, b) => b.start - a.start);

    let redactedText = text;
    for (const { start, end } of cardNumbers) {
      redactedText = redactedText.slice(0, start) + this.placeholder + redactedText.slice(end);
    }

    return redactedText;
  }

  redactWithPartialDisplay(text: string, showLast: number = 4): string {
    /**
     * Redact credit card numbers but show last N digits.
     * 
     * @param text - Input text containing potential credit card numbers
     * @param showLast - Number of last digits to show
     * @returns Text with credit card numbers partially redacted
     */
    const cardNumbers = this.extractCardNumbers(text);
    cardNumbers.sort((a, b) => b.start - a.start);

    let redactedText = text;
    for (const { cardNumber, start, end } of cardNumbers) {
      // Extract digits only
      const digits = cardNumber.replace(/\D/g, '');
      if (digits.length >= showLast) {
        // Create partial display: ****-****-****-1234
        const lastDigits = digits.slice(-showLast);
        const separator = this.detectSeparator(cardNumber);
        const partialDisplay = `****${separator}****${separator}****${separator}${lastDigits}`;
        redactedText = redactedText.slice(0, start) + partialDisplay + redactedText.slice(end);
      } else {
        redactedText = redactedText.slice(0, start) + this.placeholder + redactedText.slice(end);
      }
    }

    return redactedText;
  }

  private detectSeparator(cardNumber: string): string {
    /** Detect the separator used in the credit card number. */
    if (cardNumber.includes(' ')) {
      return ' ';
    } else if (cardNumber.includes('-')) {
      return '-';
    } else if (cardNumber.includes('.')) {
      return '.';
    } else {
      return '';
    }
  }

  getCardType(cardNumber: string): string {
    /**
     * Determine credit card type based on number pattern.
     * 
     * @param cardNumber - Credit card number (digits only)
     * @returns Card type string
     */
    const digits = cardNumber.replace(/\D/g, '');

    if (digits.startsWith('4')) {
      return 'Visa';
    } else if (digits.startsWith('51') || digits.startsWith('52') || 
               digits.startsWith('53') || digits.startsWith('54') || 
               digits.startsWith('55')) {
      return 'MasterCard';
    } else if (digits.startsWith('34') || digits.startsWith('37')) {
      return 'American Express';
    } else if (digits.startsWith('300') || digits.startsWith('301') || 
               digits.startsWith('302') || digits.startsWith('303') || 
               digits.startsWith('304') || digits.startsWith('305') || 
               digits.startsWith('36') || digits.startsWith('38')) {
      return 'Diners Club';
    } else if (digits.startsWith('6011')) {
      return 'Discover';
    } else {
      return 'Unknown';
    }
  }
}

