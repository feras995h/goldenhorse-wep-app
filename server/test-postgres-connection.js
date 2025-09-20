#!/usr/bin/env node

/**
 * Test PostgreSQL Connection Script
 * Tests the connection to your PostgreSQL database
 */

import { Sequelize } from 'sequelize';

const postgresUrl = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

console.log('🔍 Testing PostgreSQL Connection');
console.log('================================');

async function testConnection() {
  let sequelize;
  
  try {
    console.log('📡 Connecting to PostgreSQL...');
    console.log('   Host: 72.60.92.146');
    console.log('   Port: 5432');
    console.log('   Database: postgres');
    
    sequelize = new Sequelize(postgresUrl, {
      dialect: 'postgres',
      logging: console.log, // Enable SQL logging
      dialectOptions: {
        ssl: false // Disable SSL for this connection
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });

    // Test authentication
    await sequelize.authenticate();
    console.log('✅ Authentication successful!');

    // Test basic query
    console.log('📊 Testing basic query...');
    const [results] = await sequelize.query('SELECT version() as version');
    console.log('✅ Query successful!');
    console.log('📋 PostgreSQL version:', results[0].version);

    // Test table existence
    console.log('🔍 Checking for existing tables...');
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`📊 Found ${tables.length} tables in the database:`);
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    console.log('\n✅ PostgreSQL connection test completed successfully!');
    console.log('🚀 Your database is ready for the application.');

  } catch (error) {
    console.error('\n❌ PostgreSQL connection failed!');
    console.error('Error details:', error.message);
    
    if (error.name === 'SequelizeConnectionError') {
      console.error('\n🔧 Connection troubleshooting:');
      console.error('   - Check if PostgreSQL server is running');
      console.error('   - Verify host and port are correct');
      console.error('   - Check firewall settings');
      console.error('   - Verify SSL configuration');
    } else if (error.name === 'SequelizeAuthenticationError') {
      console.error('\n🔧 Authentication troubleshooting:');
      console.error('   - Check username and password');
      console.error('   - Verify user has access to the database');
    } else if (error.name === 'SequelizeDatabaseError') {
      console.error('\n🔧 Database troubleshooting:');
      console.error('   - Check if database exists');
      console.error('   - Verify database permissions');
    }
    
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('🔌 Connection closed.');
    }
  }
}

// Set environment to production
process.env.NODE_ENV = 'production';

testConnection();
