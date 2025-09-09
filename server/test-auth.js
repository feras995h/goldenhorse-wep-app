import bcrypt from 'bcryptjs';
import models from './src/models/index.js';
import axios from 'axios';

async function comprehensiveAuthAnalysis() {
  console.log('🔍 Comprehensive Authentication Analysis');
  console.log('='.repeat(50));
  
  try {
    // 1. Database Connection Test
    console.log('\n1️⃣ Database Connection Test:');
    await models.sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    // 2. User Data Verification
    console.log('\n2️⃣ User Data Verification:');
    const users = await models.User.findAll({
      attributes: ['id', 'username', 'password', 'role', 'isActive', 'name']
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.username}: role=${user.role}, active=${user.isActive}`);
    });
    
    // 3. Password Validation Test
    console.log('\n3️⃣ Password Validation Test:');
    const testPasswords = ['1', 'admin123', 'password', '123456'];
    
    for (const user of users) {
      console.log(`\nTesting user: ${user.username}`);
      for (const testPass of testPasswords) {
        const isValid = await bcrypt.compare(testPass, user.password);
        console.log(`  '${testPass}': ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      }
    }
    
    // 4. API Endpoint Test
    console.log('\n4️⃣ API Endpoint Test:');
    const baseURL = 'http://localhost:5003';
    
    try {
      const healthResponse = await axios.get(`${baseURL}/api/health`);
      console.log('✅ Health endpoint:', healthResponse.data);
    } catch (error) {
      console.log('❌ Health endpoint failed:', error.message);
    }
    
    // 5. Authentication Test
    console.log('\n5️⃣ Authentication Test:');
    const testCredentials = [
      { username: 'admin', password: 'admin123' },
      { username: 'user', password: '1' },
      { username: 'admin', password: 'wrong' }
    ];
    
    for (const cred of testCredentials) {
      try {
        const response = await axios.post(`${baseURL}/api/auth/login`, cred);
        console.log(`✅ ${cred.username}/${cred.password}: SUCCESS`);
        console.log(`   Token received: ${response.data.accessToken ? 'YES' : 'NO'}`);
      } catch (error) {
        console.log(`❌ ${cred.username}/${cred.password}: ${error.response?.status || 'NETWORK_ERROR'}`);
        console.log(`   Error: ${error.response?.data?.message || error.message}`);
      }
    }
    
    // 6. Environment Variables Check
    console.log('\n6️⃣ Environment Variables Check:');
    const requiredEnvVars = ['JWT_SECRET', 'PORT', 'NODE_ENV'];
    requiredEnvVars.forEach(envVar => {
      const value = process.env[envVar];
      console.log(`${envVar}: ${value ? '✅ SET' : '❌ MISSING'}`);
    });
    
    // 7. Database Schema Check
    console.log('\n7️⃣ Database Schema Check:');
    const userTableInfo = await models.sequelize.getQueryInterface().describeTable('users');
    console.log('User table columns:', Object.keys(userTableInfo));
    
    // 8. Rate Limiting Test
    console.log('\n8️⃣ Rate Limiting Test:');
    try {
      const rapidRequests = Array(10).fill().map(() => 
        axios.get(`${baseURL}/api/health`)
      );
      const results = await Promise.allSettled(rapidRequests);
      const failures = results.filter(r => r.status === 'rejected').length;
      console.log(`Rate limiting: ${failures} failures out of 10 requests`);
    } catch (error) {
      console.log('Rate limiting test failed:', error.message);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🔍 Analysis Complete');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await models.sequelize.close();
    process.exit(0);
  }
}

comprehensiveAuthAnalysis();