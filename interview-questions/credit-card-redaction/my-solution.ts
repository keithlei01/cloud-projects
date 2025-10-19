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

        return true;
    }

    extractCardNumbers(text: string): CardMatch[] {

        return [];
    }

    redactText(text: string): string {

        return text;
    }

    redactWithPartialDisplay(text: string, showLast: number = 4): string {

        return text;
    }

    private detectSeparator(cardNumber: string): string {
        if (cardNumber.includes(' ')) {
            return ' ';
        } else if (cardNumber.includes('-')) {
            return '-';
        } else if (cardNumber.includes('.')) {
            return '.';
        }
        return '';
    }

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
