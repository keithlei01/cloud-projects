// Test for Webhook Handler solution
const { WebhookHandler, WebhookError, InvalidSignatureError, ProcessingError, DuplicateEventError } = require('./solution');

console.log('🧪 Testing Webhook Handler Solution\n');

// Helper function to test webhook operations
async function testWebhook(handler, operation, testName) {
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

// Test 1: Create webhook handler
console.log('1️⃣ Create webhook handler');
const webhookSecret = 'test_secret_key_12345';
const handler = new WebhookHandler(webhookSecret);
console.log('✅ WebhookHandler created successfully');
console.log('');

// Test 2: Valid webhook signature
console.log('2️⃣ Valid webhook signature');
const validPayload = JSON.stringify({
    id: 'evt_1234567890',
    type: 'payment.succeeded',
    data: {
        object: {
            id: 'pi_1234567890',
            amount: 1000,
            currency: 'usd'
        }
    }
});

const validSignature = 'sha256=' + require('crypto')
    .createHmac('sha256', webhookSecret)
    .update(validPayload)
    .digest('hex');

await testWebhook(handler, async () => {
    return await handler.verifySignature(validPayload, validSignature);
}, 'Valid signature verification');

// Test 3: Invalid webhook signature
console.log('3️⃣ Invalid webhook signature');
const invalidSignature = 'sha256=invalid_signature';

await testWebhook(handler, async () => {
    return await handler.verifySignature(validPayload, invalidSignature);
}, 'Invalid signature verification');

// Test 4: Process webhook event
console.log('4️⃣ Process webhook event');
const webhookEvent = {
    id: 'evt_1234567890',
    type: 'payment.succeeded',
    data: {
        object: {
            id: 'pi_1234567890',
            amount: 1000,
            currency: 'usd'
        }
    },
    created: Math.floor(Date.now() / 1000)
};

await testWebhook(handler, async () => {
    return await handler.processEvent(webhookEvent);
}, 'Process webhook event');

// Test 5: Duplicate event
console.log('5️⃣ Duplicate event');
await testWebhook(handler, async () => {
    return await handler.processEvent(webhookEvent);
}, 'Duplicate event (should be handled)');

// Test 6: Different event types
console.log('6️⃣ Different event types');
const chargeEvent = {
    id: 'evt_0987654321',
    type: 'charge.succeeded',
    data: {
        object: {
            id: 'ch_1234567890',
            amount: 2000,
            currency: 'usd'
        }
    },
    created: Math.floor(Date.now() / 1000)
};

await testWebhook(handler, async () => {
    return await handler.processEvent(chargeEvent);
}, 'Charge event processing');

// Test 7: Error classes
console.log('7️⃣ Error classes');
try {
    const webhookError = new WebhookError('Test webhook error');
    console.log(`✅ WebhookError: ${webhookError.message}`);
    
    const invalidSigError = new InvalidSignatureError('Invalid signature');
    console.log(`✅ InvalidSignatureError: ${invalidSigError.message}`);
    
    const processingError = new ProcessingError('Processing failed');
    console.log(`✅ ProcessingError: ${processingError.message}`);
    
    const duplicateError = new DuplicateEventError('Duplicate event');
    console.log(`✅ DuplicateEventError: ${duplicateError.message}`);
} catch (error) {
    console.log(`❌ Error creating error classes: ${error.message}`);
}
console.log('');

// Test 8: Event parsing
console.log('8️⃣ Event parsing');
const rawPayload = '{"id":"evt_parsing_test","type":"test.event","data":{"test":true}}';
await testWebhook(handler, async () => {
    return await handler.parseEvent(rawPayload);
}, 'Event parsing');

console.log('🎉 Webhook handler tests completed!');
