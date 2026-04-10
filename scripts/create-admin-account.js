#!/usr/bin/env node

/**
 * Create Admin Account Script
 * 
 * Creates an admin user account for testing purposes.
 * Usage: node scripts/create-admin-account.js <email> <password> <name> [baseUrl]
 */

const BASE_URL = process.argv[5] || process.argv[4] || 'http://localhost:5000';

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] || process.argv[3] || 'Admin User';

if (!email || !password) {
  console.error('Usage: node scripts/create-admin-account.js <email> <password> <name> [baseUrl]');
  console.error('Example: node scripts/create-admin-account.js admin@example.com password123 "Admin User"');
  process.exit(1);
}

async function createAdminAccount() {
  try {
    console.log(`Creating admin account: ${email}`);
    console.log(`Base URL: ${BASE_URL}\n`);
    
    // Use native fetch if available (Node.js 18+), otherwise use node-fetch
    let fetchFn;
    try {
      fetchFn = globalThis.fetch || require('node-fetch');
    } catch {
      console.error('❌ fetch API not available. Please install node-fetch: yarn add node-fetch');
      process.exit(1);
    }
    
    // First, try to register the user
    const registerResponse = await fetchFn(`${BASE_URL}/api/ceeone/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        name,
        roleType: 'admin',
        isEmailVerified: true // Auto-verify for admin accounts
      })
    });
    
    if (registerResponse.ok) {
      const data = await registerResponse.json();
      console.log('✅ Admin account created successfully!');
      console.log(`   Email: ${email}`);
      console.log(`   Name: ${name}`);
      console.log(`   Role: admin`);
      return;
    }
    
    // If registration fails, try to create via users endpoint (requires existing admin)
    console.log('⚠️  Registration failed. Attempting to create via users endpoint...');
    console.log('   (This requires an existing admin account)');
    
    // You would need to login as an existing admin first
    console.log('\n📝 To create via users endpoint:');
    console.log('   1. Login as an existing admin');
    console.log('   2. Use the /api/ceeone/users POST endpoint');
    console.log('   3. Set roleType to "admin"');
    
  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
    process.exit(1);
  }
}

createAdminAccount();
