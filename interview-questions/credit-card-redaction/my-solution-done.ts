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
        this.cardPattern = /\b\d{4}[\s\-\.]?\d{4}[\s\-\.]?\d{4}[\s\-\.]?\d{1,4}\b|\b\d{13,19}\b/g;
    }

    luhnChecksum(cardNumber: string): boolean {
        if (Number.isNaN(Number(cardNumber))) {
            return false;
        }

        const digits = cardNumber.split('').map((digit) => parseInt(digit, 10));
        // console.log("digits=" + digits);

        if (digits.length < 13 || digits.length > 19) {
            return false;
        }

        let evenSum = 0;
        let oddSum = 0;
        let y = 1;
        for (let i = digits.length - 1; i >= 0; i--) {
            // 79927398713
            // 3x2
            // 8x2=16=7
            const digit = digits[i];
            if (digit === undefined) {
                return false;
            }

            if (y % 2 == 0) {
                let tempSum = digit * 2;
                if (tempSum >= 10) {
                    tempSum = (tempSum % 10) + 1;
                }
                evenSum += tempSum;
                // console.log(y + ": digit=" + digit + ", tempSum=" + tempSum + ", evenSum=" + evenSum);
            } else {
                oddSum += digit;
                // console.log(y + ": digit=" + digit + ", oddSum=" + oddSum);
            }
            y++;
        }

        const result = ((evenSum + oddSum) % 10) === 0;
        // console.log("luhnChecksum=" + result);
        return result;
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

    /**
     * 1. extract cards from text
     * 2. loop through cards in reverse order () and redact
     */
    redactText(text: string): string {
        const cardMatches = this.extractCardNumbers(text);
        // console.log("-------------> cardMatches=" + cardMatches.length);
        cardMatches.sort((a, b) => b.start - a.start);

        let redactedText = text;
        for (const { start, end } of cardMatches) {
            redactedText = redactedText.slice(0, start) + this.placeholder + redactedText.slice(end);
        }

        return redactedText;
    }

    redactWithPartialDisplay(text: string, _showLast: number = 4): string {
        // TODO: Implement partial display redaction
        return text;
    }

    // private detectSeparator(cardNumber: string): string {
    //     if (cardNumber.includes(' ')) {
    //         return ' ';
    //     } else if (cardNumber.includes('-')) {
    //         return '-';
    //     } else if (cardNumber.includes('.')) {
    //         return '.';
    //     }
    //     return '';
    // }

    getCardType(cardNumber: string): string {
        const digits = cardNumber.replace(/\D/g, '');

        if (digits.startsWith('4')) {
            return 'Visa';
        } else if (digits.startsWith('51') || digits.startsWith('52') || digits.startsWith('53') || digits.startsWith('54') || digits.startsWith('55')) {
            return 'MasterCard';
        } else if (digits.startsWith('34') || digits.startsWith('37')) {
            return 'American Express';
        } else if (digits.startsWith('300') || digits.startsWith('301') || digits.startsWith('302') || digits.startsWith('303') || digits.startsWith('304') || digits.startsWith('305') || digits.startsWith('36') || digits.startsWith('38')) {
            return 'Diners Club';
        } else if (digits.startsWith('6011')) {
            return 'Discover';
        }
        return 'Unknown';
    }

}
