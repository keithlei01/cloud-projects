// Test for Currency Conversion solution
const { getExchangeRate } = require('./solution');

console.log('🧪 Testing Currency Conversion Solution\n');

// Helper function to compare results
function testResult(actual, expected, testName) {
    const passed = actual === expected;
    console.log(`${testName}: ${actual}`);
    console.log(`Expected: ${expected}`);
    console.log(passed ? '✅ PASS' : '❌ FAIL');
    console.log('');
    return passed;
}

// Test 1: Basic conversion
console.log('1️⃣ Basic conversion');
const rates1 = "AUD:USD:0.7,AUD:JPY:100,USD:CAD:1.2";
const result1 = getExchangeRate(rates1, 'AUD', 'USD');
testResult(result1, 0.7, 'AUD to USD');

// Test 2: Indirect conversion
console.log('2️⃣ Indirect conversion');
const result2 = getExchangeRate(rates1, 'AUD', 'CAD');
testResult(result2, 0.84, 'AUD to CAD (via USD)');

// Test 3: Same currency
console.log('3️⃣ Same currency');
const result3 = getExchangeRate(rates1, 'USD', 'USD');
testResult(result3, 1.0, 'USD to USD');

// Test 4: Impossible conversion
console.log('4️⃣ Impossible conversion');
const result4 = getExchangeRate(rates1, 'CAD', 'JPY');
testResult(result4, null, 'CAD to JPY (no path)');

// Test 5: Complex rates
console.log('5️⃣ Complex rates');
const rates2 = "USD:EUR:0.85,EUR:GBP:0.9,GBP:JPY:150,USD:CAD:1.25";
const result5 = getExchangeRate(rates2, 'USD', 'JPY');
testResult(result5, 114.75, 'USD to JPY (via EUR and GBP)');

// Test 6: Invalid input
console.log('6️⃣ Invalid input');
const result6 = getExchangeRate("", 'USD', 'EUR');
testResult(result6, null, 'Empty rates string');

console.log('🎉 Currency conversion tests completed!');
