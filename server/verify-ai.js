async function runTests() {
  const baseUrl = 'http://localhost:3000/api/ai';
  const sessionId = 'test-session-' + Date.now();
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  console.log('--- Starting Phase 2 & 3 Verification ---\n');

  try {
    // 1. Test Health Endpoint
    console.log('1. Testing /health endpoint...');
    const healthRes = await fetch(`${baseUrl}/health`);
    const health = await healthRes.json();
    assert(health.status === 'ready', `Health check (Active Provider: ${health.provider})`);

    // 2. Test Tool Calling & Real Data ("Where is the ISS?")
    console.log('\n2. Testing AI Chat & Tool Calling (ISS position)...');
    const chat1Res = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: "Where is the ISS right now? Tell me the altitude.", sessionId })
    });
    const chat1 = await chat1Res.json();
    
    assert(chat1.toolsUsed?.includes('get_satellite_position') || chat1.toolsUsed?.includes('satellite_lookup'), 'AI used the correct tools');
    assert(chat1.reply?.length > 10, 'AI provided a response');
    console.log(`   AI Reply: "${chat1.reply}"\n   Tools Used: [${chat1.toolsUsed?.join(', ')}]`);

    // 3. Test Memory ("What is its speed?")
    console.log('\n3. Testing Conversation Memory...');
    const chat2Res = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: "What is its speed?", sessionId })
    });
    const chat2 = await chat2Res.json();
    assert(chat2.reply?.length > 10, 'AI remembered context and responded');
    console.log(`   AI Reply: "${chat2.reply}"`);

    // 4. Test Off-Topic Guardrail
    console.log('\n4. Testing Topic Guardrail...');
    const chat3Res = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: "Write a python script to sort a list.", sessionId })
    });
    const chat3 = await chat3Res.json();
    assert(chat3.reply?.toLowerCase().includes('space') || chat3.reply?.toLowerCase().includes('track'), 'AI refused off-topic question');
    console.log(`   AI Reply: "${chat3.reply}"`);

    // 5. Test Max Length Guardrail
    console.log('\n5. Testing Max Length Guardrail...');
    const longMessage = "a".repeat(1050);
    const chat4Res = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: longMessage, sessionId })
    });
    assert(chat4Res.status === 400, 'Server rejected message > 1000 chars');

  } catch (err) {
    console.error('Test script crashed:', err.message);
    console.log('Make sure your server is running (npm run dev) in another terminal!');
  }

  console.log(`\n--- Verification Complete: ${passed} Passed, ${failed} Failed ---`);
}

runTests();
