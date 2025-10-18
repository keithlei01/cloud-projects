function reorderLogFiles(logs: string[]): string[] {
    let result = [''];
    let lettersMap: Map<string, string> = new Map();
    let digitsMap: Map<string, string> = new Map();

    let letters = [];
    let digits = [];

    for (const s of logs) {
        if (isLetters(s)) {
            console.log(s);
            lettersMap
            letters.push(s);
        } else {
            digits.push(s);
        }
    }

    letters.sort((logA, logB) => {
        // "let1 art can"
        // "let2 own kit dig"
        const [keyA, ...wordsA] = logA.split();
        const [keyB, ...wordsB] = logB.split();

        const joinedA = wordsA.join(' ');
        const joinedB = wordsB.join(' ');
        if (joinedA === joinedB) {
            return keyA < keyB;
        }

        return joinedA < joinedB;
    });

    // return letters.concat(digits);
    return [...letters, ...digits];
};

function isLetters(s: string): boolean {
    return Number.isNaN(Number(s.split(' ')[1]));
}