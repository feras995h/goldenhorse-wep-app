#!/usr/bin/env node

/**
 * Simple database connection test script
 */

import DatabaseInitializer from './src/utils/databaseInit.js';

console.log('🔍 Testing database connection...');
console.log('=' .repeat(50));

async function testConnection() {
  try {
    // Test basic connection
    const connectionResult = await DatabaseInitializer.testConnection();
    
    if (connectionResult.success) {
      console.log('\n✅ Database connection test: PASSED');
      
      // Test health status
      const healthStatus = await DatabaseInitializer.getHealthStatus();
      console.log('\n📊 Database Health Status:');
      console.log(`   Status: ${healthStatus.status}`);
      console.log(`   Response Time: ${healthStatus.responseTime || 'N/A'}`);
      console.log(`   Timestamp: ${healthStatus.timestamp}`);
      
      if (healthStatus.pool) {
        console.log('\n🏊 Connection Pool Status:');
        console.log(`   Pool Size: ${healthStatus.pool.size}`);
        console.log(`   Available: ${healthStatus.pool.available}`);
        console.log(`   In Use: ${healthStatus.pool.using}`);
        console.log(`   Waiting: ${healthStatus.pool.waiting}`);
      }
      
    } else {
      console.log('\n❌ Database connection test: FAILED');
      console.log(`   Error: ${connectionResult.error}`);
      console.log(`   Code: ${connectionResult.code || 'UNKNOWN'}`);
    }
    
  } catch (error) {
    console.error('\n💥 Test script error:', error.message);
  }
}

testConnection();
