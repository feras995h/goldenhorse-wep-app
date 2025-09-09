const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
const config = require('./src/config/database.cjs');
const axios = require('axios');

async function rootCauseAnalysis() {
  console.log('🔍 ROOT CAUSE ANALYSIS - Authentication Issues');
  console.log('=' .repeat(60));
  
  const env = process.env.NODE_ENV || 'development';
  const dbConfig = config[env];
  
  const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: false,
      pool: dbConfig.pool,
      dialectOptions: dbConfig.dialectOptions
    }
  );
  
  try {
    // 1. Database Connection
    console.log('\n📊 1. DATABASE ANALYSIS');
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Get actual user data
    const [users] = await sequelize.query('SELECT id, username, password, role, "isActive", name FROM users');
    console.log(`📋 Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`   ${user.username} (ID: ${user.id}): role=${user.role}, active=${user.isActive}`);
    });
    
    // 2. Password Validation Analysis
    console.log('\n🔐 2. PASSWORD VALIDATION ANALYSIS');
    const testPasswords = ['1', 'admin123', 'password', '123456'];
    
    for (const user of users) {
      console.log(`\n   User: ${user.username}`);
      for (const testPass of testPasswords) {
        const isValid = await bcrypt.compare(testPass, user.password);
        console.log(`   '${testPass}': ${isValid ? '🟢 VALID' : '🔴 INVALID'}`);
      }
    }
    
    // 3. Network Connectivity Test
    console.log('\n🌐 3. NETWORK CONNECTIVITY TEST');
    const baseURL = 'http://localhost:5003';
    
    try {
      const healthResponse = await axios.get(`${baseURL}/api/health`, { timeout: 5000 });
      console.log('✅ Health endpoint reachable');
    } catch (error) {
      console.log('❌ Health endpoint unreachable:', error.code || error.message);
    }
    
    // 4. Authentication Endpoint Test
    console.log('\n🔑 4. AUTHENTICATION ENDPOINT TEST');
    
    const testCases = [
      { username: 'admin', password: 'admin123', expected: users.find(u => u.username === 'admin')?.isActive ? 'SUCCESS' : 'USER_INACTIVE' },
      { username: 'user', password: '1', expected: users.find(u => u.username === 'user')?.isActive ? 'SUCCESS' : 'USER_INACTIVE' },
      { username: 'admin', password: 'wrong', expected: 'INVALID_PASSWORD' },
      { username: 'nonexistent', password: 'anything', expected: 'USER_NOT_FOUND' }
    ];
    
    for (const testCase of testCases) {
      try {
        const response = await axios.post(`${baseURL}/api/auth/login`, testCase, { timeout: 5000 });
        console.log(`   ✅ ${testCase.username}/${testCase.password}: SUCCESS (Status: ${response.status})`);
      } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;
        console.log(`   ❌ ${testCase.username}/${testCase.password}: ${status === 401 ? 'UNAUTHORIZED' : status === 404 ? 'NOT_FOUND' : 'NETWORK_ERROR'}`);
        console.log(`      Message: ${message}`);
      }
    }
    
    // 5. Environment Variables Check
    console.log('\n⚙️  5. ENVIRONMENT CONFIGURATION');
    const envVars = {
      PORT: process.env.PORT || '5003',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
      NODE_ENV: process.env.NODE_ENV || 'development',
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'USING_CONFIG'
    };
    
    Object.entries(envVars).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    // 6. Database Schema Verification
    console.log('\n📋 6. DATABASE SCHEMA VERIFICATION');
    try {
      const [columns] = await sequelize.query('SELECT column_name FROM information_schema.columns WHERE table_name = \'users\'');
      const requiredColumns = ['id', 'username', 'password', 'role', 'isActive'];
      const actualColumns = columns.map(col => col.Field);
      
      console.log(`   Required columns: ${requiredColumns.join(', ')}`);
      console.log(`   Actual columns: ${actualColumns.join(', ')}`);
      
      const missingColumns = requiredColumns.filter(col => !actualColumns.includes(col));
      if (missingColumns.length > 0) {
        console.log(`   ❌ Missing columns: ${missingColumns.join(', ')}`);
      } else {
        console.log('   ✅ All required columns present');
      }
    } catch (error) {
      console.log('   ❌ Schema verification failed:', error.message);
    }
    
    // 7. CORS and Headers Test
    console.log('\n🔗 7. CORS AND HEADERS TEST');
    try {
      const response = await axios.options(`${baseURL}/api/auth/login`, { timeout: 5000 });
      console.log('   ✅ CORS preflight successful');
      console.log(`   Access-Control-Allow-Origin: ${response.headers['access-control-allow-origin'] || 'NOT_SET'}`);
    } catch (error) {
      console.log('   ⚠️  CORS test failed:', error.message);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('🔍 ANALYSIS COMPLETE - Check results above for root causes');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

rootCauseAnalysis();