// Test for Credit Card Redaction solution
const { CreditCardRedactor } = require('./solution');

console.log('🧪 Testing Credit Card Redaction Solution\n');

// Helper function to compare results
function testResult(actual, expected, testName) {
    const passed = actual === expected;
    console.log(`${testName}:`);
    console.log(`Actual: "${actual}"`);
    console.log(`Expected: "${expected}"`);
    console.log(passed ? '✅ PASS' : '❌ FAIL');
    console.log('');
    return passed;
}

// Test 1: Basic redaction
console.log('1️⃣ Basic redaction');
const redactor1 = new CreditCardRedactor();
const text1 = "Payment with card 4532 0151 1283 0366 successful";
const result1 = redactor1.redactText(text1);
const expected1 = "Payment with card [REDACTED] successful";
testResult(result1, expected1, 'Basic redaction');

// Test 2: Multiple cards
console.log('2️⃣ Multiple cards');
const text2 = "Cards: 4532 0151 1283 0366 and 5555 5555 5555 4444";
const result2 = redactor1.redactText(text2);
const expected2 = "Cards: [REDACTED] and [REDACTED]";
testResult(result2, expected2, 'Multiple cards');

// Test 3: Different formats
console.log('3️⃣ Different formats');
const text3 = "Card 4532-0151-1283-0366 or 4532015112830366";
const result3 = redactor1.redactText(text3);
const expected3 = "Card [REDACTED] or [REDACTED]";
testResult(result3, expected3, 'Different formats');

// Test 4: No cards
console.log('4️⃣ No cards');
const text4 = "No card numbers in this text";
const result4 = redactor1.redactText(text4);
testResult(result4, text4, 'No cards (unchanged)');

// Test 5: Custom placeholder
console.log('5️⃣ Custom placeholder');
const redactor5 = new CreditCardRedactor("***");
const text5 = "Card 4532 0151 1283 0366";
const result5 = redactor5.redactText(text5);
const expected5 = "Card ***";
testResult(result5, expected5, 'Custom placeholder');

// Test 6: CreditCardRedactor class
console.log('6️⃣ CreditCardRedactor class');
const redactor = new CreditCardRedactor("XXX");
const text6 = "Processing 4532 0151 1283 0366...";
const result6 = redactor.redactText(text6);
const expected6 = "Processing XXX...";
testResult(result6, expected6, 'Class method');

// Test 7: Partial redaction
console.log('7️⃣ Partial redaction');
const result7 = redactor.redactWithPartialDisplay(text6, 4);
const expected7 = "Processing **** **** **** 0366..."; // Should show last 4 digits
testResult(result7, expected7, 'Partial redaction');

// Test 8: Test cases from solution.ts
console.log('8️⃣ Test cases from solution.ts');

const testCases = [
    "Payment with card 4532 0151 1283 0366 successful",
    "Card number 4532-1234-5678-9012 is valid",
    "Processing 4532123456789012...",
    "Multiple cards: 4532 0151 1283 0366 and 5555 5555 5555 4444",
    "No card numbers in this text",
    "Invalid: 1234 5678 9012 (too short)",
    "Edge case: 4532-1234 5678 9012 (mixed separators)",
    "Customer payment: 4532 0151 1283 0366, amount: $100.00"
];

console.log("=== Full Redaction ===");
for (const testCase of testCases) {
    const redacted = redactor.redactText(testCase);
    console.log(`Original: ${testCase}`);
    console.log(`Redacted: ${redacted}`);
    console.log();
}

console.log("=== Partial Redaction (showing last 4 digits) ===");
for (const testCase of testCases) {
    const partial = redactor.redactWithPartialDisplay(testCase, 4);
    console.log(`Original: ${testCase}`);
    console.log(`Partial:  ${partial}`);
    console.log();
}

console.log("=== Card Type Detection ===");
const testCards = [
    "4532 0151 1283 0366",  // Visa
    "5555 5555 5555 4444",  // MasterCard
    "3782 822463 10005",    // American Express
    "6011 1111 1111 1117"   // Discover
];

for (const card of testCards) {
    const cardType = redactor.getCardType(card);
    console.log(`Card: ${card} -> Type: ${cardType}`);
}

console.log('🎉 Credit card redaction tests completed!');
