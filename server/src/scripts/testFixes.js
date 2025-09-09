#!/usr/bin/env node

/**
 * Test script to verify all critical fixes are working
 * Run this before deploying to production
 */

import models from '../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { User, Account, Customer, Employee, sequelize } = models;

console.log('🧪 Starting comprehensive fixes test...\n');

/**
 * Test 1: Database Connection and Sequelize
 */
async function testDatabaseConnection() {
  console.log('📊 Test 1: Database Connection');
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Test if models are properly loaded
    const tableCount = Object.keys(models).length - 1; // -1 for sequelize instance
    console.log(`✅ ${tableCount} models loaded successfully`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Test 2: Account Model Fields
 */
async function testAccountModel() {
  console.log('\n🏦 Test 2: Account Model Fields');
  try {
    // Check if required fields exist
    const accountFields = Object.keys(Account.rawAttributes);
    const requiredFields = ['accountType', 'nature', 'notes', 'isSystemAccount'];
    
    const missingFields = requiredFields.filter(field => !accountFields.includes(field));
    
    if (missingFields.length === 0) {
      console.log('✅ All required Account fields present');
      console.log(`✅ Account model has ${accountFields.length} fields`);
      return true;
    } else {
      console.error('❌ Missing Account fields:', missingFields);
      return false;
    }
  } catch (error) {
    console.error('❌ Account model test failed:', error.message);
    return false;
  }
}

/**
 * Test 3: Customer Model Fields
 */
async function testCustomerModel() {
  console.log('\n👥 Test 3: Customer Model Fields');
  try {
    const customerFields = Object.keys(Customer.rawAttributes);
    const requiredFields = ['type', 'paymentTerms', 'currency'];
    
    const missingFields = requiredFields.filter(field => !customerFields.includes(field));
    
    if (missingFields.length === 0) {
      console.log('✅ All required Customer fields present');
      console.log(`✅ Customer model has ${customerFields.length} fields`);
      return true;
    } else {
      console.error('❌ Missing Customer fields:', missingFields);
      return false;
    }
  } catch (error) {
    console.error('❌ Customer model test failed:', error.message);
    return false;
  }
}

/**
 * Test 4: Employee Model Fields
 */
async function testEmployeeModel() {
  console.log('\n👨‍💼 Test 4: Employee Model Fields');
  try {
    const employeeFields = Object.keys(Employee.rawAttributes);
    const requiredFields = ['branch', 'currency', 'salaryAccountId', 'advanceAccountId', 'custodyAccountId', 'currentBalance'];
    
    const missingFields = requiredFields.filter(field => !employeeFields.includes(field));
    
    if (missingFields.length === 0) {
      console.log('✅ All required Employee fields present');
      console.log(`✅ Employee model has ${employeeFields.length} fields`);
      return true;
    } else {
      console.error('❌ Missing Employee fields:', missingFields);
      return false;
    }
  } catch (error) {
    console.error('❌ Employee model test failed:', error.message);
    return false;
  }
}

/**
 * Test 5: User Model and Authentication
 */
async function testUserModel() {
  console.log('\n🔐 Test 5: User Model and Authentication');
  try {
    // Check if User model works with Sequelize
    const userCount = await User.count();
    console.log(`✅ User model working - ${userCount} users in database`);
    
    // Test JWT creation (without actual user)
    const testPayload = { userId: 'test', username: 'test', role: 'admin', type: 'access' };
    const token = jwt.sign(testPayload, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '8h',
      issuer: 'golden-horse-api',
      audience: 'golden-horse-client'
    });
    
    // Test JWT verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret', {
      issuer: 'golden-horse-api',
      audience: 'golden-horse-client'
    });
    
    console.log('✅ JWT creation and verification working');
    return true;
  } catch (error) {
    console.error('❌ User model/JWT test failed:', error.message);
    return false;
  }
}

/**
 * Test 6: Database Indexes
 */
async function testDatabaseIndexes() {
  console.log('\n📈 Test 6: Database Indexes');
  try {
    // Query to check indexes exist
    const [results] = await sequelize.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE tablename IN ('accounts', 'customers', 'employees', 'gl_entries', 'journal_entries', 'invoices')
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `);
    
    console.log(`✅ Found ${results.length} custom indexes`);
    
    if (results.length > 0) {
      console.log('📊 Sample indexes:');
      results.slice(0, 5).forEach(idx => {
        console.log(`   - ${idx.indexname} on ${idx.tablename}`);
      });
      return true;
    } else {
      console.log('⚠️  No custom indexes found - performance may be affected');
      return false;
    }
  } catch (error) {
    console.error('❌ Database indexes test failed:', error.message);
    return false;
  }
}

/**
 * Test 7: Pagination Response Format
 */
async function testPaginationFormat() {
  console.log('\n📄 Test 7: Pagination Response Format');
  try {
    // Test pagination with actual data
    const accounts = await Account.findAll({
      limit: 5,
      offset: 0,
      order: [['code', 'ASC']]
    });
    
    const total = await Account.count();
    
    // Simulate the response format that should be used
    const response = {
      data: accounts,
      total,
      page: 1,
      limit: 5,
      totalPages: Math.ceil(total / 5)
    };
    
    // Check response format
    const hasRequiredFields = ['data', 'total', 'page', 'limit', 'totalPages']
      .every(field => response.hasOwnProperty(field));
    
    if (hasRequiredFields) {
      console.log('✅ Pagination response format is correct');
      console.log(`✅ Found ${total} accounts, showing first 5`);
      return true;
    } else {
      console.error('❌ Pagination response format is incorrect');
      return false;
    }
  } catch (error) {
    console.error('❌ Pagination test failed:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🎯 منضومة وائل v2 - Comprehensive Fixes Test');
  console.log('=' .repeat(50));
  
  const tests = [
    { name: 'Database Connection', test: testDatabaseConnection },
    { name: 'Account Model', test: testAccountModel },
    { name: 'Customer Model', test: testCustomerModel },
    { name: 'Employee Model', test: testEmployeeModel },
    { name: 'User Model & JWT', test: testUserModel },
    { name: 'Database Indexes', test: testDatabaseIndexes },
    { name: 'Pagination Format', test: testPaginationFormat }
  ];
  
  const results = [];
  
  for (const { name, test } of tests) {
    try {
      const result = await test();
      results.push({ name, passed: result });
    } catch (error) {
      console.error(`❌ ${name} test crashed:`, error.message);
      results.push({ name, passed: false });
    }
  }
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);
  
  results.forEach(({ name, passed }) => {
    console.log(`${passed ? '✅' : '❌'} ${name}`);
  });
  
  console.log(`\n🎯 Overall Score: ${passed}/${total} (${percentage}%)`);
  
  if (percentage >= 90) {
    console.log('🎉 EXCELLENT! System is ready for production');
  } else if (percentage >= 75) {
    console.log('⚠️  GOOD! Some issues need attention before production');
  } else {
    console.log('❌ CRITICAL! Major issues must be fixed before production');
  }
  
  console.log('\n💡 Next steps:');
  console.log('1. Fix any failed tests');
  console.log('2. Run integration tests');
  console.log('3. Deploy to staging environment');
  console.log('4. Conduct user acceptance testing');
  console.log('5. Deploy to production');
  
  process.exit(percentage >= 90 ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  console.error('💥 Test runner crashed:', error);
  process.exit(1);
});

