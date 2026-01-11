#!/usr/bin/env node

/**
 * Role Permission Testing Script
 * 
 * Tests that all roles have their permissions working correctly in the system.
 * Creates test users for each role and verifies API endpoint access.
 */

const BASE_URL = process.argv[2] || 'http://localhost:5000';

// Test users configuration
const TEST_USERS = [
  {
    email: 'test-admin@ceeone.com',
    password: 'test123',
    name: 'Test Admin',
    roleType: 'admin',
    roleName: 'Admin'
  },
  {
    email: 'test-md@ceeone.com',
    password: 'test123',
    name: 'Test MD',
    roleType: 'managing_director',
    roleName: 'Managing Director'
  },
  {
    email: 'test-gm@ceeone.com',
    password: 'test123',
    name: 'Test GM',
    roleType: 'general_manager',
    roleName: 'General Manager'
  },
  {
    email: 'test-sales@ceeone.com',
    password: 'test123',
    name: 'Test Sales Rep',
    roleType: 'sales_representative',
    roleName: 'Sales Representative'
  },
  {
    email: 'test-storekeeper@ceeone.com',
    password: 'test123',
    name: 'Test Storekeeper',
    roleType: 'book_storekeeper',
    roleName: 'Book Storekeeper'
  },
  {
    email: 'test-auditor@ceeone.com',
    password: 'test123',
    name: 'Test Auditor',
    roleType: 'auditor',
    roleName: 'Auditor'
  },
  {
    email: 'test-accountant@ceeone.com',
    password: 'test123',
    name: 'Test Accountant',
    roleType: 'accountant',
    roleName: 'Accountant'
  },
  {
    email: 'test-cashier@ceeone.com',
    password: 'test123',
    name: 'Test Cashier',
    roleType: 'cashier',
    roleName: 'Cashier'
  }
];

// Test endpoints configuration
const TEST_ENDPOINTS = {
  // Users endpoints
  'users.view': { method: 'GET', path: '/api/ceeone/users', shouldWork: ['admin', 'managing_director', 'general_manager'] },
  'users.create': { method: 'POST', path: '/api/ceeone/users', shouldWork: ['admin'] },
  'users.delete': { method: 'DELETE', path: '/api/ceeone/users/{id}', shouldWork: ['admin'] },
  
  // Products endpoints
  'products.view': { method: 'GET', path: '/api/ceeone/products', shouldWork: ['admin', 'managing_director', 'general_manager', 'sales_representative', 'book_storekeeper', 'auditor', 'accountant', 'cashier'] },
  'products.create': { method: 'POST', path: '/api/ceeone/products', shouldWork: ['admin', 'book_storekeeper'] },
  'products.edit': { method: 'PUT', path: '/api/ceeone/products/{id}', shouldWork: ['admin', 'managing_director', 'general_manager', 'book_storekeeper'] },
  'products.delete': { method: 'DELETE', path: '/api/ceeone/products/{id}', shouldWork: ['admin'] },
  
  // Sales endpoints
  'sales.view': { method: 'GET', path: '/api/ceeone/sales', shouldWork: ['admin', 'managing_director', 'general_manager', 'sales_representative', 'book_storekeeper', 'auditor', 'accountant', 'cashier'] },
  'sales.create': { method: 'POST', path: '/api/ceeone/sales', shouldWork: ['admin', 'managing_director', 'general_manager', 'sales_representative', 'cashier'] },
  'sales.edit': { method: 'PUT', path: '/api/ceeone/sales/{id}', shouldWork: ['admin', 'managing_director', 'general_manager', 'sales_representative', 'accountant', 'cashier'] },
  'sales.delete': { method: 'DELETE', path: '/api/ceeone/sales/{id}', shouldWork: ['admin'] },
  
  // Customers endpoints
  'customers.view': { method: 'GET', path: '/api/ceeone/customers', shouldWork: ['admin', 'managing_director', 'general_manager', 'sales_representative', 'book_storekeeper', 'auditor', 'accountant', 'cashier'] },
  'customers.create': { method: 'POST', path: '/api/ceeone/customers', shouldWork: ['admin', 'managing_director', 'general_manager', 'sales_representative', 'cashier'] },
  'customers.edit': { method: 'PUT', path: '/api/ceeone/customers/{id}', shouldWork: ['admin', 'managing_director', 'general_manager', 'sales_representative', 'cashier'] },
  'customers.delete': { method: 'DELETE', path: '/api/ceeone/customers/{id}', shouldWork: ['admin'] },
  
  // Inventory endpoints
  'inventory.view': { method: 'GET', path: '/api/ceeone/pharma/inventory', shouldWork: ['admin', 'managing_director', 'general_manager', 'sales_representative', 'book_storekeeper', 'auditor', 'accountant', 'cashier'] },
  'inventory.manage': { method: 'PUT', path: '/api/ceeone/pharma/inventory/{id}/adjust-stock', shouldWork: ['admin', 'book_storekeeper'] },
  
  // Reports endpoints
  'reports.view': { method: 'GET', path: '/api/ceeone/reports/sales', shouldWork: ['admin', 'managing_director', 'general_manager', 'auditor', 'accountant'] },
  
  // Expenses endpoints
  'expenses.view': { method: 'GET', path: '/api/ceeone/expenses', shouldWork: ['admin', 'managing_director', 'general_manager', 'sales_representative', 'auditor', 'accountant'] },
  'expenses.create': { method: 'POST', path: '/api/ceeone/expenses', shouldWork: ['admin', 'managing_director', 'general_manager', 'sales_representative', 'accountant'] },
  'expenses.edit': { method: 'PUT', path: '/api/ceeone/expenses/{id}', shouldWork: ['admin', 'managing_director', 'general_manager', 'accountant'] },
  
  // Approvals endpoints
  'approvals.view': { method: 'GET', path: '/api/ceeone/approvals/pending', shouldWork: ['admin', 'managing_director', 'general_manager', 'sales_representative', 'accountant'] },
  
  // Audit logs endpoints
  'audit.view_logs': { method: 'GET', path: '/api/ceeone/audit-logs', shouldWork: ['admin', 'auditor'] }
};

// Helper functions
async function httpRequest(url, options = {}) {
  try {
    // Use native fetch if available (Node.js 18+), otherwise use node-fetch
    let fetchFn;
    try {
      fetchFn = globalThis.fetch || require('node-fetch');
    } catch {
      console.error('❌ fetch API not available. Please install node-fetch: npm install node-fetch');
      process.exit(1);
    }
    
    const response = await fetchFn(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    // Create a response-like object
    return {
      ok: response.ok,
      status: response.status,
      json: () => response.json(),
      text: () => response.text()
    };
  } catch (error) {
    return { ok: false, status: 0, error: error.message, json: async () => ({}), text: async () => '' };
  }
}

async function login(email, password) {
  const response = await httpRequest(`${BASE_URL}/api/ceeone/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  
  if (response.ok) {
    const data = await response.json();
    return data.accessToken || data.token || data.access_token || data.authToken;
  }
  return null;
}

async function createUser(adminToken, userData) {
  const response = await httpRequest(`${BASE_URL}/api/ceeone/users`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      email: userData.email,
      password: userData.password,
      name: userData.name,
      roleType: userData.roleType,
      isEmailVerified: true
    })
  });
  
  return response.ok;
}

async function testEndpoint(token, endpoint, roleType) {
  const config = TEST_ENDPOINTS[endpoint];
  if (!config) return { skipped: true };
  
  const shouldWork = config.shouldWork.includes(roleType);
  const url = `${BASE_URL}${config.path}`.replace('{id}', 'test-id');
  
  const response = await httpRequest(url, {
    method: config.method,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const status = response.status || 0;
  const passed = shouldWork 
    ? (status >= 200 && status < 300)
    : (status === 403 || status === 401);
  
  return {
    passed,
    status,
    shouldWork,
    endpoint,
    roleType
  };
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Role Permission Tests\n');
  console.log(`Base URL: ${BASE_URL}\n`);
  
  // Step 1: Login as admin to create test users
  console.log('📝 Step 1: Creating test users...');
  const adminToken = await login('test-admin@ceeone.com', 'test123');
  
  if (!adminToken) {
    console.log('⚠️  Admin login failed. Attempting to create admin user...');
    // Try to create admin user (this would need to be done manually first)
    console.log('❌ Please create admin user manually first');
    return;
  }
  
  const userTokens = {};
  
  for (const user of TEST_USERS) {
    const created = await createUser(adminToken, user);
    if (created) {
      console.log(`✅ Created/Updated: ${user.roleName} (${user.email})`);
    } else {
      console.log(`⚠️  Could not create: ${user.roleName} (${user.email})`);
    }
    
    // Login as this user
    const token = await login(user.email, user.password);
    if (token) {
      userTokens[user.roleType] = token;
      console.log(`✅ Logged in as: ${user.roleName}`);
    } else {
      console.log(`❌ Failed to login as: ${user.roleName}`);
    }
  }
  
  console.log('\n📊 Step 2: Testing permissions...\n');
  
  // Step 2: Test each endpoint for each role
  const results = {};
  
  for (const user of TEST_USERS) {
    const token = userTokens[user.roleType];
    if (!token) {
      console.log(`⚠️  Skipping tests for ${user.roleName} (no token)`);
      continue;
    }
    
    results[user.roleType] = {
      roleName: user.roleName,
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0
    };
    
    console.log(`\n🔍 Testing ${user.roleName} (${user.roleType})...`);
    
    for (const [endpointName, result] of Object.entries(await Promise.all(
      Object.keys(TEST_ENDPOINTS).map(endpoint => testEndpoint(token, endpoint, user.roleType))
    ))) {
      if (result.skipped) {
        results[user.roleType].skipped++;
        continue;
      }
      
      results[user.roleType].tests.push(result);
      
      if (result.passed) {
        results[user.roleType].passed++;
        console.log(`  ✅ ${endpointName}: ${result.status} (expected)`);
      } else {
        results[user.roleType].failed++;
        const expected = result.shouldWork ? 'allowed' : 'forbidden';
        console.log(`  ❌ ${endpointName}: ${result.status} (expected ${expected})`);
      }
    }
  }
  
  // Step 3: Generate report
  console.log('\n\n📈 Test Results Summary\n');
  console.log('='.repeat(80));
  
  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  
  for (const [roleType, result] of Object.entries(results)) {
    const total = result.passed + result.failed;
    const passRate = total > 0 ? ((result.passed / total) * 100).toFixed(1) : 0;
    
    totalPassed += result.passed;
    totalFailed += result.failed;
    totalSkipped += result.skipped;
    
    console.log(`\n${result.roleName} (${roleType}):`);
    console.log(`  ✅ Passed: ${result.passed}`);
    console.log(`  ❌ Failed: ${result.failed}`);
    console.log(`  ⏭️  Skipped: ${result.skipped}`);
    console.log(`  📊 Pass Rate: ${passRate}%`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\nOverall Statistics:');
  console.log(`  ✅ Total Passed: ${totalPassed}`);
  console.log(`  ❌ Total Failed: ${totalFailed}`);
  console.log(`  ⏭️  Total Skipped: ${totalSkipped}`);
  
  const overallTotal = totalPassed + totalFailed;
  const overallPassRate = overallTotal > 0 ? ((totalPassed / overallTotal) * 100).toFixed(1) : 0;
  console.log(`  📊 Overall Pass Rate: ${overallPassRate}%`);
  
  if (totalFailed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log(`\n⚠️  ${totalFailed} test(s) failed. Please review the results above.`);
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
