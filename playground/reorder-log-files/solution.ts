function reorderLogFiles(logs: string[]): string[] {
    let letters: string[] = [];
    let digits: string[] = [];

    for (const s of logs) {
        if (isLetters(s)) {
            letters.push(s);
        } else {
            digits.push(s);
        }
    }

    letters.sort((logA, logB) => {
        const [keyA, ...wordsA] = logA.split(' ');
        const [keyB, ...wordsB] = logB.split(' ');

        const joinedA = wordsA.join(' ');
        const joinedB = wordsB.join(' ');
        if (joinedA === joinedB) {
            return keyA.localeCompare(keyB);
        }

        return joinedA.localeCompare(joinedB);
    });

    return [...letters, ...digits];
}

function isLetters(s: string): boolean {
    return !Number.isNaN(Number(s.split(' ')[1]));
}

export { reorderLogFiles };