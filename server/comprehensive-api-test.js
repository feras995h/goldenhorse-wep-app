import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

async function testAllEndpoints() {
  try {
    await sequelize.authenticate();
    console.log('✅ متصل بقاعدة البيانات\n');

    console.log('🧪 اختبار جميع Endpoints المشكلة:\n');
    console.log('='.repeat(80));

    // Test 1: Payment Vouchers
    console.log('\n1️⃣ اختبار /api/financial/vouchers/payments:');
    try {
      const [payments] = await sequelize.query(`
        SELECT 
          id, "voucherNumber", date, amount, status
        FROM payment_vouchers
        ORDER BY date DESC
        LIMIT 5
      `);
      console.log(`   ✅ الاستعلام نجح - وجد ${payments.length} سندات`);
      if (payments.length > 0) {
        console.log('   📊 مثال:', payments[0]);
      }
    } catch (err) {
      console.log('   ❌ فشل:', err.message);
    }

    // Test 2: Receipt Vouchers
    console.log('\n2️⃣ اختبار /api/financial/vouchers/receipts:');
    try {
      const [receipts] = await sequelize.query(`
        SELECT 
          id, "voucherNumber", date, amount, status
        FROM receipt_vouchers
        ORDER BY date DESC
        LIMIT 5
      `);
      console.log(`   ✅ الاستعلام نجح - وجد ${receipts.length} سندات`);
      if (receipts.length > 0) {
        console.log('   📊 مثال:', receipts[0]);
      }
    } catch (err) {
      console.log('   ❌ فشل:', err.message);
    }

    // Test 3: Sales Invoices
    console.log('\n3️⃣ اختبار /api/sales/invoices:');
    try {
      const [invoices] = await sequelize.query(`
        SELECT 
          si.id,
          si."invoiceNumber",
          si.date,
          si.total,
          si.status,
          c.name as customer_name
        FROM sales_invoices si
        LEFT JOIN customers c ON si."customerId" = c.id
        WHERE si."isActive" = true
        ORDER BY si.date DESC
        LIMIT 10
      `);
      console.log(`   ✅ الاستعلام نجح - وجد ${invoices.length} فواتير`);
      if (invoices.length > 0) {
        console.log('   📊 مثال:', invoices[0]);
      }
    } catch (err) {
      console.log('   ❌ فشل:', err.message);
    }

    // Test 4: Shipping Invoices
    console.log('\n4️⃣ اختبار /api/sales/shipping-invoices:');
    try {
      const [shippingInvoices] = await sequelize.query(`
        SELECT 
          id, invoice_number, date, total_amount, status
        FROM shipping_invoices
        ORDER BY date DESC
        LIMIT 10
      `);
      console.log(`   ✅ الاستعلام نجح - وجد ${shippingInvoices.length} فواتير شحن`);
      if (shippingInvoices.length > 0) {
        console.log('   📊 مثال:', shippingInvoices[0]);
      }
    } catch (err) {
      console.log('   ❌ فشل:', err.message);
    }

    // Check all table structures
    console.log('\n\n📋 فحص بنية الجداول:\n');
    console.log('='.repeat(80));

    const tables = ['payment_vouchers', 'receipt_vouchers', 'sales_invoices', 'shipping_invoices'];
    
    for (const table of tables) {
      console.log(`\n📊 ${table}:`);
      try {
        const [columns] = await sequelize.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = '${table}'
          ORDER BY ordinal_position
        `);
        console.log(`   ✅ ${columns.length} أعمدة`);
        
        // Show first 10 columns
        columns.slice(0, 10).forEach(col => {
          console.log(`      - ${col.column_name} (${col.data_type})`);
        });
        
        if (columns.length > 10) {
          console.log(`      ... و ${columns.length - 10} أعمدة أخرى`);
        }
      } catch (err) {
        console.log(`   ❌ خطأ: ${err.message}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ اكتمل الفحص\n');

    await sequelize.close();
  } catch (err) {
    console.error('❌ خطأ:', err.message);
    await sequelize.close();
    process.exit(1);
  }
}

testAllEndpoints();
