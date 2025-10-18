// Test for Payment Processing solution
const { PaymentService, PaymentError, InvalidPaymentMethodError, InsufficientFundsError, FraudDetectedError } = require('./solution');

console.log('🧪 Testing Payment Processing Solution\n');

// Helper function to test payment operations
async function testPayment(service, operation, testName) {
    console.log(`${testName}:`);
    try {
        const result = await operation();
        console.log(`✅ Success:`, result);
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        console.log(`Error type: ${error.constructor.name}`);
    }
    console.log('');
}

// Test 1: Create payment service
console.log('1️⃣ Create payment service');
const paymentService = new PaymentService();
console.log('✅ PaymentService created successfully');
console.log('');

// Test 2: Valid payment creation
console.log('2️⃣ Valid payment creation');
const validPayment = {
    amount: 1000, // $10.00
    currency: 'USD',
    customer_id: 'cus_1234567890',
    payment_method: 'card_1234',
    description: 'Test payment'
};

await testPayment(paymentService, async () => {
    return await paymentService.createPayment(validPayment);
}, 'Valid payment creation');

// Test 3: Invalid payment method
console.log('3️⃣ Invalid payment method');
const invalidPaymentMethod = {
    ...validPayment,
    payment_method: 'invalid_method'
};

await testPayment(paymentService, async () => {
    return await paymentService.createPayment(invalidPaymentMethod);
}, 'Invalid payment method');

// Test 4: Insufficient funds
console.log('4️⃣ Insufficient funds');
const insufficientFundsPayment = {
    ...validPayment,
    amount: 1000000 // $10,000.00 - likely to trigger insufficient funds
};

await testPayment(paymentService, async () => {
    return await paymentService.createPayment(insufficientFundsPayment);
}, 'Insufficient funds');

// Test 5: Fraud detection
console.log('5️⃣ Fraud detection');
const suspiciousPayment = {
    ...validPayment,
    amount: 50000, // $500.00 - might trigger fraud detection
    customer_id: 'cus_suspicious'
};

await testPayment(paymentService, async () => {
    return await paymentService.createPayment(suspiciousPayment);
}, 'Fraud detection');

// Test 6: Payment authorization
console.log('6️⃣ Payment authorization');
await testPayment(paymentService, async () => {
    const payment = await paymentService.createPayment(validPayment);
    return await paymentService.authorizePayment(payment.id);
}, 'Payment authorization');

// Test 7: Payment capture
console.log('7️⃣ Payment capture');
await testPayment(paymentService, async () => {
    const payment = await paymentService.createPayment(validPayment);
    await paymentService.authorizePayment(payment.id);
    return await paymentService.capturePayment(payment.id, 500); // Capture $5.00
}, 'Payment capture');

// Test 8: Payment refund
console.log('8️⃣ Payment refund');
await testPayment(paymentService, async () => {
    const payment = await paymentService.createPayment(validPayment);
    await paymentService.authorizePayment(payment.id);
    await paymentService.capturePayment(payment.id, 1000);
    return await paymentService.refundPayment(payment.id, 500); // Refund $5.00
}, 'Payment refund');

// Test 9: Payment cancellation
console.log('9️⃣ Payment cancellation');
await testPayment(paymentService, async () => {
    const payment = await paymentService.createPayment(validPayment);
    return await paymentService.cancelPayment(payment.id);
}, 'Payment cancellation');

console.log('🎉 Payment processing tests completed!');
