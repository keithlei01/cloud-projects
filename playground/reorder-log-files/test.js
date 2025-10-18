// Simple test for reorderLogFiles function
const { reorderLogFiles } = require('./solution');

console.log('🧪 Testing reorderLogFiles function\n');

// Helper function to compare arrays
function arraysEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

// Test 1: Basic example
console.log('1️⃣ Basic example');
const logs1 = [
    "let1 art can",
    "let2 own kit dig",
    "let3 art zero",
    "dig1 8 1 5 1",
    "dig2 3 6"
];
const expected1 = ["let1 art can", "let3 art zero", "let2 own kit dig", "dig1 8 1 5 1", "dig2 3 6"];
const result1 = reorderLogFiles(logs1);
console.log('Input:', logs1);
console.log('Expected:', expected1);
console.log('Output:', result1);
console.log(arraysEqual(result1, expected1) ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 2: All letter logs
console.log('2️⃣ All letter logs');
const logs2 = [
    "let3 art zero",
    "let1 art can",
    "let2 own kit dig"
];
const expected2 = ["let1 art can", "let3 art zero", "let2 own kit dig"];
const result2 = reorderLogFiles(logs2);
console.log('Input:', logs2);
console.log('Expected:', expected2);
console.log('Output:', result2);
console.log(arraysEqual(result2, expected2) ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 3: All digit logs
console.log('3️⃣ All digit logs');
const logs3 = [
    "dig2 3 6",
    "dig1 8 1 5 1",
    "dig3 1 2 3"
];
const expected3 = ["dig2 3 6", "dig1 8 1 5 1", "dig3 1 2 3"];
const result3 = reorderLogFiles(logs3);
console.log('Input:', logs3);
console.log('Expected:', expected3);
console.log('Output:', result3);
console.log(arraysEqual(result3, expected3) ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 4: Empty array
console.log('4️⃣ Empty array');
const logs4 = [];
const expected4 = [];
const result4 = reorderLogFiles(logs4);
console.log('Input:', logs4);
console.log('Expected:', expected4);
console.log('Output:', result4);
console.log(arraysEqual(result4, expected4) ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 5: Mixed with same content
console.log('5️⃣ Mixed with same content');
const logs5 = [
    "let2 art can",
    "let1 art can",
    "dig1 8 1 5 1"
];
const expected5 = ["let1 art can", "let2 art can", "dig1 8 1 5 1"];
const result5 = reorderLogFiles(logs5);
console.log('Input:', logs5);
console.log('Expected:', expected5);
console.log('Output:', result5);
console.log(arraysEqual(result5, expected5) ? '✅ PASS' : '❌ FAIL');
console.log('');

console.log('🎉 All tests completed!');
