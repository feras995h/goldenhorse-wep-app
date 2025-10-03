/**
 * فحص بنية جداول الفواتير في قاعدة البيانات
 */

import pg from 'pg';
import { readFileSync } from 'fs';

// قراءة DATABASE_URL من .env
const envContent = readFileSync('./server/.env', 'utf-8');
const dbUrl = envContent.split('\n').find(line => line.startsWith('DATABASE_URL='))?.split('=')[1]?.trim();

const { Client } = pg;

async function checkInvoiceTables() {
  const client = new Client({
    connectionString: dbUrl
  });

  try {
    await client.connect();
    console.log('✅ متصل بقاعدة البيانات\n');

    // فحص جدول sales_invoices
    console.log('📊 جدول sales_invoices:');
    console.log('='.repeat(80));
    const salesInvoicesColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sales_invoices'
      ORDER BY ordinal_position;
    `);
    
    salesInvoicesColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name.padEnd(30)} | ${col.data_type.padEnd(20)} | ${col.is_nullable}`);
    });

    // فحص جدول shipping_invoices
    console.log('\n📊 جدول shipping_invoices:');
    console.log('='.repeat(80));
    const shippingInvoicesColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'shipping_invoices'
      ORDER BY ordinal_position;
    `);
    
    shippingInvoicesColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name.padEnd(30)} | ${col.data_type.padEnd(20)} | ${col.is_nullable}`);
    });

    // فحص جدول sales_invoice_items
    console.log('\n📊 جدول sales_invoice_items:');
    console.log('='.repeat(80));
    const salesInvoiceItemsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sales_invoice_items'
      ORDER BY ordinal_position;
    `);
    
    salesInvoiceItemsColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name.padEnd(30)} | ${col.data_type.padEnd(20)} | ${col.is_nullable}`);
    });

    console.log('\n✅ تم الفحص بنجاح!');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await client.end();
  }
}

checkInvoiceTables();
