#!/usr/bin/env node

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: false
  }
});

async function checkBalances() {
  try {
    await sequelize.authenticate();
    
    const [accounts] = await sequelize.query(`
      SELECT code, name, type, balance 
      FROM accounts 
      WHERE "isActive" = true AND ABS(balance) > 0.01 
      ORDER BY code
    `);
    
    console.log('الحسابات ذات الأرصدة:');
    console.log(JSON.stringify(accounts, null, 2));
    
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let totalRevenue = 0;
    let totalExpense = 0;
    
    accounts.forEach(acc => {
      const balance = parseFloat(acc.balance);
      switch(acc.type) {
        case 'asset':
          totalAssets += balance;
          break;
        case 'liability':
          totalLiabilities += balance;
          break;
        case 'equity':
          totalEquity += balance;
          break;
        case 'revenue':
          totalRevenue += balance;
          break;
        case 'expense':
          totalExpense += balance;
          break;
      }
    });
    
    console.log('\nملخص الأرصدة:');
    console.log(`الأصول: ${totalAssets}`);
    console.log(`الخصوم: ${totalLiabilities}`);
    console.log(`حقوق الملكية: ${totalEquity}`);
    console.log(`الإيرادات: ${totalRevenue}`);
    console.log(`المصروفات: ${totalExpense}`);
    
    const totalDebit = totalAssets + totalExpense;
    const totalCredit = totalLiabilities + totalEquity + totalRevenue;
    
    console.log(`\nإجمالي المدين: ${totalDebit}`);
    console.log(`إجمالي الدائن: ${totalCredit}`);
    console.log(`الفرق: ${totalDebit - totalCredit}`);
    
  } catch (error) {
    console.error('خطأ:', error);
  } finally {
    await sequelize.close();
  }
}

checkBalances();
