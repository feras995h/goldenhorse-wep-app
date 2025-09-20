#!/usr/bin/env node

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: false }
});

async function checkEnums() {
  console.log('🔍 فحص قيم Enum والحسابات الموجودة...');
  
  try {
    await sequelize.authenticate();
    
    // فحص enum values للحسابات
    const [enums] = await sequelize.query(`
      SELECT 
        t.typname as enum_name,
        e.enumlabel as enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname LIKE '%accounts%'
      ORDER BY t.typname, e.enumsortorder
    `);
    
    console.log('📋 قيم Enum للحسابات:');
    const enumGroups = {};
    enums.forEach(e => {
      if (!enumGroups[e.enum_name]) enumGroups[e.enum_name] = [];
      enumGroups[e.enum_name].push(e.enum_value);
    });
    
    Object.keys(enumGroups).forEach(enumName => {
      console.log(`\n${enumName}:`);
      enumGroups[enumName].forEach(value => {
        console.log(`   - ${value}`);
      });
    });
    
    // فحص الحسابات الموجودة
    const [accounts] = await sequelize.query(`
      SELECT code, name, type, "rootType", "accountType", nature, level, "isGroup"
      FROM accounts 
      WHERE level <= 2
      ORDER BY code
    `);
    
    console.log('\n📊 الحسابات الرئيسية الموجودة:');
    accounts.forEach(acc => {
      console.log(`   ${acc.code}: ${acc.name}`);
      console.log(`      type: ${acc.type}, rootType: ${acc.rootType}`);
      console.log(`      accountType: ${acc.accountType}, nature: ${acc.nature}`);
      console.log(`      level: ${acc.level}, isGroup: ${acc.isGroup}`);
      console.log('');
    });
    
    // فحص الحسابات المطلوبة للأصول الثابتة
    console.log('\n🏢 البحث عن حسابات الأصول الثابتة:');
    const [fixedAssetAccounts] = await sequelize.query(`
      SELECT code, name, type, "rootType"
      FROM accounts 
      WHERE code LIKE '1.1%' OR name LIKE '%أصول%' OR name LIKE '%ثابت%'
      ORDER BY code
    `);
    
    if (fixedAssetAccounts.length > 0) {
      fixedAssetAccounts.forEach(acc => {
        console.log(`   ${acc.code}: ${acc.name} (${acc.type}/${acc.rootType})`);
      });
    } else {
      console.log('   ❌ لا توجد حسابات أصول ثابتة');
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkEnums();
