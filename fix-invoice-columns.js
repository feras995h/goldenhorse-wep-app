/**
 * إصلاح أسماء أعمدة جداول الفواتير لتتوافق مع snake_case
 */

import pg from 'pg';
import { readFileSync } from 'fs';

// قراءة DATABASE_URL من .env
const envContent = readFileSync('./server/.env', 'utf-8');
const dbUrl = envContent.split('\n').find(line => line.startsWith('DATABASE_URL='))?.split('=')[1]?.trim();

const { Client } = pg;

async function fixInvoiceColumns() {
  const client = new Client({
    connectionString: dbUrl
  });

  try {
    await client.connect();
    console.log('✅ متصل بقاعدة البيانات\n');

    // التحقق من الأعمدة الموجودة أولاً
    console.log('🔍 فحص الأعمدة الموجودة...\n');
    
    const salesInvoicesCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'sales_invoices'
      AND column_name IN ('customerId', 'customer_id', 'outstandingAmount', 'outstanding_amount', 'outstandingamount');
    `);
    
    console.log('📊 sales_invoices:', salesInvoicesCheck.rows.map(r => r.column_name).join(', '));
    
    const shippingInvoicesCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'shipping_invoices'
      AND column_name IN ('customerId', 'customer_id', 'shipmentId', 'shipment_id', 'outstandingAmount', 'outstanding_amount', 'outstandingamount');
    `);
    
    console.log('📊 shipping_invoices:', shippingInvoicesCheck.rows.map(r => r.column_name).join(', '));
    
    console.log('\n🔧 بدء الإصلاح...\n');

    // إصلاح sales_invoices
    console.log('1️⃣ إصلاح جدول sales_invoices...');
    
    // تحويل customerId إلى customer_id إذا لزم الأمر
    const hasCustomerIdCamel = salesInvoicesCheck.rows.some(r => r.column_name === 'customerId');
    const hasCustomerIdSnake = salesInvoicesCheck.rows.some(r => r.column_name === 'customer_id');
    
    if (hasCustomerIdCamel && !hasCustomerIdSnake) {
      await client.query('ALTER TABLE sales_invoices RENAME COLUMN "customerId" TO customer_id;');
      console.log('   ✅ تم تحويل customerId → customer_id');
    } else if (hasCustomerIdSnake) {
      console.log('   ℹ️  customer_id موجود بالفعل');
    }
    
    // تحويل outstandingAmount إلى outstanding_amount
    const hasOutstandingCamel = salesInvoicesCheck.rows.some(r => r.column_name === 'outstandingAmount');
    const hasOutstandingSnake = salesInvoicesCheck.rows.some(r => r.column_name === 'outstanding_amount');
    const hasOutstandingLower = salesInvoicesCheck.rows.some(r => r.column_name === 'outstandingamount');
    
    if (hasOutstandingLower && !hasOutstandingSnake) {
      await client.query('ALTER TABLE sales_invoices RENAME COLUMN outstandingamount TO outstanding_amount;');
      console.log('   ✅ تم تحويل outstandingamount → outstanding_amount');
    } else if (hasOutstandingCamel && !hasOutstandingSnake) {
      await client.query('ALTER TABLE sales_invoices RENAME COLUMN "outstandingAmount" TO outstanding_amount;');
      console.log('   ✅ تم تحويل outstandingAmount → outstanding_amount');
    } else if (hasOutstandingSnake) {
      console.log('   ℹ️  outstanding_amount موجود بالفعل');
    }

    // إصلاح shipping_invoices
    console.log('\n2️⃣ إصلاح جدول shipping_invoices...');
    
    const hasShipCustomerIdCamel = shippingInvoicesCheck.rows.some(r => r.column_name === 'customerId');
    const hasShipCustomerIdSnake = shippingInvoicesCheck.rows.some(r => r.column_name === 'customer_id');
    
    if (hasShipCustomerIdCamel && !hasShipCustomerIdSnake) {
      await client.query('ALTER TABLE shipping_invoices RENAME COLUMN "customerId" TO customer_id;');
      console.log('   ✅ تم تحويل customerId → customer_id');
    } else if (hasShipCustomerIdSnake) {
      console.log('   ℹ️  customer_id موجود بالفعل');
    }
    
    const hasShipmentIdCamel = shippingInvoicesCheck.rows.some(r => r.column_name === 'shipmentId');
    const hasShipmentIdSnake = shippingInvoicesCheck.rows.some(r => r.column_name === 'shipment_id');
    
    if (hasShipmentIdCamel && !hasShipmentIdSnake) {
      await client.query('ALTER TABLE shipping_invoices RENAME COLUMN "shipmentId" TO shipment_id;');
      console.log('   ✅ تم تحويل shipmentId → shipment_id');
    } else if (hasShipmentIdSnake) {
      console.log('   ℹ️  shipment_id موجود بالفعل');
    }
    
    const hasShipOutstandingCamel = shippingInvoicesCheck.rows.some(r => r.column_name === 'outstandingAmount');
    const hasShipOutstandingSnake = shippingInvoicesCheck.rows.some(r => r.column_name === 'outstanding_amount');
    const hasShipOutstandingLower = shippingInvoicesCheck.rows.some(r => r.column_name === 'outstandingamount');
    
    if (hasShipOutstandingLower && !hasShipOutstandingSnake) {
      await client.query('ALTER TABLE shipping_invoices RENAME COLUMN outstandingamount TO outstanding_amount;');
      console.log('   ✅ تم تحويل outstandingamount → outstanding_amount');
    } else if (hasShipOutstandingCamel && !hasShipOutstandingSnake) {
      await client.query('ALTER TABLE shipping_invoices RENAME COLUMN "outstandingAmount" TO outstanding_amount;');
      console.log('   ✅ تم تحويل outstandingAmount → outstanding_amount');
    } else if (hasShipOutstandingSnake) {
      console.log('   ℹ️  outstanding_amount موجود بالفعل');
    }

    console.log('\n✅ تم الإصلاح بنجاح!');
    console.log('\n💡 الآن أعد تشغيل السيرفر: npm run dev');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

fixInvoiceColumns();
