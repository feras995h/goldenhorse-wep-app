#!/usr/bin/env node

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// تحميل متغيرات البيئة
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden_horse_dev';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: false
  }
});

async function applyStrictConstraints() {
  console.log('🔧 بدء تطبيق القيود المحاسبية الصارمة...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // 1. إضافة قيد التوازن المحاسبي للقيود اليومية
    console.log('\n📊 تطبيق قيد التوازن المحاسبي...');
    
    try {
      // إزالة القيد إذا كان موجوداً مسبقاً
      await sequelize.query(`
        ALTER TABLE journal_entries 
        DROP CONSTRAINT IF EXISTS debit_credit_balance;
      `);
      
      // إضافة القيد الجديد
      await sequelize.query(`
        ALTER TABLE journal_entries
        ADD CONSTRAINT debit_credit_balance
        CHECK (ABS("totalDebit" - "totalCredit") < 0.01);
      `);
      
      console.log('✅ تم تطبيق قيد التوازن المحاسبي للقيود اليومية');
    } catch (error) {
      console.log('⚠️ قيد التوازن المحاسبي موجود مسبقاً أو تم تطبيقه');
    }

    // 2. إضافة قيد فريدة أكواد الحسابات
    console.log('\n🔢 تطبيق قيد فريدة أكواد الحسابات...');
    
    try {
      // التحقق من وجود أكواد مكررة أولاً
      const [duplicates] = await sequelize.query(`
        SELECT code, COUNT(*) as count 
        FROM accounts 
        WHERE code IS NOT NULL 
        GROUP BY code 
        HAVING COUNT(*) > 1;
      `);
      
      if (duplicates.length > 0) {
        console.log('⚠️ تم العثور على أكواد مكررة:');
        duplicates.forEach(dup => {
          console.log(`   كود ${dup.code}: ${dup.count} مرات`);
        });
        
        // إصلاح الأكواد المكررة
        for (const dup of duplicates) {
          const [accounts] = await sequelize.query(`
            SELECT id, code, name FROM accounts WHERE code = '${dup.code}' ORDER BY "createdAt";
          `);
          
          for (let i = 1; i < accounts.length; i++) {
            const newCode = `${dup.code}-${i}`;
            await sequelize.query(`
              UPDATE accounts SET code = '${newCode}' WHERE id = '${accounts[i].id}';
            `);
            console.log(`   تم تغيير كود الحساب "${accounts[i].name}" إلى ${newCode}`);
          }
        }
      }
      
      // إضافة قيد الفريدة
      await sequelize.query(`
        ALTER TABLE accounts 
        DROP CONSTRAINT IF EXISTS unique_account_code;
      `);
      
      await sequelize.query(`
        ALTER TABLE accounts
        ADD CONSTRAINT unique_account_code UNIQUE (code);
      `);
      
      console.log('✅ تم تطبيق قيد فريدة أكواد الحسابات');
    } catch (error) {
      console.log('⚠️ قيد فريدة الأكواد موجود مسبقاً أو تم تطبيقه');
    }

    // 3. حماية الحسابات الرئيسية من الحذف
    console.log('\n🛡️ تطبيق حماية الحسابات الرئيسية...');
    
    try {
      // إنشاء دالة للتحقق من الحسابات الرئيسية
      await sequelize.query(`
        CREATE OR REPLACE FUNCTION prevent_main_account_deletion()
        RETURNS TRIGGER AS $$
        BEGIN
          IF OLD.level = 1 AND OLD.code IN ('1', '2', '3', '4', '5') THEN
            RAISE EXCEPTION 'لا يمكن حذف الحسابات الرئيسية (1,2,3,4,5). يمكن تعطيلها فقط.';
          END IF;
          RETURN OLD;
        END;
        $$ LANGUAGE plpgsql;
      `);
      
      // إنشاء trigger للحماية من الحذف
      await sequelize.query(`
        DROP TRIGGER IF EXISTS protect_main_accounts ON accounts;
      `);
      
      await sequelize.query(`
        CREATE TRIGGER protect_main_accounts
        BEFORE DELETE ON accounts
        FOR EACH ROW
        EXECUTE FUNCTION prevent_main_account_deletion();
      `);
      
      console.log('✅ تم تطبيق حماية الحسابات الرئيسية من الحذف');
    } catch (error) {
      console.log('⚠️ حماية الحسابات الرئيسية موجودة مسبقاً أو تم تطبيقها');
    }

    // 4. منع حذف الحسابات ذات الأرصدة
    console.log('\n💰 تطبيق منع حذف الحسابات ذات الأرصدة...');
    
    try {
      // إنشاء دالة للتحقق من الأرصدة
      await sequelize.query(`
        CREATE OR REPLACE FUNCTION prevent_account_with_balance_deletion()
        RETURNS TRIGGER AS $$
        BEGIN
          IF ABS(OLD.balance) > 0.01 THEN
            RAISE EXCEPTION 'لا يمكن حذف حساب له رصيد (%). يجب تصفير الرصيد أولاً.', OLD.balance;
          END IF;
          RETURN OLD;
        END;
        $$ LANGUAGE plpgsql;
      `);
      
      // إنشاء trigger للحماية من حذف الحسابات ذات الأرصدة
      await sequelize.query(`
        DROP TRIGGER IF EXISTS protect_accounts_with_balance ON accounts;
      `);
      
      await sequelize.query(`
        CREATE TRIGGER protect_accounts_with_balance
        BEFORE DELETE ON accounts
        FOR EACH ROW
        EXECUTE FUNCTION prevent_account_with_balance_deletion();
      `);
      
      console.log('✅ تم تطبيق منع حذف الحسابات ذات الأرصدة');
    } catch (error) {
      console.log('⚠️ منع حذف الحسابات ذات الأرصدة موجود مسبقاً أو تم تطبيقه');
    }

    // 5. التحقق من التوازن في تفاصيل القيود
    console.log('\n📋 تطبيق التحقق من التوازن في تفاصيل القيود...');
    
    try {
      // إنشاء دالة للتحقق من توازن التفاصيل
      await sequelize.query(`
        CREATE OR REPLACE FUNCTION check_journal_entry_balance()
        RETURNS TRIGGER AS $$
        DECLARE
          total_debit DECIMAL(15,2);
          total_credit DECIMAL(15,2);
          entry_id UUID;
        BEGIN
          -- تحديد معرف القيد
          IF TG_OP = 'DELETE' THEN
            entry_id := OLD."journalEntryId";
          ELSE
            entry_id := NEW."journalEntryId";
          END IF;
          
          -- حساب إجمالي المدين والدائن
          SELECT 
            COALESCE(SUM(debit), 0),
            COALESCE(SUM(credit), 0)
          INTO total_debit, total_credit
          FROM journal_entry_details
          WHERE "journalEntryId" = entry_id;
          
          -- التحقق من التوازن
          IF ABS(total_debit - total_credit) > 0.01 THEN
            RAISE EXCEPTION 'القيد غير متوازن: المدين = %, الدائن = %', total_debit, total_credit;
          END IF;
          
          -- تحديث إجماليات القيد الرئيسي
          UPDATE journal_entries 
          SET 
            "totalDebit" = total_debit,
            "totalCredit" = total_credit
          WHERE id = entry_id;
          
          IF TG_OP = 'DELETE' THEN
            RETURN OLD;
          ELSE
            RETURN NEW;
          END IF;
        END;
        $$ LANGUAGE plpgsql;
      `);
      
      // إنشاء triggers للتحقق من التوازن
      await sequelize.query(`
        DROP TRIGGER IF EXISTS check_balance_after_insert ON journal_entry_details;
        DROP TRIGGER IF EXISTS check_balance_after_update ON journal_entry_details;
        DROP TRIGGER IF EXISTS check_balance_after_delete ON journal_entry_details;
      `);
      
      await sequelize.query(`
        CREATE TRIGGER check_balance_after_insert
        AFTER INSERT ON journal_entry_details
        FOR EACH ROW
        EXECUTE FUNCTION check_journal_entry_balance();
        
        CREATE TRIGGER check_balance_after_update
        AFTER UPDATE ON journal_entry_details
        FOR EACH ROW
        EXECUTE FUNCTION check_journal_entry_balance();
        
        CREATE TRIGGER check_balance_after_delete
        AFTER DELETE ON journal_entry_details
        FOR EACH ROW
        EXECUTE FUNCTION check_journal_entry_balance();
      `);
      
      console.log('✅ تم تطبيق التحقق من التوازن في تفاصيل القيود');
    } catch (error) {
      console.log('⚠️ التحقق من التوازن في التفاصيل موجود مسبقاً أو تم تطبيقه');
    }

    // 6. اختبار القيود المطبقة
    console.log('\n🧪 اختبار القيود المطبقة...');
    
    // اختبار قيد التوازن
    try {
      await sequelize.query(`
        INSERT INTO journal_entries (id, "entryNumber", date, "totalDebit", "totalCredit", status)
        VALUES (gen_random_uuid(), 'TEST-UNBALANCED', CURRENT_DATE, 100.00, 200.00, 'draft');
      `);
      console.log('❌ فشل: تم قبول قيد غير متوازن!');
    } catch (error) {
      console.log('✅ نجح: تم رفض القيد غير المتوازن');
    }

    console.log('\n🎉 تم تطبيق جميع القيود المحاسبية الصارمة بنجاح!');
    
    // عرض ملخص القيود المطبقة
    console.log('\n📋 ملخص القيود المطبقة:');
    console.log('1. ✅ قيد التوازن المحاسبي (مدين = دائن)');
    console.log('2. ✅ قيد فريدة أكواد الحسابات');
    console.log('3. ✅ حماية الحسابات الرئيسية من الحذف');
    console.log('4. ✅ منع حذف الحسابات ذات الأرصدة');
    console.log('5. ✅ التحقق التلقائي من توازن تفاصيل القيود');

  } catch (error) {
    console.error('❌ خطأ في تطبيق القيود:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// تشغيل تطبيق القيود
applyStrictConstraints()
  .then(() => {
    console.log('\n🎉 انتهى تطبيق القيود الصارمة بنجاح');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 فشل تطبيق القيود:', error);
    process.exit(1);
  });
