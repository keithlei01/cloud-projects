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

        return[];
    }

    redactText(text: string): string {

        return text;
    }

    redactWithPartialDisplay(text: string, showLast: number = 4): string {

        return text;
    }

    private detectSeparator(cardNumber: string): string {

        return '';
    }

    getCardType(cardNumber: string): string {

        return '';
    }

}
