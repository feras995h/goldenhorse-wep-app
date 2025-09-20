#!/usr/bin/env node

/**
 * إصلاح قاعدة البيانات وإعادة إنشائها
 * Fix Database and Recreate Script
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models after environment is loaded
const modelsModule = await import('./src/models/index.js');
const { sequelize } = modelsModule;

async function fixDatabase() {
  try {
    console.log('🔧 بدء إصلاح قاعدة البيانات...');
    
    // Test connection
    console.log('🔍 اختبار الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // Force sync - this will drop and recreate all tables
    console.log('🏗️  إعادة إنشاء جداول قاعدة البيانات...');
    await sequelize.sync({ force: true });
    console.log('✅ تم إنشاء جداول قاعدة البيانات بنجاح');
    
    // Verify tables were created
    console.log('🔍 التحقق من إنشاء الجداول...');
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 الجداول المنشأة:', tables);
    
    // Test a simple query
    console.log('🧪 اختبار استعلام بسيط...');
    const [results] = await sequelize.query("SELECT datetime('now') as current_time");
    console.log('⏰ الوقت الحالي:', results[0].current_time);
    
    console.log('🎉 تم إصلاح قاعدة البيانات بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح قاعدة البيانات:', error.message);
    console.error('📋 تفاصيل الخطأ:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔒 تم إغلاق الاتصال بقاعدة البيانات');
  }
}

// Run the fix
fixDatabase();
