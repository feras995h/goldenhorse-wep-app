#!/usr/bin/env node

/**
 * إصلاح بسيط لقاعدة البيانات
 */

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Create simple SQLite connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database/development.sqlite',
  logging: console.log
});

async function fixDatabase() {
  try {
    console.log('🔧 بدء إصلاح قاعدة البيانات...');
    
    // Test connection
    console.log('🔍 اختبار الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // Test a simple query
    console.log('🧪 اختبار استعلام بسيط...');
    const [results] = await sequelize.query("SELECT datetime('now') as current_time");
    console.log('⏰ الوقت الحالي:', results[0].current_time);
    
    console.log('🎉 قاعدة البيانات تعمل بشكل صحيح!');
    
  } catch (error) {
    console.error('❌ خطأ في قاعدة البيانات:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔒 تم إغلاق الاتصال بقاعدة البيانات');
  }
}

// Run the fix
fixDatabase();
