const { reorderLogFiles } = require('./solution');

describe('reorderLogFiles', () => {
  test('should handle basic example', () => {
    const logs = [
      "let1 art can",
      "let2 own kit dig",
      "let3 art zero",
      "dig1 8 1 5 1",
      "dig2 3 6"
    ];
    const expected = ["let1 art can", "let3 art zero", "let2 own kit dig", "dig1 8 1 5 1", "dig2 3 6"];
    const result = reorderLogFiles(logs);
    expect(result).toEqual(expected);
  });

  test('should handle all letter logs', () => {
    const logs = [
      "let3 art zero",
      "let1 art can",
      "let2 own kit dig"
    ];
    const expected = ["let1 art can", "let3 art zero", "let2 own kit dig"];
    const result = reorderLogFiles(logs);
    expect(result).toEqual(expected);
  });

  test('should handle all digit logs', () => {
    const logs = [
      "dig2 3 6",
      "dig1 8 1 5 1",
      "dig3 1 2 3"
    ];
    const expected = ["dig2 3 6", "dig1 8 1 5 1", "dig3 1 2 3"];
    const result = reorderLogFiles(logs);
    expect(result).toEqual(expected);
  });

  test('should handle empty array', () => {
    const logs = [];
    const expected = [];
    const result = reorderLogFiles(logs);
    expect(result).toEqual(expected);
  });

  test('should handle mixed with same content', () => {
    const logs = [
      "let2 art can",
      "let1 art can",
      "dig1 8 1 5 1"
    ];
    const expected = ["let1 art can", "let2 art can", "dig1 8 1 5 1"];
    const result = reorderLogFiles(logs);
    expect(result).toEqual(expected);
  });
});
