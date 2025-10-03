/**
 * سكريبت تثبيت Database Triggers للنظام المحاسبي
 * الغرض: تثبيت Triggers التلقائية لتحديث الأرصدة
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config({ path: join(__dirname, '../../.env') });

async function installTriggers() {
  console.log('🔧 بدء تثبيت Database Triggers...\n');

  const { Client } = pg;
  const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.DB_URL
  });

  try {
    await client.connect();
    console.log('✅ متصل بقاعدة البيانات\n');

    // قراءة ملف SQL
    const triggersPath = join(__dirname, '../../database/triggers/account_balance_triggers.sql');
    const triggersSql = readFileSync(triggersPath, 'utf-8');

    // تنفيذ SQL
    await client.query(triggersSql);

    console.log('✅ تم تثبيت جميع Triggers بنجاح!');
    console.log('\n📋 الـ Triggers المثبتة:');
    console.log('  1. ✓ gl_entry_balance_update - تحديث الأرصدة عند إضافة GL Entry');
    console.log('  2. ✓ gl_entry_balance_update_trigger - تحديث الأرصدة عند تعديل GL Entry');
    console.log('  3. ✓ gl_entry_balance_delete_trigger - تحديث الأرصدة عند حذف GL Entry');
    console.log('  4. ✓ sales_invoice_customer_balance - تحديث رصيد العميل عند الفاتورة');
    console.log('  5. ✓ payment_status_update - تحديث حالة الدفع تلقائياً');
    console.log('  6. ✓ journal_entry_totals_update - تحديث إجماليات القيود');

    // التحقق من التثبيت
    const result = await client.query(`
      SELECT trigger_name, event_object_table, action_timing, event_manipulation
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name;
    `);

    console.log('\n📊 قائمة Triggers في قاعدة البيانات:');
    console.log('='.repeat(80));
    result.rows.forEach(t => {
      console.log(`  📌 ${t.trigger_name.padEnd(35)} | ${t.event_object_table.padEnd(25)} | ${t.action_timing} ${t.event_manipulation}`);
    });

    console.log('\n✅ اكتمل التثبيت بنجاح!');
    
    await client.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ خطأ في تثبيت Triggers:', error.message);
    console.error(error);
    await client.end();
    process.exit(1);
  }
}

installTriggers();

