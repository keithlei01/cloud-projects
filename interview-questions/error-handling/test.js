// Test for Error Handling & Retry Logic solution
const { RetryManager, RetryError, MaxRetriesExceededError, CircuitBreakerOpenError } = require('./solution');

console.log('🧪 Testing Error Handling & Retry Logic Solution\n');

// Helper function to test retry behavior
async function testRetry(operation, config, testName) {
    console.log(`${testName}:`);
    const retryManager = new RetryManager();
    
    try {
        const result = await retryManager.executeWithRetry(operation, config);
        console.log(`✅ Success: ${result}`);
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        console.log(`Error type: ${error.constructor.name}`);
    }
    console.log('');
}

// Test 1: Successful operation
console.log('1️⃣ Successful operation');
const successOperation = async () => {
    return "Operation succeeded";
};
await testRetry(successOperation, { maxRetries: 3, backoffFactor: 2 }, 'Success case');

// Test 2: Retryable failure
console.log('2️⃣ Retryable failure');
let attemptCount = 0;
const retryableOperation = async () => {
    attemptCount++;
    if (attemptCount < 3) {
        throw new Error("Temporary failure");
    }
    return "Success after retries";
};
await testRetry(retryableOperation, { maxRetries: 3, backoffFactor: 2 }, 'Retryable failure');

// Test 3: Max retries exceeded
console.log('3️⃣ Max retries exceeded');
const alwaysFailOperation = async () => {
    throw new Error("Always fails");
};
await testRetry(alwaysFailOperation, { maxRetries: 2, backoffFactor: 1 }, 'Max retries exceeded');

// Test 4: Non-retryable error
console.log('4️⃣ Non-retryable error');
const nonRetryableOperation = async () => {
    const error = new Error("Non-retryable error");
    error.isRetryable = false;
    throw error;
};
await testRetry(nonRetryableOperation, { maxRetries: 3, backoffFactor: 2 }, 'Non-retryable error');

// Test 5: Circuit breaker
console.log('5️⃣ Circuit breaker');
const circuitBreakerConfig = {
    maxRetries: 3,
    backoffFactor: 2,
    circuitBreaker: {
        failureThreshold: 2,
        recoveryTimeout: 1000,
        monitoringPeriod: 5000
    }
};

// First, trigger circuit breaker
for (let i = 0; i < 3; i++) {
    await testRetry(alwaysFailOperation, circuitBreakerConfig, `Circuit breaker trigger ${i + 1}`);
}

// Test 6: Retry decorator
console.log('6️⃣ Retry decorator');
const { retry } = require('./solution');

class TestService {
    @retry({ maxRetries: 2, backoffFactor: 1 })
    async testMethod() {
        throw new Error("Method always fails");
    }
}

const service = new TestService();
try {
    await service.testMethod();
} catch (error) {
    console.log(`✅ Decorator caught error: ${error.message}`);
}

console.log('🎉 Error handling tests completed!');
