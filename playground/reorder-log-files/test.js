// Simple test for reorderLogFiles function
const { reorderLogFiles } = require('./solution');

console.log('🧪 Testing reorderLogFiles function\n');

// Test 1: Basic example
console.log('1️⃣ Basic example');
const logs1 = [
    "let1 art can",
    "let2 own kit dig",
    "let3 art zero",
    "dig1 8 1 5 1",
    "dig2 3 6"
];
const result1 = reorderLogFiles(logs1);
console.log('Input:', logs1);
console.log('Output:', result1);
console.log('✅ Test 1 completed\n');

// Test 2: All letter logs
console.log('2️⃣ All letter logs');
const logs2 = [
    "let3 art zero",
    "let1 art can",
    "let2 own kit dig"
];
const result2 = reorderLogFiles(logs2);
console.log('Input:', logs2);
console.log('Output:', result2);
console.log('✅ Test 2 completed\n');

// Test 3: All digit logs
console.log('3️⃣ All digit logs');
const logs3 = [
    "dig2 3 6",
    "dig1 8 1 5 1",
    "dig3 1 2 3"
];
const result3 = reorderLogFiles(logs3);
console.log('Input:', logs3);
console.log('Output:', result3);
console.log('✅ Test 3 completed\n');

// Test 4: Empty array
console.log('4️⃣ Empty array');
const logs4 = [];
const result4 = reorderLogFiles(logs4);
console.log('Input:', logs4);
console.log('Output:', result4);
console.log('✅ Test 4 completed\n');

console.log('🎉 All basic tests completed!');
