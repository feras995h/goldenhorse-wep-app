/**
 * Final Database Setup - Direct SQL Execution
 */

import pg from 'pg';
import fs from 'fs';
const { Client } = pg;

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function finalSetup() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: false });

  try {
    console.log('\n🔗 الاتصال بقاعدة البيانات...');
    await client.connect();
    console.log('✅ متصل بنجاح!\n');

    // قراءة وتنفيذ run-sql.sql
    console.log('📄 قراءة ملف run-sql.sql...');
    const sql = fs.readFileSync('run-sql.sql', 'utf8');
    
    // تنظيف SQL من التعليقات والأوامر الخاصة بـ psql
    const cleanSql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && !line.trim().startsWith('\\echo'))
      .join('\n');

    console.log('⚙️  تنفيذ السكريبت...\n');

    // تنفيذ SQL
    await client.query(cleanSql);

    console.log('✅ تم التنفيذ بنجاح!\n');

    // التحقق من النتائج
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 الحسابات المنشأة:\n');

    const accounts = await client.query(`
      SELECT code, name, type, "isGroup", balance
      FROM accounts 
      WHERE code IN ('4101', '1201', '2301', '4102', '4103', '4104', '4105')
      ORDER BY code
    `);

    console.table(accounts.rows);

    console.log('\n✅ AccountMapping:\n');

    const mapping = await client.query(`
      SELECT 
        am."isActive",
        sr.code as sales_code,
        sr.name as sales_name,
        ar.code as ar_code,
        ar.name as ar_name,
        tax.code as tax_code,
        tax.name as tax_name
      FROM account_mappings am
      LEFT JOIN accounts sr ON am."salesRevenueAccount" = sr.id
      LEFT JOIN accounts ar ON am."accountsReceivableAccount" = ar.id
      LEFT JOIN accounts tax ON am."salesTaxAccount" = tax.id
      WHERE am."isActive" = true
    `);

    console.table(mapping.rows);

    if (accounts.rows.length === 7 && mapping.rows.length === 1) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 نجح! قاعدة البيانات جاهزة');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('🚀 الخطوة التالية:');
      console.log('   npm run dev\n');
      console.log('✅ سيتم تهيئة النظام المحاسبي تلقائياً عند بدء السيرفر\n');
    } else {
      console.log('\n⚠️  تحذير: بعض البيانات قد تكون مفقودة');
      console.log(`   الحسابات: ${accounts.rows.length}/7`);
      console.log(`   AccountMapping: ${mapping.rows.length}/1\n`);
    }

  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    console.error('\nالتفاصيل:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 تم إغلاق الاتصال\n');
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🚀 Golden Horse - Final Database Setup');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

finalSetup();
