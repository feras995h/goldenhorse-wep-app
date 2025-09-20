#!/usr/bin/env node

/**
 * Deployment Readiness Check Script
 * Verifies that all requirements are met for production deployment
 */

import { sequelize } from '../models/index.js';
import fs from 'fs-extra';
import path from 'path';

const checkDeployment = async () => {
  console.log('🔍 Golden Horse Shipping System - Deployment Readiness Check');
  console.log('============================================================');
  
  let allChecksPass = true;
  const issues = [];
  
  // Check 1: Environment Variables
  console.log('\n📋 Checking Environment Variables...');
  const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DB_HOST',
    'DB_NAME',
    'DB_USERNAME',
    'DB_PASSWORD'
  ];
  
  const missingEnvVars = [];
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingEnvVars.push(varName);
    }
  });
  
  if (missingEnvVars.length > 0) {
    console.log('❌ Missing environment variables:');
    missingEnvVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    allChecksPass = false;
    issues.push('Missing required environment variables');
  } else {
    console.log('✅ All required environment variables are set');
  }
  
  // Check 2: Database Connection
  console.log('\n🗄️  Checking Database Connection...');
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    const tables = await sequelize.getQueryInterface().showAllTables();
    if (tables.length === 0) {
      console.log('⚠️  Database is empty - migrations need to be run');
      issues.push('Database needs migration');
    } else {
      console.log(`✅ Database has ${tables.length} tables`);
    }
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    allChecksPass = false;
    issues.push('Database connection failed');
  }
  
  // Check 3: Required Directories
  console.log('\n📁 Checking Required Directories...');
  const requiredDirs = [
    './uploads',
    './logs',
    './backups',
    './archives'
  ];
  
  for (const dir of requiredDirs) {
    const fullPath = path.resolve(dir);
    if (await fs.pathExists(fullPath)) {
      console.log(`✅ Directory exists: ${dir}`);
    } else {
      console.log(`⚠️  Directory missing: ${dir} (will be created)`);
      try {
        await fs.ensureDir(fullPath);
        console.log(`✅ Created directory: ${dir}`);
      } catch (error) {
        console.log(`❌ Failed to create directory: ${dir}`);
        allChecksPass = false;
        issues.push(`Cannot create directory: ${dir}`);
      }
    }
  }
  
  // Check 4: Client Build
  console.log('\n🏗️  Checking Client Build...');
  const clientDistPath = path.resolve('../client/dist');
  if (await fs.pathExists(clientDistPath)) {
    const indexPath = path.join(clientDistPath, 'index.html');
    if (await fs.pathExists(indexPath)) {
      console.log('✅ Client build exists');
    } else {
      console.log('❌ Client build incomplete - index.html missing');
      allChecksPass = false;
      issues.push('Client build incomplete');
    }
  } else {
    console.log('❌ Client build not found - run "npm run build" in client directory');
    allChecksPass = false;
    issues.push('Client build missing');
  }
  
  // Check 5: Security Configuration
  console.log('\n🔐 Checking Security Configuration...');
  
  // Check JWT secrets strength
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length >= 32) {
    console.log('✅ JWT secret is strong');
  } else {
    console.log('⚠️  JWT secret should be at least 32 characters');
    issues.push('Weak JWT secret');
  }
  
  // Check if in production mode
  if (process.env.NODE_ENV === 'production') {
    console.log('✅ Running in production mode');
  } else {
    console.log('⚠️  Not running in production mode');
    issues.push('Not in production mode');
  }
  
  // Check 6: Dependencies
  console.log('\n📦 Checking Dependencies...');
  try {
    const packageJson = await fs.readJson('./package.json');
    console.log(`✅ Server package.json loaded (${Object.keys(packageJson.dependencies || {}).length} dependencies)`);
    
    const clientPackageJson = await fs.readJson('../client/package.json');
    console.log(`✅ Client package.json loaded (${Object.keys(clientPackageJson.dependencies || {}).length} dependencies)`);
  } catch (error) {
    console.log('❌ Error reading package.json files');
    allChecksPass = false;
    issues.push('Package.json files not accessible');
  }
  
  // Final Summary
  console.log('\n📊 Deployment Readiness Summary');
  console.log('================================');
  
  if (allChecksPass && issues.length === 0) {
    console.log('🎉 All checks passed! System is ready for deployment.');
    console.log('\nNext steps:');
    console.log('1. Run database migrations: npm run db:migrate');
    console.log('2. Seed basic data: npm run seed-basic-data');
    console.log('3. Start the application: npm start');
  } else {
    console.log('⚠️  Some issues need attention before deployment:');
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
    
    console.log('\nRecommended actions:');
    if (issues.includes('Missing required environment variables')) {
      console.log('- Set all required environment variables');
    }
    if (issues.includes('Database connection failed')) {
      console.log('- Check database credentials and connectivity');
    }
    if (issues.includes('Database needs migration')) {
      console.log('- Run: npm run db:migrate');
    }
    if (issues.includes('Client build missing')) {
      console.log('- Run: cd ../client && npm run build');
    }
  }
  
  // Close database connection
  await sequelize.close();
  
  // Exit with appropriate code
  process.exit(allChecksPass ? 0 : 1);
};

// Run the check
checkDeployment().catch(error => {
  console.error('❌ Deployment check failed:', error);
  process.exit(1);
});
