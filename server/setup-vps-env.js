#!/usr/bin/env node

/**
 * VPS Environment Setup Script
 * This script helps configure the correct environment variables for PostgreSQL on VPS
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 VPS Environment Setup for PostgreSQL');
console.log('=====================================');

// PostgreSQL connection details
const postgresUrl = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

// Environment variables for production
const envContent = `# Production Environment Variables
NODE_ENV=production
DATABASE_URL=${postgresUrl}
DB_DIALECT=postgres
DB_HOST=72.60.92.146
DB_PORT=5432
DB_NAME=postgres
DB_USERNAME=postgres
DB_PASSWORD=XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP
DB_SSL=true

# Server Configuration
PORT=3000
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRES_IN=24h

# Logging
LOG_LEVEL=info
`;

// Write .env file
const envPath = path.join(__dirname, '.env');
try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully');
  console.log('📁 Location:', envPath);
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  process.exit(1);
}

// Test database connection
console.log('\n🔍 Testing PostgreSQL connection...');

const { Sequelize } = require('sequelize');

async function testConnection() {
  try {
    const sequelize = new Sequelize(postgresUrl, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    });

    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection successful!');
    
    // Test basic query
    const result = await sequelize.query('SELECT version() as version');
    console.log('📊 PostgreSQL version:', result[0][0].version);
    
    await sequelize.close();
    console.log('✅ Connection closed successfully');
    
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    console.error('🔧 Please check:');
    console.error('   - Database server is running');
    console.error('   - Connection details are correct');
    console.error('   - Network access is allowed');
    console.error('   - SSL configuration is correct');
    process.exit(1);
  }
}

testConnection();

console.log('\n📋 Next steps:');
console.log('1. Restart your application on VPS');
console.log('2. Check application logs for any remaining errors');
console.log('3. Test the API endpoints that were failing');




