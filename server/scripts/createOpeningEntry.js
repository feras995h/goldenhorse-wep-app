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

async function createOpeningEntry() {
  console.log('🏁 بدء إنشاء نظام قيد الافتتاح المحمي...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // 1. إضافة حقل is_opening_entry لجدول القيود اليومية
    console.log('\n📝 إضافة حقل قيد الافتتاح...');
    
    try {
      await sequelize.query(`
        ALTER TABLE journal_entries 
        ADD COLUMN IF NOT EXISTS "isOpeningEntry" BOOLEAN DEFAULT FALSE;
      `);
      
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_journal_entries_opening ON journal_entries("isOpeningEntry");
      `);
      
      console.log('✅ تم إضافة حقل قيد الافتتاح');
    } catch (error) {
      console.log('⚠️ حقل قيد الافتتاح موجود مسبقاً');
    }

    // 2. إنشاء دالة حماية قيد الافتتاح من الحذف
    console.log('\n🛡️ إنشاء حماية قيد الافتتاح...');
    
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION protect_opening_entry()
      RETURNS TRIGGER AS $$
      BEGIN
        IF OLD."isOpeningEntry" = TRUE THEN
          RAISE EXCEPTION 'لا يمكن حذف قيد الافتتاح. استخدم قيود التسوية للتعديل.';
        END IF;
        RETURN OLD;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // إنشاء trigger للحماية من الحذف
    await sequelize.query(`
      DROP TRIGGER IF EXISTS protect_opening_entry_deletion ON journal_entries;
      CREATE TRIGGER protect_opening_entry_deletion
      BEFORE DELETE ON journal_entries
      FOR EACH ROW
      EXECUTE FUNCTION protect_opening_entry();
    `);
    
    console.log('✅ تم إنشاء حماية قيد الافتتاح من الحذف');

    // 3. إنشاء دالة لإنشاء قيد الافتتاح
    console.log('\n🏗️ إنشاء دالة قيد الافتتاح...');
    
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION create_opening_entry(
        opening_date DATE,
        created_by_user UUID
      )
      RETURNS UUID AS $$
      DECLARE
        entry_id UUID;
        entry_number VARCHAR(20);
        total_assets DECIMAL(15,2) := 0;
        total_liabilities DECIMAL(15,2) := 0;
        total_equity DECIMAL(15,2) := 0;
        account_rec RECORD;
      BEGIN
        -- التحقق من عدم وجود قيد افتتاح مسبق
        IF EXISTS (SELECT 1 FROM journal_entries WHERE "isOpeningEntry" = TRUE) THEN
          RAISE EXCEPTION 'قيد الافتتاح موجود بالفعل. لا يمكن إنشاء أكثر من قيد افتتاح واحد.';
        END IF;
        
        -- إنشاء رقم القيد
        entry_number := 'OPENING-' || TO_CHAR(opening_date, 'YYYY-MM-DD');
        entry_id := gen_random_uuid();
        
        -- إنشاء قيد الافتتاح الرئيسي
        INSERT INTO journal_entries (
          id, "entryNumber", date, description, status,
          "isOpeningEntry", "totalDebit", "totalCredit", "postedBy", "createdAt", "updatedAt"
        ) VALUES (
          entry_id, entry_number, opening_date,
          'قيد الافتتاح - الأرصدة الافتتاحية للنظام',
          'posted', TRUE, 0, 0, created_by_user, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
        
        -- إضافة تفاصيل القيد من الأرصدة الحالية للحسابات
        FOR account_rec IN 
          SELECT id, code, name, balance, type 
          FROM accounts 
          WHERE "isActive" = TRUE AND ABS(balance) > 0.01
          ORDER BY code
        LOOP
          -- إضافة جميع الأرصدة بغض النظر عن النوع
          IF account_rec.balance > 0 THEN
            IF account_rec.type IN ('asset', 'expense') THEN
              -- حسابات الأصول والمصروفات (مدينة)
              INSERT INTO journal_entry_details (
                id, "journalEntryId", "accountId", debit, credit, description, "createdAt", "updatedAt"
              ) VALUES (
                gen_random_uuid(), entry_id, account_rec.id, account_rec.balance, 0,
                'رصيد افتتاحي - ' || account_rec.name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
              );
              total_assets := total_assets + account_rec.balance;

            ELSE
              -- حسابات الخصوم وحقوق الملكية والإيرادات (دائنة)
              INSERT INTO journal_entry_details (
                id, "journalEntryId", "accountId", debit, credit, description, "createdAt", "updatedAt"
              ) VALUES (
                gen_random_uuid(), entry_id, account_rec.id, 0, account_rec.balance,
                'رصيد افتتاحي - ' || account_rec.name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
              );
              total_liabilities := total_liabilities + account_rec.balance;
            END IF;
          ELSIF account_rec.balance < 0 THEN
            -- الأرصدة السالبة (عكس الطبيعة)
            IF account_rec.type IN ('asset', 'expense') THEN
              -- أصل برصيد سالب = دائن
              INSERT INTO journal_entry_details (
                id, "journalEntryId", "accountId", debit, credit, description, "createdAt", "updatedAt"
              ) VALUES (
                gen_random_uuid(), entry_id, account_rec.id, 0, ABS(account_rec.balance),
                'رصيد افتتاحي - ' || account_rec.name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
              );
              total_liabilities := total_liabilities + ABS(account_rec.balance);
            ELSE
              -- خصم برصيد سالب = مدين
              INSERT INTO journal_entry_details (
                id, "journalEntryId", "accountId", debit, credit, description, "createdAt", "updatedAt"
              ) VALUES (
                gen_random_uuid(), entry_id, account_rec.id, ABS(account_rec.balance), 0,
                'رصيد افتتاحي - ' || account_rec.name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
              );
              total_assets := total_assets + ABS(account_rec.balance);
            END IF;
          END IF;
        END LOOP;
        
        -- تحديث إجماليات القيد
        UPDATE journal_entries 
        SET 
          "totalDebit" = total_assets,
          "totalCredit" = total_liabilities
        WHERE id = entry_id;
        
        -- إنشاء قيد موازنة إذا لم تكن الأرصدة متوازنة
        IF ABS(total_assets - total_liabilities) > 0.01 THEN
          DECLARE
            balance_diff DECIMAL(15,2);
            equity_account_id UUID;
          BEGIN
            balance_diff := total_assets - total_liabilities;

            -- البحث عن حساب رأس المال أو إنشاؤه
            SELECT id INTO equity_account_id
            FROM accounts
            WHERE code = '3-1' OR name LIKE '%رأس المال%' OR name LIKE '%حقوق الملكية%'
            LIMIT 1;

            -- إذا لم يوجد حساب رأس المال، إنشاء واحد
            IF equity_account_id IS NULL THEN
              equity_account_id := gen_random_uuid();
              INSERT INTO accounts (
                id, code, name, type, level, "parentId", balance, "isActive", "createdAt", "updatedAt"
              ) VALUES (
                equity_account_id, '3-1', 'رأس المال - موازنة افتتاحية', 'equity', 2,
                (SELECT id FROM accounts WHERE code = '3' LIMIT 1),
                0, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
              );
            END IF;

            -- إضافة قيد الموازنة
            IF balance_diff > 0 THEN
              -- الأصول أكبر من الخصوم، نحتاج دائن في حقوق الملكية
              INSERT INTO journal_entry_details (
                id, "journalEntryId", "accountId", debit, credit, description, "createdAt", "updatedAt"
              ) VALUES (
                gen_random_uuid(), entry_id, equity_account_id, 0, balance_diff,
                'موازنة افتتاحية - رأس المال', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
              );
              total_liabilities := total_liabilities + balance_diff;
            ELSE
              -- الخصوم أكبر من الأصول، نحتاج مدين في حقوق الملكية
              INSERT INTO journal_entry_details (
                id, "journalEntryId", "accountId", debit, credit, description, "createdAt", "updatedAt"
              ) VALUES (
                gen_random_uuid(), entry_id, equity_account_id, ABS(balance_diff), 0,
                'موازنة افتتاحية - عجز رأس المال', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
              );
              total_assets := total_assets + ABS(balance_diff);
            END IF;
          END;
        END IF;
        
        RETURN entry_id;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ تم إنشاء دالة قيد الافتتاح');

    // 4. إنشاء دالة لقيود التسوية
    console.log('\n⚖️ إنشاء دالة قيود التسوية...');
    
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION create_adjustment_entry(
        adjustment_date DATE,
        description TEXT,
        created_by_user UUID
      )
      RETURNS UUID AS $$
      DECLARE
        entry_id UUID;
        entry_number VARCHAR(20);
        sequence_num INTEGER;
      BEGIN
        -- إنشاء رقم تسلسلي لقيد التسوية
        SELECT COALESCE(MAX(CAST(SUBSTRING("entryNumber" FROM 'ADJ-(\d+)') AS INTEGER)), 0) + 1
        INTO sequence_num
        FROM journal_entries
        WHERE "entryNumber" LIKE 'ADJ-%';
        
        entry_number := 'ADJ-' || LPAD(sequence_num::TEXT, 6, '0');
        entry_id := gen_random_uuid();
        
        -- إنشاء قيد التسوية
        INSERT INTO journal_entries (
          id, "entryNumber", date, description, status,
          "isOpeningEntry", "totalDebit", "totalCredit", "postedBy", "createdAt", "updatedAt"
        ) VALUES (
          entry_id, entry_number, adjustment_date,
          'قيد تسوية: ' || description,
          'draft', FALSE, 0, 0, created_by_user, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
        
        RETURN entry_id;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ تم إنشاء دالة قيود التسوية');

    // 5. التحقق من وجود قيد افتتاح
    console.log('\n🔍 التحقق من وجود قيد افتتاح...');
    
    const [existingOpening] = await sequelize.query(`
      SELECT * FROM journal_entries WHERE "isOpeningEntry" = TRUE LIMIT 1;
    `);
    
    if (existingOpening.length === 0) {
      console.log('📝 لا يوجد قيد افتتاح. سيتم إنشاؤه...');
      
      // الحصول على معرف المستخدم الأول
      const [users] = await sequelize.query(`
        SELECT id FROM users ORDER BY "createdAt" LIMIT 1;
      `);
      
      if (users.length > 0) {
        const userId = users[0].id;
        const openingDate = new Date().toISOString().split('T')[0];
        
        try {
          const [result] = await sequelize.query(`
            SELECT create_opening_entry('${openingDate}', '${userId}') as entry_id;
          `);
          
          console.log(`✅ تم إنشاء قيد الافتتاح بنجاح: ${result[0].entry_id}`);
        } catch (error) {
          if (error.message.includes('قيد الافتتاح موجود بالفعل')) {
            console.log('✅ قيد الافتتاح موجود بالفعل');
          } else {
            console.log('⚠️ لم يتم إنشاء قيد الافتتاح:', error.message);
          }
        }
      } else {
        console.log('⚠️ لا يوجد مستخدمون في النظام. لا يمكن إنشاء قيد الافتتاح.');
      }
    } else {
      console.log('✅ قيد الافتتاح موجود بالفعل');
    }

    // 6. اختبار حماية قيد الافتتاح
    console.log('\n🧪 اختبار حماية قيد الافتتاح...');
    
    const [openingEntry] = await sequelize.query(`
      SELECT id FROM journal_entries WHERE "isOpeningEntry" = TRUE LIMIT 1;
    `);
    
    if (openingEntry.length > 0) {
      try {
        await sequelize.query(`
          DELETE FROM journal_entries WHERE id = '${openingEntry[0].id}';
        `);
        console.log('❌ فشل: تم حذف قيد الافتتاح!');
      } catch (error) {
        console.log('✅ نجح: تم منع حذف قيد الافتتاح');
      }
    }

    console.log('\n🎉 تم تطبيق نظام قيد الافتتاح المحمي بنجاح!');
    
    // عرض ملخص النظام
    console.log('\n📋 ملخص نظام قيد الافتتاح:');
    console.log('1. ✅ حقل isOpeningEntry لتمييز قيد الافتتاح');
    console.log('2. ✅ حماية تلقائية من حذف قيد الافتتاح');
    console.log('3. ✅ دالة إنشاء قيد الافتتاح من الأرصدة الحالية');
    console.log('4. ✅ دالة إنشاء قيود التسوية للتعديلات');
    console.log('5. ✅ ضمان وجود قيد افتتاح واحد فقط');

  } catch (error) {
    console.error('❌ خطأ في إنشاء نظام قيد الافتتاح:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// تشغيل إنشاء نظام قيد الافتتاح
createOpeningEntry()
  .then(() => {
    console.log('\n🎉 انتهى إنشاء نظام قيد الافتتاح بنجاح');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 فشل إنشاء نظام قيد الافتتاح:', error);
    process.exit(1);
  });
