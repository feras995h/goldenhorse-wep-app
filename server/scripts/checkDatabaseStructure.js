#!/usr/bin/env node

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: false }
});

async function checkDatabaseStructure() {
  console.log('🔍 فحص هيكل قاعدة البيانات...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // 1. فحص الجداول الموجودة
    console.log('\n📋 الجداول الموجودة:');
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    tables.forEach(table => {
      console.log(`   ✅ ${table.table_name}`);
    });

    // 2. فحص جدول customers
    console.log('\n👥 جدول customers:');
    try {
      const [customersColumns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        ORDER BY ordinal_position
      `);
      
      if (customersColumns.length > 0) {
        console.log('   الأعمدة:');
        customersColumns.forEach(col => {
          console.log(`     ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(مطلوب)' : '(اختياري)'}`);
        });
      } else {
        console.log('   ❌ جدول customers غير موجود');
      }
    } catch (error) {
      console.log(`   ❌ خطأ في فحص جدول customers: ${error.message}`);
    }

    // 3. فحص جدول accounts
    console.log('\n📊 جدول accounts:');
    try {
      const [accountsColumns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'accounts' 
        ORDER BY ordinal_position
      `);
      
      if (accountsColumns.length > 0) {
        console.log('   الأعمدة:');
        accountsColumns.forEach(col => {
          console.log(`     ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(مطلوب)' : '(اختياري)'}`);
        });
      } else {
        console.log('   ❌ جدول accounts غير موجود');
      }
    } catch (error) {
      console.log(`   ❌ خطأ في فحص جدول accounts: ${error.message}`);
    }

    // 4. فحص جدول fixed_assets
    console.log('\n🏢 جدول fixed_assets:');
    try {
      const [fixedAssetsColumns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'fixed_assets'
        ORDER BY ordinal_position
      `);

      if (fixedAssetsColumns.length > 0) {
        console.log('   الأعمدة:');
        fixedAssetsColumns.forEach(col => {
          console.log(`     ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(مطلوب)' : '(اختياري)'}`);
        });
      } else {
        console.log('   ❌ جدول fixed_assets غير موجود');
      }
    } catch (error) {
      console.log(`   ❌ خطأ في فحص جدول fixed_assets: ${error.message}`);
    }

    // 4.5. فحص جدول depreciation_schedules
    console.log('\n📉 جدول depreciation_schedules:');
    try {
      const [depreciationColumns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'depreciation_schedules'
        ORDER BY ordinal_position
      `);

      if (depreciationColumns.length > 0) {
        console.log('   الأعمدة:');
        depreciationColumns.forEach(col => {
          console.log(`     ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(مطلوب)' : '(اختياري)'}`);
        });
      } else {
        console.log('   ❌ جدول depreciation_schedules غير موجود');
      }
    } catch (error) {
      console.log(`   ❌ خطأ في فحص جدول depreciation_schedules: ${error.message}`);
    }

    // 5. فحص جدول journal_entries
    console.log('\n📝 جدول journal_entries:');
    try {
      const [journalColumns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'journal_entries' 
        ORDER BY ordinal_position
      `);
      
      if (journalColumns.length > 0) {
        console.log('   الأعمدة:');
        journalColumns.forEach(col => {
          console.log(`     ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(مطلوب)' : '(اختياري)'}`);
        });
      } else {
        console.log('   ❌ جدول journal_entries غير موجود');
      }
    } catch (error) {
      console.log(`   ❌ خطأ في فحص جدول journal_entries: ${error.message}`);
    }

    // 6. فحص العلاقات الخارجية
    console.log('\n🔗 العلاقات الخارجية:');
    try {
      const [foreignKeys] = await sequelize.query(`
        SELECT 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        ORDER BY tc.table_name, kcu.column_name
      `);
      
      if (foreignKeys.length > 0) {
        foreignKeys.forEach(fk => {
          console.log(`   ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
      } else {
        console.log('   ⚠️ لا توجد علاقات خارجية محددة');
      }
    } catch (error) {
      console.log(`   ❌ خطأ في فحص العلاقات: ${error.message}`);
    }

    // 7. فحص البيانات الأساسية
    console.log('\n📊 البيانات الأساسية:');
    
    // عدد الحسابات
    try {
      const [accountCount] = await sequelize.query('SELECT COUNT(*) as count FROM accounts');
      console.log(`   الحسابات: ${accountCount[0].count}`);
    } catch (error) {
      console.log(`   ❌ خطأ في عد الحسابات: ${error.message}`);
    }
    
    // عدد العملاء
    try {
      const [customerCount] = await sequelize.query('SELECT COUNT(*) as count FROM customers');
      console.log(`   العملاء: ${customerCount[0].count}`);
    } catch (error) {
      console.log(`   ❌ خطأ في عد العملاء: ${error.message}`);
    }
    
    // عدد القيود
    try {
      const [journalCount] = await sequelize.query('SELECT COUNT(*) as count FROM journal_entries');
      console.log(`   القيود: ${journalCount[0].count}`);
    } catch (error) {
      console.log(`   ❌ خطأ في عد القيود: ${error.message}`);
    }

    console.log('\n✅ انتهى فحص هيكل قاعدة البيانات');

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkDatabaseStructure();
