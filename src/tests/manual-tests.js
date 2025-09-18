#!/usr/bin/env node

const http = require('http');

// Test utilities
let testCount = 0;
let passCount = 0;

function test(name, testFn) {
  testCount++;
  console.log(`\n🧪 Test ${testCount}: ${name}`);
  try {
    const result = testFn();
    if (result instanceof Promise) {
      return result.then(() => {
        passCount++;
        console.log('✅ PASS');
      }).catch(err => {
        console.log('❌ FAIL:', err.message);
      });
    } else {
      passCount++;
      console.log('✅ PASS');
    }
  } catch (err) {
    console.log('❌ FAIL:', err.message);
  }
}

function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
  }
}

function assertNotEqual(actual, expected, message = '') {
  if (actual === expected) {
    throw new Error(`Expected not ${expected}, got ${actual}. ${message}`);
  }
}

function assertTrue(value, message = '') {
  if (!value) {
    throw new Error(`Expected truthy value, got ${value}. ${message}`);
  }
}

function assertFalse(value, message = '') {
  if (value) {
    throw new Error(`Expected falsy value, got ${value}. ${message}`);
  }
}

// HTTP helper
function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            body: jsonBody,
            headers: res.headers
          });
        } catch (err) {
          resolve({
            statusCode: res.statusCode,
            body: body,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test data
const testExperiment = {
  name: 'Segmentation Test Experiment',
  description: 'Testing user segmentation rules',
  variants: [
    { name: 'control', weight: 50, config: { buttonColor: '#blue' } },
    { name: 'treatment', weight: 50, config: { buttonColor: '#red' } }
  ],
  segmentationRules: [
    { field: 'country', operator: 'equals', value: 'US' },
    { field: 'device', operator: 'in', value: ['mobile', 'tablet'] }
  ]
};

const matchingUser = {
  userId: 'test-user-123',
  attributes: {
    country: 'US',
    device: 'mobile',
    age: 25
  }
};

const nonMatchingUser = {
  userId: 'test-user-456',
  attributes: {
    country: 'UK',
    device: 'desktop'
  }
};

// Run tests
async function runTests() {
  console.log('🚀 Running Segmentation Rules Tests');
  console.log('====================================');

  let experimentId;

  // Test 1: Create experiment with segmentation rules
  await test('Create experiment with valid segmentation rules', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/experiments',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, testExperiment);

    assertEqual(response.statusCode, 201, 'Should return 201');
    assertTrue(response.body.id, 'Should have experiment ID');
    assertEqual(response.body.segmentationRules.length, 2, 'Should have 2 segmentation rules');
    experimentId = response.body.id;
  });

  // Test 2: Assign matching user
  await test('Assign matching user to variant', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: `/api/experiments/${experimentId}/assign`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, matchingUser);

    assertEqual(response.statusCode, 200, 'Should return 200');
    assertEqual(response.body.eligible, true, 'User should be eligible');
    assertTrue(response.body.variant, 'Should have variant assignment');
    assertEqual(response.body.userId, matchingUser.userId, 'Should match user ID');
  });

  // Test 3: Reject non-matching user
  await test('Reject non-matching user', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: `/api/experiments/${experimentId}/assign`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, nonMatchingUser);

    assertEqual(response.statusCode, 200, 'Should return 200');
    assertEqual(response.body.eligible, false, 'User should not be eligible');
    assertTrue(response.body.message.includes('does not match'), 'Should have rejection message');
  });

  // Test 4: Require attributes for segmented experiments
  await test('Require attributes for segmented experiments', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: `/api/experiments/${experimentId}/assign`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, { userId: 'no-attributes-user' });

    assertEqual(response.statusCode, 400, 'Should return 400');
    assertEqual(response.body.error, 'Missing user attributes', 'Should require attributes');
  });

  // Test 5: Invalid segmentation rules
  await test('Reject invalid segmentation rules', async () => {
    const invalidExperiment = {
      ...testExperiment,
      name: 'Invalid Rules Test',
      segmentationRules: [
        { field: '', operator: 'equals', value: 'US' } // Invalid: empty field
      ]
    };

    const response = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/experiments',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, invalidExperiment);

    assertEqual(response.statusCode, 400, 'Should return 400');
    assertEqual(response.body.error, 'Invalid segmentation rules', 'Should reject invalid rules');
  });

  // Test 6: Numeric operators
  await test('Handle numeric operators correctly', async () => {
    const numericExperiment = {
      name: 'Numeric Test',
      description: 'Testing numeric operators',
      variants: [
        { name: 'control', weight: 50 },
        { name: 'treatment', weight: 50 }
      ],
      segmentationRules: [
        { field: 'age', operator: 'greater_than', value: 18 }
      ]
    };

    const createResponse = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/experiments',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, numericExperiment);

    assertEqual(createResponse.statusCode, 201, 'Should create experiment');
    const numericExpId = createResponse.body.id;

    const adultUser = {
      userId: 'adult-user',
      attributes: { age: 25 }
    };

    const assignResponse = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: `/api/experiments/${numericExpId}/assign`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, adultUser);

    assertEqual(assignResponse.statusCode, 200, 'Should return 200');
    assertEqual(assignResponse.body.eligible, true, 'Adult user should be eligible');
  });

  // Test 7: Experiment without segmentation rules
  await test('Handle experiment without segmentation rules', async () => {
    const noRulesExperiment = {
      name: 'No Rules Test',
      description: 'No segmentation',
      variants: [
        { name: 'control', weight: 50 },
        { name: 'treatment', weight: 50 }
      ]
    };

    const createResponse = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/experiments',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, noRulesExperiment);

    assertEqual(createResponse.statusCode, 201, 'Should create experiment');
    const noRulesExpId = createResponse.body.id;

    const anyUser = { userId: 'any-user' };

    const assignResponse = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: `/api/experiments/${noRulesExpId}/assign`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, anyUser);

    assertEqual(assignResponse.statusCode, 200, 'Should return 200');
    assertEqual(assignResponse.body.eligible, true, 'Any user should be eligible');
  });

  // Test summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`Total Tests: ${testCount}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${testCount - passCount}`);
  
  if (passCount === testCount) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed!');
    process.exit(1);
  }
}

// Wait a moment for server to be ready
setTimeout(runTests, 1000);