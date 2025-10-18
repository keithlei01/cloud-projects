// Test for Rate Limiting solution
const { RateLimitManager, RateLimitError, RateLimitMiddleware } = require('./solution');

console.log('🧪 Testing Rate Limiting Solution\n');

// Helper function to test rate limiting
async function testRateLimit(manager, key, config, testName) {
    console.log(`${testName}:`);
    try {
        const result = await manager.isAllowed(key, config);
        console.log(`Allowed: ${result.allowed}`);
        console.log(`Remaining: ${result.remaining}`);
        console.log(`Limit: ${result.limit}`);
        if (result.retryAfter) {
            console.log(`Retry after: ${result.retryAfter} seconds`);
        }
        console.log('✅ Test completed');
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
    console.log('');
}

// Test 1: Create rate limit manager
console.log('1️⃣ Create rate limit manager');
const manager = new RateLimitManager();
console.log('✅ RateLimitManager created successfully');
console.log('');

// Test 2: Basic rate limiting
console.log('2️⃣ Basic rate limiting');
const config = {
    limit: 5,
    window: 60, // 60 seconds
    algorithm: 'token_bucket'
};

await testRateLimit(manager, 'user1', config, 'Basic rate limiting');

// Test 3: Multiple requests
console.log('3️⃣ Multiple requests');
for (let i = 1; i <= 7; i++) {
    await testRateLimit(manager, 'user2', config, `Request ${i}`);
}

// Test 4: Different users
console.log('4️⃣ Different users');
await testRateLimit(manager, 'user3', config, 'Different user 1');
await testRateLimit(manager, 'user4', config, 'Different user 2');

// Test 5: Sliding window algorithm
console.log('5️⃣ Sliding window algorithm');
const slidingConfig = {
    limit: 3,
    window: 10, // 10 seconds
    algorithm: 'sliding_window'
};

await testRateLimit(manager, 'user5', slidingConfig, 'Sliding window - Request 1');
await testRateLimit(manager, 'user5', slidingConfig, 'Sliding window - Request 2');
await testRateLimit(manager, 'user5', slidingConfig, 'Sliding window - Request 3');
await testRateLimit(manager, 'user5', slidingConfig, 'Sliding window - Request 4 (should be limited)');

// Test 6: Fixed window algorithm
console.log('6️⃣ Fixed window algorithm');
const fixedConfig = {
    limit: 2,
    window: 5, // 5 seconds
    algorithm: 'fixed_window'
};

await testRateLimit(manager, 'user6', fixedConfig, 'Fixed window - Request 1');
await testRateLimit(manager, 'user6', fixedConfig, 'Fixed window - Request 2');
await testRateLimit(manager, 'user6', fixedConfig, 'Fixed window - Request 3 (should be limited)');

// Test 7: Rate limit error
console.log('7️⃣ Rate limit error');
try {
    const error = new RateLimitError('Rate limit exceeded', 30);
    console.log(`✅ RateLimitError created: ${error.message}`);
    console.log(`Retry after: ${error.retryAfter} seconds`);
} catch (error) {
    console.log(`❌ Error creating RateLimitError: ${error.message}`);
}
console.log('');

// Test 8: Rate limit middleware
console.log('8️⃣ Rate limit middleware');
const middleware = new RateLimitMiddleware(manager);
console.log('✅ RateLimitMiddleware created successfully');
console.log('');

console.log('🎉 Rate limiting tests completed!');
