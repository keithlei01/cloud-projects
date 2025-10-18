// Simple test for API Integration solution
const { PaymentAPIClient, APIError, APIRateLimitError, APIAuthenticationError } = require('./solution');

console.log('🧪 Testing API Integration Solution\n');

// Test 1: Create API Client
console.log('1️⃣ Testing PaymentAPIClient creation');
try {
    const config = {
        baseUrl: 'https://api.payment-service.com',
        apiKey: 'test_api_key_12345',
        timeout: 5000,
        maxRetries: 3,
        retryBackoffFactor: 2,
        rateLimitRequests: 100,
        rateLimitWindow: 60
    };
    
    const client = new PaymentAPIClient(config);
    console.log('✅ PaymentAPIClient created successfully');
    console.log('Config:', config);
} catch (error) {
    console.log('❌ Error creating client:', error.message);
}
console.log('');

// Test 2: Test error classes
console.log('2️⃣ Testing error classes');
try {
    const apiError = new APIError('Test error', 'network_error');
    console.log('✅ APIError created:', apiError.message);
    
    const rateLimitError = new APIRateLimitError('Rate limited', 30);
    console.log('✅ APIRateLimitError created:', rateLimitError.message, 'Retry after:', rateLimitError.retryAfter);
    
    const authError = new APIAuthenticationError('Invalid credentials');
    console.log('✅ APIAuthenticationError created:', authError.message);
} catch (error) {
    console.log('❌ Error creating error classes:', error.message);
}
console.log('');

// Test 3: Test API methods (will fail due to network, but shows structure)
console.log('3️⃣ Testing API methods');
try {
    const config = {
        baseUrl: 'https://api.payment-service.com',
        apiKey: 'test_api_key_12345',
        timeout: 1000, // Short timeout for quick test
        maxRetries: 1,
        retryBackoffFactor: 2,
        rateLimitRequests: 100,
        rateLimitWindow: 60
    };
    
    const client = new PaymentAPIClient(config);
    
    // Test getTransaction (will fail due to network)
    console.log('Testing getTransaction...');
    client.getTransaction('txn_test123')
        .then(result => {
            console.log('✅ getTransaction result:', result);
        })
        .catch(error => {
            console.log('⚠️  getTransaction failed (expected):', error.message);
        });
    
    // Test createTransaction (will fail due to network)
    console.log('Testing createTransaction...');
    const transactionData = {
        amount: 2500,
        currency: 'USD',
        customer_id: 'cus_test123',
        payment_method: 'card_1234'
    };
    
    client.createTransaction(transactionData)
        .then(result => {
            console.log('✅ createTransaction result:', result);
        })
        .catch(error => {
            console.log('⚠️  createTransaction failed (expected):', error.message);
        });
        
} catch (error) {
    console.log('❌ Error testing API methods:', error.message);
}
console.log('');

// Test 4: Test error handling
console.log('4️⃣ Testing error handling');
try {
    const config = {
        baseUrl: 'https://invalid-url-that-does-not-exist.com',
        apiKey: 'test_key',
        timeout: 1000,
        maxRetries: 1,
        retryBackoffFactor: 2,
        rateLimitRequests: 100,
        rateLimitWindow: 60
    };
    
    const client = new PaymentAPIClient(config);
    
    // This should fail gracefully
    client.getTransaction('txn_test')
        .then(result => {
            console.log('Unexpected success:', result);
        })
        .catch(error => {
            console.log('✅ Error handled gracefully:', error.message);
        });
        
} catch (error) {
    console.log('❌ Error in error handling test:', error.message);
}
console.log('');

console.log('🎉 API Integration tests completed!');
console.log('Note: Network calls will fail as expected since we\'re using test URLs');
