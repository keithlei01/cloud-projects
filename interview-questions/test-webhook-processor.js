// Quick test to verify webhook-event-processor fixes
const { WebhookEventProcessor } = require('./webhook-event-processor/solution');

console.log('🧪 Testing Webhook Event Processor fixes...');

const processor = new WebhookEventProcessor();

// Test 1: Process valid event
console.log('\n1️⃣ Testing event processing...');
const event = {
  id: 'evt_123',
  type: 'payment.succeeded',
  data: {
    object: {
      id: 'pay_456',
      amount: 2000,
      currency: 'usd'
    }
  },
  created: 1234567890,
  livemode: true
};

processor.processEvent(event).then(result => {
  console.log(`Event processed: ${result.success}, processed: ${result.processed}`);
  console.log(`Event ID: ${result.eventId}, processing time: ${result.processingTime}ms`);
  
  // Test 2: Check if event is tracked
  console.log('\n2️⃣ Testing event tracking...');
  console.log(`Event is processed: ${processor.isEventProcessed('evt_123')}`);
  
  // Test 3: Test duplicate handling
  console.log('\n3️⃣ Testing duplicate handling...');
  return processor.processEvent(event);
}).then(duplicateResult => {
  console.log(`Duplicate processed: ${duplicateResult.processed} (expected: false)`);
  
  console.log('\n✅ Webhook Event Processor tests completed!');
}).catch(error => {
  console.error('❌ Test failed:', error.message);
});
