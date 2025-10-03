/**
 * إصلاح نهائي شامل لجميع أعمدة الجداول
 * يحول جميع الأعمدة من camelCase إلى snake_case
 */

import pg from 'pg';
import { readFileSync } from 'fs';

const envContent = readFileSync('./server/.env', 'utf-8');
const dbUrl = envContent.split('\n').find(line => line.startsWith('DATABASE_URL='))?.split('=')[1]?.trim();

const { Client } = pg;

// قائمة الأعمدة التي يجب تحويلها
const columnsToFix = {
  'sales_invoices': [
    { from: 'customerId', to: 'customer_id' },
    { from: 'invoiceNumber', to: 'invoice_number' },
    { from: 'dueDate', to: 'due_date' },
    { from: 'discountAmount', to: 'discount_amount' },
    { from: 'taxAmount', to: 'tax_amount' },
    { from: 'paidAmount', to: 'paid_amount' },
    { from: 'outstandingAmount', to: 'outstanding_amount' },
    { from: 'outstandingamount', to: 'outstanding_amount' },
    { from: 'exchangeRate', to: 'exchange_rate' },
    { from: 'paymentStatus', to: 'payment_status' },
    { from: 'paymentMethod', to: 'payment_method' },
    { from: 'paymentReference', to: 'payment_reference' },
    { from: 'deliveryFee', to: 'delivery_fee' },
    { from: 'salesPerson', to: 'sales_person' },
    { from: 'internalNotes', to: 'internal_notes' },
    { from: 'createdBy', to: 'created_by' },
    { from: 'createdAt', to: 'created_at' },
    { from: 'updatedAt', to: 'updated_at' }
  ],
  'shipping_invoices': [
    { from: 'customerId', to: 'customer_id' },
    { from: 'shipmentId', to: 'shipment_id' },
    { from: 'invoiceNumber', to: 'invoice_number' },
    { from: 'trackingNumber', to: 'tracking_number' },
    { from: 'dueDate', to: 'due_date' },
    { from: 'shippingCost', to: 'shipping_cost' },
    { from: 'handlingFee', to: 'handling_fee' },
    { from: 'storageFee', to: 'storage_fee' },
    { from: 'customsClearanceFee', to: 'customs_clearance_fee' },
    { from: 'insuranceFee', to: 'insurance_fee' },
    { from: 'additionalFees', to: 'additional_fees' },
    { from: 'discountAmount', to: 'discount_amount' },
    { from: 'taxAmount', to: 'tax_amount' },
    { from: 'paidAmount', to: 'paid_amount' },
    { from: 'outstandingAmount', to: 'outstanding_amount' },
    { from: 'outstandingamount', to: 'outstanding_amount' },
    { from: 'exchangeRate', to: 'exchange_rate' },
    { from: 'paymentStatus', to: 'payment_status' },
    { from: 'paymentMethod', to: 'payment_method' },
    { from: 'paymentReference', to: 'payment_reference' },
    { from: 'itemDescription', to: 'item_description' },
    { from: 'itemDescriptionEn', to: 'item_description_en' },
    { from: 'originLocation', to: 'origin_location' },
    { from: 'destinationLocation', to: 'destination_location' },
    { from: 'internalNotes', to: 'internal_notes' },
    { from: 'createdBy', to: 'created_by' },
    { from: 'createdAt', to: 'created_at' },
    { from: 'updatedAt', to: 'updated_at' }
  ],
  'sales_invoice_items': [
    { from: 'invoiceId', to: 'invoice_id' },
    { from: 'productCode', to: 'product_code' },
    { from: 'unitPrice', to: 'unit_price' },
    { from: 'discountAmount', to: 'discount_amount' },
    { from: 'discountPercent', to: 'discount_percent' },
    { from: 'taxAmount', to: 'tax_amount' },
    { from: 'taxPercent', to: 'tax_percent' },
    { from: 'createdAt', to: 'created_at' },
    { from: 'updatedAt', to: 'updated_at' }
  ]
};

async function fixAllColumns() {
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    console.log('✅ متصل بقاعدة البيانات\n');

    for (const [tableName, columns] of Object.entries(columnsToFix)) {
      console.log(`\n📊 معالجة جدول: ${tableName}`);
      console.log('='.repeat(80));

      // الحصول على الأعمدة الموجودة
      const result = await client.query(`
        SELECT column_name 
        FROM information_schema.columns
        WHERE table_name = $1
      `, [tableName]);

      const existingColumns = result.rows.map(r => r.column_name);

      for (const { from, to } of columns) {
        const hasFrom = existingColumns.includes(from);
        const hasTo = existingColumns.includes(to);

        if (hasFrom && !hasTo) {
          try {
            // استخدام quotes للأعمدة التي تحتوي على حروف كبيرة
            const fromQuoted = /[A-Z]/.test(from) ? `"${from}"` : from;
            await client.query(`ALTER TABLE ${tableName} RENAME COLUMN ${fromQuoted} TO ${to};`);
            console.log(`   ✅ ${from} → ${to}`);
          } catch (error) {
            console.log(`   ❌ فشل: ${from} → ${to} (${error.message})`);
          }
        } else if (hasTo) {
          console.log(`   ℹ️  ${to} موجود بالفعل`);
        } else if (!hasFrom && !hasTo) {
          // العمود غير موجود أصلاً
          console.log(`   ⚠️  ${from} غير موجود`);
        }
      }
    }

    console.log('\n\n✅ تم الإصلاح بنجاح!');
    console.log('\n💡 الآن أعد تشغيل السيرفر: npm run dev');

  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

fixAllColumns();
