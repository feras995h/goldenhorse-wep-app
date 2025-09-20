#!/usr/bin/env node

import { Sequelize } from 'sequelize';
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

async function runAcceptanceTests() {
  console.log('🧪 بدء تشغيل اختبارات القبول الشاملة...');
  
  const testResults = {
    timestamp: new Date().toISOString(),
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    tests: []
  };

  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // اختبار 1: رفض القيد غير المتوازن
    console.log('\n🧪 اختبار 1: رفض القيد غير المتوازن...');
    testResults.totalTests++;
    
    try {
      await sequelize.query(`
        INSERT INTO journal_entries (
          id, "entryNumber", date, description, status, 
          "totalDebit", "totalCredit", "postedBy", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), 'TEST-UNBALANCED', CURRENT_DATE, 
          'اختبار قيد غير متوازن', 'draft', 100.00, 50.00, 
          (SELECT id FROM users LIMIT 1), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `);
      
      testResults.tests.push({
        name: 'رفض القيد غير المتوازن',
        status: 'FAILED',
        message: 'تم قبول قيد غير متوازن - هذا خطأ!'
      });
      testResults.failedTests++;
      
    } catch (error) {
      if (error.message.includes('debit_credit_balance')) {
        testResults.tests.push({
          name: 'رفض القيد غير المتوازن',
          status: 'PASSED',
          message: 'تم رفض القيد غير المتوازن بنجاح'
        });
        testResults.passedTests++;
      } else {
        testResults.tests.push({
          name: 'رفض القيد غير المتوازن',
          status: 'FAILED',
          message: `خطأ غير متوقع: ${error.message}`
        });
        testResults.failedTests++;
      }
    }

    // اختبار 2: منع حذف الحسابات الرئيسية
    console.log('\n🧪 اختبار 2: منع حذف الحسابات الرئيسية...');
    testResults.totalTests++;
    
    try {
      await sequelize.query(`DELETE FROM accounts WHERE code = '1'`);
      
      testResults.tests.push({
        name: 'منع حذف الحسابات الرئيسية',
        status: 'FAILED',
        message: 'تم حذف حساب رئيسي - هذا خطأ!'
      });
      testResults.failedTests++;
      
    } catch (error) {
      if (error.message.includes('لا يمكن حذف الحسابات الرئيسية')) {
        testResults.tests.push({
          name: 'منع حذف الحسابات الرئيسية',
          status: 'PASSED',
          message: 'تم منع حذف الحساب الرئيسي بنجاح'
        });
        testResults.passedTests++;
      } else {
        testResults.tests.push({
          name: 'منع حذف الحسابات الرئيسية',
          status: 'FAILED',
          message: `خطأ غير متوقع: ${error.message}`
        });
        testResults.failedTests++;
      }
    }

    // اختبار 3: منع حذف القيود المرحلة
    console.log('\n🧪 اختبار 3: منع حذف القيود المرحلة...');
    testResults.totalTests++;
    
    try {
      // البحث عن قيد مرحل
      const [postedEntries] = await sequelize.query(`
        SELECT id FROM journal_entries WHERE status = 'posted' LIMIT 1
      `);
      
      if (postedEntries.length > 0) {
        await sequelize.query(`DELETE FROM journal_entries WHERE id = '${postedEntries[0].id}'`);
        
        testResults.tests.push({
          name: 'منع حذف القيود المرحلة',
          status: 'FAILED',
          message: 'تم حذف قيد مرحل - هذا خطأ!'
        });
        testResults.failedTests++;
      } else {
        testResults.tests.push({
          name: 'منع حذف القيود المرحلة',
          status: 'SKIPPED',
          message: 'لا توجد قيود مرحلة للاختبار'
        });
      }
      
    } catch (error) {
      if (error.message.includes('لا يمكن حذف القيد المرحل')) {
        testResults.tests.push({
          name: 'منع حذف القيود المرحلة',
          status: 'PASSED',
          message: 'تم منع حذف القيد المرحل بنجاح'
        });
        testResults.passedTests++;
      } else {
        testResults.tests.push({
          name: 'منع حذف القيود المرحلة',
          status: 'FAILED',
          message: `خطأ غير متوقع: ${error.message}`
        });
        testResults.failedTests++;
      }
    }

    // اختبار 4: منع حذف العملة الأساسية
    console.log('\n🧪 اختبار 4: منع حذف العملة الأساسية...');
    testResults.totalTests++;
    
    try {
      await sequelize.query(`DELETE FROM currencies WHERE "isBaseCurrency" = TRUE`);
      
      testResults.tests.push({
        name: 'منع حذف العملة الأساسية',
        status: 'FAILED',
        message: 'تم حذف العملة الأساسية - هذا خطأ!'
      });
      testResults.failedTests++;
      
    } catch (error) {
      if (error.message.includes('لا يمكن حذف العملة الأساسية')) {
        testResults.tests.push({
          name: 'منع حذف العملة الأساسية',
          status: 'PASSED',
          message: 'تم منع حذف العملة الأساسية بنجاح'
        });
        testResults.passedTests++;
      } else {
        testResults.tests.push({
          name: 'منع حذف العملة الأساسية',
          status: 'FAILED',
          message: `خطأ غير متوقع: ${error.message}`
        });
        testResults.failedTests++;
      }
    }

    // اختبار 5: التحقق من توازن ميزان المراجعة
    console.log('\n🧪 اختبار 5: التحقق من توازن ميزان المراجعة...');
    testResults.totalTests++;
    
    try {
      const [trialBalance] = await sequelize.query(`
        SELECT 
          COALESCE(SUM(jed.debit), 0) as total_debit,
          COALESCE(SUM(jed.credit), 0) as total_credit
        FROM journal_entry_details jed
        JOIN journal_entries je ON jed."journalEntryId" = je.id
        WHERE je.status = 'posted'
      `);
      
      const totalDebit = parseFloat(trialBalance[0].total_debit);
      const totalCredit = parseFloat(trialBalance[0].total_credit);
      const difference = Math.abs(totalDebit - totalCredit);
      
      if (difference < 0.01) {
        testResults.tests.push({
          name: 'توازن ميزان المراجعة',
          status: 'PASSED',
          message: `ميزان المراجعة متوازن: مدين ${totalDebit.toFixed(2)} = دائن ${totalCredit.toFixed(2)}`
        });
        testResults.passedTests++;
      } else {
        testResults.tests.push({
          name: 'توازن ميزان المراجعة',
          status: 'FAILED',
          message: `ميزان المراجعة غير متوازن: فرق ${difference.toFixed(2)}`
        });
        testResults.failedTests++;
      }
      
    } catch (error) {
      testResults.tests.push({
        name: 'توازن ميزان المراجعة',
        status: 'FAILED',
        message: `خطأ في الاختبار: ${error.message}`
      });
      testResults.failedTests++;
    }

    // اختبار 6: التحقق من وجود العملة الأساسية
    console.log('\n🧪 اختبار 6: التحقق من وجود العملة الأساسية...');
    testResults.totalTests++;
    
    try {
      const [baseCurrencies] = await sequelize.query(`
        SELECT COUNT(*) as count FROM currencies WHERE "isBaseCurrency" = TRUE AND "isActive" = TRUE
      `);
      
      const count = parseInt(baseCurrencies[0].count);
      
      if (count === 1) {
        testResults.tests.push({
          name: 'وجود العملة الأساسية',
          status: 'PASSED',
          message: 'يوجد عملة أساسية واحدة فقط'
        });
        testResults.passedTests++;
      } else if (count === 0) {
        testResults.tests.push({
          name: 'وجود العملة الأساسية',
          status: 'FAILED',
          message: 'لا توجد عملة أساسية'
        });
        testResults.failedTests++;
      } else {
        testResults.tests.push({
          name: 'وجود العملة الأساسية',
          status: 'FAILED',
          message: `يوجد ${count} عملات أساسية - يجب أن تكون واحدة فقط`
        });
        testResults.failedTests++;
      }
      
    } catch (error) {
      testResults.tests.push({
        name: 'وجود العملة الأساسية',
        status: 'FAILED',
        message: `خطأ في الاختبار: ${error.message}`
      });
      testResults.failedTests++;
    }

    // اختبار 7: التحقق من عدم وجود قيود غير متوازنة
    console.log('\n🧪 اختبار 7: التحقق من عدم وجود قيود غير متوازنة...');
    testResults.totalTests++;
    
    try {
      const [unbalancedEntries] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM journal_entries 
        WHERE ABS("totalDebit" - "totalCredit") > 0.01
      `);
      
      const count = parseInt(unbalancedEntries[0].count);
      
      if (count === 0) {
        testResults.tests.push({
          name: 'عدم وجود قيود غير متوازنة',
          status: 'PASSED',
          message: 'جميع القيود متوازنة'
        });
        testResults.passedTests++;
      } else {
        testResults.tests.push({
          name: 'عدم وجود قيود غير متوازنة',
          status: 'FAILED',
          message: `يوجد ${count} قيد غير متوازن`
        });
        testResults.failedTests++;
      }
      
    } catch (error) {
      testResults.tests.push({
        name: 'عدم وجود قيود غير متوازنة',
        status: 'FAILED',
        message: `خطأ في الاختبار: ${error.message}`
      });
      testResults.failedTests++;
    }

    // اختبار 8: التحقق من وجود نظام التدقيق
    console.log('\n🧪 اختبار 8: التحقق من وجود نظام التدقيق...');
    testResults.totalTests++;
    
    try {
      const [auditLogs] = await sequelize.query(`
        SELECT COUNT(*) as count FROM audit_logs WHERE "createdAt" >= CURRENT_DATE - INTERVAL '7 days'
      `);
      
      const count = parseInt(auditLogs[0].count);
      
      if (count > 0) {
        testResults.tests.push({
          name: 'وجود نظام التدقيق',
          status: 'PASSED',
          message: `يوجد ${count} سجل تدقيق في آخر 7 أيام`
        });
        testResults.passedTests++;
      } else {
        testResults.tests.push({
          name: 'وجود نظام التدقيق',
          status: 'WARNING',
          message: 'لا توجد سجلات تدقيق حديثة'
        });
      }
      
    } catch (error) {
      testResults.tests.push({
        name: 'وجود نظام التدقيق',
        status: 'FAILED',
        message: `خطأ في الاختبار: ${error.message}`
      });
      testResults.failedTests++;
    }

    // اختبار 9: التحقق من سلامة الحسابات
    console.log('\n🧪 اختبار 9: التحقق من سلامة الحسابات...');
    testResults.totalTests++;
    
    try {
      const [accountIssues] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM accounts 
        WHERE code IS NULL OR code = '' OR name IS NULL OR name = ''
      `);
      
      const count = parseInt(accountIssues[0].count);
      
      if (count === 0) {
        testResults.tests.push({
          name: 'سلامة الحسابات',
          status: 'PASSED',
          message: 'جميع الحسابات لها أكواد وأسماء صحيحة'
        });
        testResults.passedTests++;
      } else {
        testResults.tests.push({
          name: 'سلامة الحسابات',
          status: 'FAILED',
          message: `يوجد ${count} حساب بدون كود أو اسم`
        });
        testResults.failedTests++;
      }
      
    } catch (error) {
      testResults.tests.push({
        name: 'سلامة الحسابات',
        status: 'FAILED',
        message: `خطأ في الاختبار: ${error.message}`
      });
      testResults.failedTests++;
    }

    // اختبار 10: التحقق من وجود الحسابات الرئيسية
    console.log('\n🧪 اختبار 10: التحقق من وجود الحسابات الرئيسية...');
    testResults.totalTests++;
    
    try {
      const [mainAccounts] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM accounts 
        WHERE code IN ('1', '2', '3', '4', '5') AND "isActive" = TRUE
      `);
      
      const count = parseInt(mainAccounts[0].count);
      
      if (count === 5) {
        testResults.tests.push({
          name: 'وجود الحسابات الرئيسية',
          status: 'PASSED',
          message: 'جميع الحسابات الرئيسية (1-5) موجودة'
        });
        testResults.passedTests++;
      } else {
        testResults.tests.push({
          name: 'وجود الحسابات الرئيسية',
          status: 'FAILED',
          message: `يوجد ${count} من أصل 5 حسابات رئيسية`
        });
        testResults.failedTests++;
      }
      
    } catch (error) {
      testResults.tests.push({
        name: 'وجود الحسابات الرئيسية',
        status: 'FAILED',
        message: `خطأ في الاختبار: ${error.message}`
      });
      testResults.failedTests++;
    }

    // حساب النتائج النهائية
    const successRate = ((testResults.passedTests / testResults.totalTests) * 100).toFixed(1);
    
    console.log('\n🎉 انتهت اختبارات القبول!');
    console.log(`📊 النتائج: ${testResults.passedTests}/${testResults.totalTests} نجح (${successRate}%)`);
    
    // حفظ النتائج في ملف
    const reportFileName = `acceptance-tests-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(reportFileName, JSON.stringify(testResults, null, 2), 'utf8');
    console.log(`📄 تم حفظ تقرير الاختبارات في: ${reportFileName}`);
    
    // عرض ملخص النتائج
    console.log('\n📋 ملخص النتائج:');
    testResults.tests.forEach((test, index) => {
      const statusIcon = test.status === 'PASSED' ? '✅' : test.status === 'FAILED' ? '❌' : '⚠️';
      console.log(`${statusIcon} ${index + 1}. ${test.name}: ${test.message}`);
    });
    
    if (testResults.failedTests === 0) {
      console.log('\n🎯 جميع الاختبارات نجحت! النظام المحاسبي يعمل بشكل صحيح 100%');
    } else {
      console.log(`\n⚠️ يوجد ${testResults.failedTests} اختبار فاشل. يحتاج النظام لمراجعة.`);
    }

    return testResults;

  } catch (error) {
    console.error('❌ خطأ في تشغيل اختبارات القبول:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// تشغيل اختبارات القبول
runAcceptanceTests()
  .then((results) => {
    const exitCode = results.failedTests > 0 ? 1 : 0;
    console.log(`\n🎉 انتهى تشغيل اختبارات القبول بنجاح`);
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('\n💥 فشل تشغيل اختبارات القبول:', error);
    process.exit(1);
  });
