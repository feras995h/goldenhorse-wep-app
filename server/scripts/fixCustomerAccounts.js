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

async function fixCustomerAccounts() {
  console.log('🔧 بدء إصلاح حسابات العملاء...');
  
  const transaction = await sequelize.transaction();
  
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // البحث عن العملاء بدون حسابات
    const [customersWithoutAccounts] = await sequelize.query(`
      SELECT id, name, code, balance
      FROM customers
      WHERE "accountId" IS NULL AND "isActive" = true
    `, { transaction });

    console.log(`📋 تم العثور على ${customersWithoutAccounts.length} عميل بدون حساب مرتبط`);

    if (customersWithoutAccounts.length === 0) {
      console.log('✅ جميع العملاء لديهم حسابات مرتبطة');
      await transaction.rollback();
      return;
    }

    // البحث عن حساب الذمم المدينة الرئيسي
    const [accountsReceivableParent] = await sequelize.query(`
      SELECT id, code, name
      FROM accounts
      WHERE type = 'asset' AND name ILIKE '%receivable%' OR name ILIKE '%ذمم%' OR name ILIKE '%مدين%'
      ORDER BY level ASC
      LIMIT 1
    `, { transaction });

    let parentAccountId = null;
    if (accountsReceivableParent.length > 0) {
      parentAccountId = accountsReceivableParent[0].id;
      console.log(`📁 تم العثور على حساب الذمم المدينة الرئيسي: ${accountsReceivableParent[0].name}`);
    } else {
      // إنشاء حساب الذمم المدينة الرئيسي إذا لم يكن موجوداً
      const [newParentAccount] = await sequelize.query(`
        INSERT INTO accounts (id, code, name, "nameEn", type, level, "isGroup", "isActive", balance, "parentId", "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid(),
          'AR001',
          'الذمم المدينة',
          'Accounts Receivable',
          'asset',
          2,
          true,
          true,
          0.00,
          (SELECT id FROM accounts WHERE type = 'asset' AND level = 1 LIMIT 1),
          NOW(),
          NOW()
        )
        RETURNING id, code, name
      `, { transaction });
      
      parentAccountId = newParentAccount[0].id;
      console.log(`✅ تم إنشاء حساب الذمم المدينة الرئيسي: ${newParentAccount[0].name}`);
    }

    const results = [];

    // إنشاء حساب لكل عميل
    for (const customer of customersWithoutAccounts) {
      console.log(`🔨 إنشاء حساب للعميل: ${customer.name}`);

      // إنشاء الحساب الفرعي للعميل
      const shortCode = customer.code ? customer.code.substring(0, 10) : customer.id.substring(0, 8);
      const accountCode = `AR-${shortCode}`.substring(0, 20); // تحديد الطول إلى 20 حرف
      const accountName = `${customer.name} - حساب العميل`;

      const [newAccount] = await sequelize.query(`
        INSERT INTO accounts (
          id, code, name, "nameEn", type, "rootType", "reportType",
          level, "isGroup", "isActive", balance, "parentId",
          "accountType", nature, "createdAt", "updatedAt"
        )
        VALUES (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          'asset',
          'Asset',
          'Balance Sheet',
          3,
          false,
          true,
          $4,
          $5,
          'sub',
          'debit',
          NOW(),
          NOW()
        )
        RETURNING id, code, name
      `, {
        bind: [
          accountCode,
          accountName,
          `${customer.name} - Customer Account`,
          parseFloat(customer.balance || 0),
          parentAccountId
        ],
        transaction
      });

      // ربط الحساب بالعميل
      await sequelize.query(`
        UPDATE customers
        SET "accountId" = $1, "updatedAt" = NOW()
        WHERE id = $2
      `, {
        bind: [newAccount[0].id, customer.id],
        transaction
      });

      results.push({
        customerId: customer.id,
        customerName: customer.name,
        customerCode: customer.code,
        accountId: newAccount[0].id,
        accountCode: newAccount[0].code,
        accountName: newAccount[0].name,
        initialBalance: parseFloat(customer.balance || 0)
      });

      console.log(`✅ تم إنشاء الحساب ${newAccount[0].code} للعميل ${customer.name}`);
    }

    // تأكيد المعاملة
    await transaction.commit();

    console.log('\n📊 ملخص الإصلاحات:');
    console.log('='.repeat(50));
    console.log(`تم إنشاء ${results.length} حساب جديد للعملاء`);
    
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.customerName} → ${result.accountCode}`);
    });

    // حفظ تقرير الإصلاحات
    const reportPath = 'customer-accounts-fix-report.json';
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalFixed: results.length,
      details: results
    }, null, 2));

    console.log(`\n💾 تم حفظ تقرير الإصلاحات في: ${reportPath}`);

    return results;

  } catch (error) {
    console.error('❌ خطأ في إصلاح حسابات العملاء:', error);
    await transaction.rollback();
    throw error;
  } finally {
    await sequelize.close();
  }
}

// تشغيل الإصلاح
fixCustomerAccounts()
  .then((results) => {
    console.log(`\n✅ تم إصلاح حسابات ${results.length} عميل بنجاح`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ فشل إصلاح حسابات العملاء:', error);
    process.exit(1);
  });
