#!/usr/bin/env node

/**
 * Backend Compatibility Verification Script
 * 
 * Verifies that the backend is compatible with frontend role permissions.
 * Checks role types, JWT tokens, permission guards, and API endpoints.
 */

const BASE_URL = process.argv[2] || 'http://localhost:5000';

// Expected role types from frontend
const EXPECTED_ROLES = [
  'admin',
  'managing_director',
  'general_manager',
  'sales_representative',
  'sales_staff', // Alternative name
  'book_storekeeper',
  'auditor',
  'accountant',
  'cashier',
  'manager',
  'technical_support',
  'viewer'
];

// Test users for verification
const TEST_USERS = [
  {
    email: 'verify-admin@test.com',
    password: 'test123',
    name: 'Verify Admin',
    roleType: 'admin'
  },
  {
    email: 'verify-accountant@test.com',
    password: 'test123',
    name: 'Verify Accountant',
    roleType: 'accountant'
  },
  {
    email: 'verify-auditor@test.com',
    password: 'test123',
    name: 'Verify Auditor',
    roleType: 'auditor'
  },
  {
    email: 'verify-cashier@test.com',
    password: 'test123',
    name: 'Verify Cashier',
    roleType: 'cashier'
  },
  {
    email: 'verify-gm@test.com',
    password: 'test123',
    name: 'Verify General Manager',
    roleType: 'general_manager'
  }
];

// Helper function for HTTP requests
async function httpRequest(url, options = {}) {
  try {
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
    
    return {
      ok: response.ok,
      status: response.status,
      json: async () => response.json(),
      text: async () => response.text()
    };
  } catch (error) {
    return { 
      ok: false, 
      status: 0, 
      error: error.message, 
      json: async () => ({}), 
      text: async () => error.message 
    };
  }
}

// Decode JWT token
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch (error) {
    return null;
  }
}

// Main verification function
async function verifyBackendCompatibility() {
  console.log('🔍 Backend Compatibility Verification\n');
  console.log(`Base URL: ${BASE_URL}\n`);
  console.log('='.repeat(80));
  
  const results = {
    roleTypes: { passed: 0, failed: 0, issues: [] },
    userCreation: { passed: 0, failed: 0, issues: [] },
    jwtTokens: { passed: 0, failed: 0, issues: [] },
    permissionGuards: { passed: 0, failed: 0, issues: [] },
    defaultPermissions: { passed: 0, failed: 0, issues: [] }
  };
  
  // Step 1: Verify Role Types
  console.log('\n📋 Step 1: Verifying Role Types...\n');
  try {
    // Try to get admin token first
    const loginResponse = await httpRequest(`${BASE_URL}/api/ceeone/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@example.com', // Adjust based on your admin email
        password: 'admin123' // Adjust based on your admin password
      })
    });
    
    let adminToken = null;
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      adminToken = loginData.accessToken || loginData.token || loginData.access_token;
    }
    
    if (adminToken) {
      // Get roles from backend
      const rolesResponse = await httpRequest(`${BASE_URL}/api/ceeone/permissions/roles`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        const roles = Array.isArray(rolesData) ? rolesData : (rolesData.roles || []);
        const roleTypes = roles.map(r => r.roleType || r.type || r.name).filter(Boolean);
        
        console.log(`Found ${roleTypes.length} roles in backend:`);
        roleTypes.forEach(rt => console.log(`  - ${rt}`));
        
        // Check for expected roles
        const missingRoles = EXPECTED_ROLES.filter(er => 
          !roleTypes.some(rt => rt.toLowerCase() === er.toLowerCase())
        );
        
        if (missingRoles.length > 0) {
          console.log(`\n⚠️  Missing role types: ${missingRoles.join(', ')}`);
          results.roleTypes.failed++;
          results.roleTypes.issues.push(`Missing roles: ${missingRoles.join(', ')}`);
        } else {
          console.log('\n✅ All expected role types found');
          results.roleTypes.passed++;
        }
      } else {
        console.log('⚠️  Could not fetch roles (endpoint may not exist or requires auth)');
        results.roleTypes.issues.push('Could not fetch roles from backend');
      }
    } else {
      console.log('⚠️  Could not login as admin (skipping role type check)');
      console.log('   Please ensure admin account exists or update script with correct credentials');
      results.roleTypes.issues.push('Could not login as admin');
    }
  } catch (error) {
    console.log(`❌ Error checking role types: ${error.message}`);
    results.roleTypes.failed++;
    results.roleTypes.issues.push(error.message);
  }
  
  // Step 2: Verify User Creation
  console.log('\n📝 Step 2: Verifying User Creation...\n');
  try {
    // Get admin token
    const adminLogin = await httpRequest(`${BASE_URL}/api/ceeone/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    let adminToken = null;
    if (adminLogin.ok) {
      const loginData = await adminLogin.json();
      adminToken = loginData.accessToken || loginData.token || loginData.access_token;
    }
    
    if (adminToken) {
      for (const user of TEST_USERS) {
        const createResponse = await httpRequest(`${BASE_URL}/api/ceeone/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            email: user.email,
            password: user.password,
            name: user.name,
            roleType: user.roleType,
            isEmailVerified: true
          })
        });
        
        if (createResponse.ok || createResponse.status === 409) {
          // 409 = user already exists, which is fine
          console.log(`✅ ${user.roleType}: User creation works`);
          results.userCreation.passed++;
        } else {
          const errorText = await createResponse.text();
          console.log(`❌ ${user.roleType}: User creation failed (${createResponse.status})`);
          console.log(`   Error: ${errorText.substring(0, 100)}`);
          results.userCreation.failed++;
          results.userCreation.issues.push(`${user.roleType}: ${errorText.substring(0, 100)}`);
        }
      }
    } else {
      console.log('⚠️  Could not login as admin (skipping user creation test)');
      results.userCreation.issues.push('Could not login as admin');
    }
  } catch (error) {
    console.log(`❌ Error testing user creation: ${error.message}`);
    results.userCreation.failed++;
    results.userCreation.issues.push(error.message);
  }
  
  // Step 3: Verify JWT Token Structure
  console.log('\n🔐 Step 3: Verifying JWT Token Structure...\n');
  try {
    for (const user of TEST_USERS.slice(0, 3)) { // Test first 3 users
      const loginResponse = await httpRequest(`${BASE_URL}/api/ceeone/auth/login`, {
        method: 'POST',
        body: JSON.stringify({
          email: user.email,
          password: user.password
        })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        const token = loginData.accessToken || loginData.token || loginData.access_token;
        
        if (token) {
          const payload = decodeJWT(token);
          
          if (payload) {
            const hasPermissions = Array.isArray(payload.permissions);
            const hasRole = !!payload.role || !!payload.roleType;
            
            if (hasPermissions && hasRole) {
              console.log(`✅ ${user.roleType}: Token structure valid`);
              console.log(`   Permissions: ${payload.permissions.length} found`);
              console.log(`   Role: ${payload.role || payload.roleType}`);
              results.jwtTokens.passed++;
            } else {
              console.log(`⚠️  ${user.roleType}: Token missing required fields`);
              if (!hasPermissions) console.log('   Missing: permissions array');
              if (!hasRole) console.log('   Missing: role/roleType');
              results.jwtTokens.failed++;
              results.jwtTokens.issues.push(`${user.roleType}: Missing token fields`);
            }
          } else {
            console.log(`❌ ${user.roleType}: Could not decode token`);
            results.jwtTokens.failed++;
            results.jwtTokens.issues.push(`${user.roleType}: Invalid token format`);
          }
        } else {
          console.log(`⚠️  ${user.roleType}: No token in login response`);
          results.jwtTokens.issues.push(`${user.roleType}: No token returned`);
        }
      } else {
        console.log(`⚠️  ${user.roleType}: Could not login (user may not exist)`);
        results.jwtTokens.issues.push(`${user.roleType}: Login failed`);
      }
    }
  } catch (error) {
    console.log(`❌ Error verifying JWT tokens: ${error.message}`);
    results.jwtTokens.failed++;
    results.jwtTokens.issues.push(error.message);
  }
  
  // Step 4: Verify Permission Guards (basic check)
  console.log('\n🛡️  Step 4: Verifying Permission Guards...\n');
  console.log('   (This requires test users to be created and logged in)');
  console.log('   Run the full test suite for comprehensive permission testing\n');
  results.permissionGuards.issues.push('Run test-role-permissions.js for full permission guard testing');
  
  // Step 5: Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Verification Summary\n');
  
  const totalChecks = Object.values(results).reduce((sum, r) => sum + r.passed + r.failed, 0);
  const totalPassed = Object.values(results).reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = Object.values(results).reduce((sum, r) => sum + r.failed, 0);
  
  console.log(`Total Checks: ${totalChecks}`);
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  
  if (totalFailed > 0) {
    console.log('\n⚠️  Issues Found:\n');
    Object.entries(results).forEach(([category, result]) => {
      if (result.issues.length > 0) {
        console.log(`${category}:`);
        result.issues.forEach(issue => console.log(`  - ${issue}`));
      }
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n💡 Next Steps:');
  console.log('1. Review issues above');
  console.log('2. Fix backend issues if any');
  console.log('3. Run: node scripts/test-role-permissions.js ' + BASE_URL);
  console.log('4. Check docs/BACKEND_COMPATIBILITY_VERIFICATION.md for detailed guide\n');
}

// Run verification
verifyBackendCompatibility().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
