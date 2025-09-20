#!/usr/bin/env node

import { Sequelize, Op } from 'sequelize';
import dotenv from 'dotenv';
import fs from 'fs';

// تحميل متغيرات البيئة
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden_horse_dev';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: false
  }
});

async function fixInvoiceGL() {
  console.log('🔧 بدء إصلاح قيود GL للفواتير...');
  
  const transaction = await sequelize.transaction();
  
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // البحث عن الفواتير بدون قيود GL
    const [invoicesWithoutGL] = await sequelize.query(`
      SELECT 
        i.id, 
        i."invoiceNumber", 
        i.status, 
        i.total, 
        i."customerId",
        i."createdAt",
        c.name as customer_name,
        c."accountId" as customer_account_id
      FROM invoices i
      LEFT JOIN customers c ON i."customerId" = c.id
      LEFT JOIN gl_entries gl ON gl."voucherType" = 'Sales Invoice' AND gl."voucherNo" = i."invoiceNumber"
      WHERE i.status != 'cancelled' AND gl.id IS NULL
    `, { transaction });

    console.log(`📋 تم العثور على ${invoicesWithoutGL.length} فاتورة بدون قيود GL`);

    if (invoicesWithoutGL.length === 0) {
      console.log('✅ جميع الفواتير لديها قيود GL');
      await transaction.rollback();
      return;
    }

    // البحث عن حسابات الإيرادات والذمم المدينة
    const [revenueAccount] = await sequelize.query(`
      SELECT id, code, name
      FROM accounts
      WHERE type = 'revenue' AND "isActive" = true AND "isGroup" = false
      ORDER BY level ASC
      LIMIT 1
    `, { transaction });

    const [receivableAccount] = await sequelize.query(`
      SELECT id, code, name
      FROM accounts
      WHERE type = 'asset' AND (name ILIKE '%مدين%' OR code LIKE '1.3.2%')
      AND "isActive" = true AND "isGroup" = true
      ORDER BY level ASC
      LIMIT 1
    `, { transaction });

    if (revenueAccount.length === 0) {
      throw new Error('لم يتم العثور على حساب إيرادات مناسب');
    }

    if (receivableAccount.length === 0) {
      throw new Error('لم يتم العثور على حساب ذمم مدينة مناسب');
    }

    console.log(`📁 حساب الإيرادات: ${revenueAccount[0].name}`);
    console.log(`📁 حساب الذمم المدينة: ${receivableAccount[0].name}`);

    const results = [];

    // إنشاء قيود GL للفواتير
    for (const invoice of invoicesWithoutGL) {
      console.log(`🔨 إنشاء قيد GL للفاتورة: ${invoice.invoiceNumber}`);

      const invoiceTotal = parseFloat(invoice.total);
      
      // إنشاء قيد GL رئيسي (مدين - حساب العميل)
      const [glEntry] = await sequelize.query(`
        INSERT INTO gl_entries (
          id, "postingDate", "voucherType", "voucherNo", "accountId", remarks,
          debit, credit, "isCancelled", "createdBy", "createdAt", "updatedAt"
        )
        VALUES (
          gen_random_uuid(),
          CURRENT_DATE,
          'Sales Invoice',
          $1,
          $2,
          $3,
          $4,
          0.00,
          false,
          (SELECT id FROM users LIMIT 1),
          $5,
          NOW()
        )
        RETURNING id
      `, {
        bind: [
          invoice.invoiceNumber,
          invoice.customer_account_id || receivableAccount[0].id, // استخدام حساب العميل أو الذمم العامة
          `فاتورة مبيعات - ${invoice.customer_name || 'عميل'}`,
          invoiceTotal,
          invoice.createdAt
        ],
        transaction
      });

      // إنشاء القيد المقابل للإيرادات (دائن)
      await sequelize.query(`
        INSERT INTO gl_entries (
          id, "postingDate", "voucherType", "voucherNo", "accountId", remarks,
          debit, credit, "isCancelled", "createdBy", "createdAt", "updatedAt"
        )
        VALUES (
          gen_random_uuid(),
          CURRENT_DATE,
          'Sales Invoice',
          $1,
          $2,
          $3,
          0.00,
          $4,
          false,
          (SELECT id FROM users LIMIT 1),
          $5,
          NOW()
        )
      `, {
        bind: [
          invoice.invoiceNumber,
          revenueAccount[0].id,
          `إيرادات مبيعات - ${invoice.customer_name || 'عميل'}`,
          invoiceTotal,
          invoice.createdAt
        ],
        transaction
      });

      // تحديث أرصدة الحسابات
      if (invoice.customer_account_id) {
        await sequelize.query(`
          UPDATE accounts 
          SET balance = balance + $1, "updatedAt" = NOW()
          WHERE id = $2
        `, {
          bind: [invoiceTotal, invoice.customer_account_id],
          transaction
        });
      } else {
        await sequelize.query(`
          UPDATE accounts 
          SET balance = balance + $1, "updatedAt" = NOW()
          WHERE id = $2
        `, {
          bind: [invoiceTotal, receivableAccount[0].id],
          transaction
        });
      }

      await sequelize.query(`
        UPDATE accounts 
        SET balance = balance + $1, "updatedAt" = NOW()
        WHERE id = $2
      `, {
        bind: [invoiceTotal, revenueAccount[0].id],
        transaction
      });

      results.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customer_name,
        amount: invoiceTotal,
        glEntryId: glEntry[0].id,
        debitAccount: invoice.customer_account_id ? 'حساب العميل' : receivableAccount[0].name,
        creditAccount: revenueAccount[0].name
      });

      console.log(`✅ تم إنشاء قيد GL للفاتورة ${invoice.invoiceNumber} بمبلغ ${invoiceTotal}`);
    }

    // تأكيد المعاملة
    await transaction.commit();

    console.log('\n📊 ملخص الإصلاحات:');
    console.log('='.repeat(50));
    console.log(`تم إنشاء ${results.length} قيد GL للفواتير`);
    
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.invoiceNumber} - ${result.customerName} - ${result.amount} LYD`);
    });

    // حفظ تقرير الإصلاحات
    const reportPath = 'invoice-gl-fix-report.json';
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalFixed: results.length,
      details: results
    }, null, 2));

    console.log(`\n💾 تم حفظ تقرير الإصلاحات في: ${reportPath}`);

    return results;

  } catch (error) {
    console.error('❌ خطأ في إصلاح قيود GL للفواتير:', error);
    await transaction.rollback();
    throw error;
  } finally {
    await sequelize.close();
  }
}

// تشغيل الإصلاح
fixInvoiceGL()
  .then((results) => {
    console.log(`\n✅ تم إصلاح قيود GL لـ ${results.length} فاتورة بنجاح`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ فشل إصلاح قيود GL للفواتير:', error);
    process.exit(1);
  });
