#!/usr/bin/env node

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden_horse_dev';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: false
  }
});

async function checkAccounts() {
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    const [accounts] = await sequelize.query(`
      SELECT id, code, name, type, "isGroup", "isActive", level
      FROM accounts 
      ORDER BY type, level, code
    `);

    console.log('\n📊 الحسابات الموجودة:');
    console.log('='.repeat(80));
    
    const groupedAccounts = accounts.reduce((acc, account) => {
      acc[account.type] = acc[account.type] || [];
      acc[account.type].push(account);
      return acc;
    }, {});

    Object.entries(groupedAccounts).forEach(([type, typeAccounts]) => {
      console.log(`\n🏷️  ${type.toUpperCase()}:`);
      typeAccounts.forEach(account => {
        const status = account.isActive ? '✅' : '❌';
        const group = account.isGroup ? '[مجموعة]' : '[حساب]';
        console.log(`  ${status} ${group} ${account.code} - ${account.name} (Level ${account.level})`);
      });
    });

    return accounts;

  } catch (error) {
    console.error('❌ خطأ في فحص الحسابات:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

checkAccounts()
  .then(() => {
    console.log('\n✅ انتهى فحص الحسابات');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ فشل فحص الحسابات:', error);
    process.exit(1);
  });
