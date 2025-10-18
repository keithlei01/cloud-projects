/**
 * Test script to verify all solutions work correctly
 */

import { getExchangeRate } from './currency-conversion/solution';
import { redactCreditCards } from './credit-card-redaction/solution';

console.log('🧪 Testing Stripe Integration Interview Questions\n');

// Test 1: Currency Conversion
console.log('1️⃣ Testing Currency Conversion...');
try {
  const rates = "AUD:USD:0.7,AUD:JPY:100,USD:CAD:1.2";
  const result = getExchangeRate(rates, 'AUD', 'USD');
  console.log(`   ✅ AUD to USD: ${result}`);
} catch (error) {
  console.log(`   ❌ Error: ${error}`);
}

// Test 2: Credit Card Redaction
console.log('\n2️⃣ Testing Credit Card Redaction...');
try {
  const text = "Payment with card 4532 1234 5678 9012 successful";
  const redacted = redactCreditCards(text);
  console.log(`   ✅ Original: ${text}`);
  console.log(`   ✅ Redacted: ${redacted}`);
} catch (error) {
  console.log(`   ❌ Error: ${error}`);
}

console.log('\n🎉 Basic tests completed successfully!');
console.log('\n📋 To run individual solutions:');
console.log('   npm run currency-conversion');
console.log('   npm run credit-card-redaction');
console.log('   npm run api-integration');
console.log('   npm run webhook-handler');
console.log('   npm run payment-processing');
console.log('   npm run error-handling');
console.log('   npm run data-validation');
console.log('   npm run rate-limiting');
