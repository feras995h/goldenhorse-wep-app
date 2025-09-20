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

async function applyDepreciationSystem() {
  console.log('🏭 بدء تطبيق نظام الإهلاك التلقائي...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // 1. إنشاء جدول جدولة الإهلاك
    console.log('\n📅 إنشاء جدول جدولة الإهلاك...');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS depreciation_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "fixedAssetId" UUID NOT NULL REFERENCES fixed_assets(id) ON DELETE CASCADE,
        "scheduleDate" DATE NOT NULL,
        "depreciationAmount" DECIMAL(15,2) NOT NULL CHECK ("depreciationAmount" >= 0),
        "accumulatedDepreciation" DECIMAL(15,2) NOT NULL DEFAULT 0,
        "bookValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','posted','cancelled')),
        "journalEntryId" UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("fixedAssetId", "scheduleDate")
      );
    `);
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_depreciation_schedules_asset ON depreciation_schedules("fixedAssetId");
      CREATE INDEX IF NOT EXISTS idx_depreciation_schedules_date ON depreciation_schedules("scheduleDate");
      CREATE INDEX IF NOT EXISTS idx_depreciation_schedules_status ON depreciation_schedules(status);
    `);
    
    console.log('✅ تم إنشاء جدول جدولة الإهلاك');

    // 2. إضافة حقل isDepreciationEntry لجدول القيود
    console.log('\n📝 إضافة حقل قيود الإهلاك...');
    
    try {
      await sequelize.query(`
        ALTER TABLE journal_entries 
        ADD COLUMN IF NOT EXISTS "isDepreciationEntry" BOOLEAN DEFAULT FALSE;
      `);
      
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_journal_entries_depreciation ON journal_entries("isDepreciationEntry");
      `);
      
      console.log('✅ تم إضافة حقل قيود الإهلاك');
    } catch (error) {
      console.log('⚠️ حقل قيود الإهلاك موجود مسبقاً');
    }

    // 3. إنشاء دالة حساب الإهلاك الشهري
    console.log('\n🧮 إنشاء دالة حساب الإهلاك...');
    
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION calculate_monthly_depreciation(asset_id UUID)
      RETURNS DECIMAL(15,2) AS $$
      DECLARE
        asset_record RECORD;
        monthly_depreciation DECIMAL(15,2);
      BEGIN
        -- الحصول على بيانات الأصل
        SELECT "purchaseCost", "salvageValue", "usefulLife", "depreciationMethod"
        INTO asset_record
        FROM fixed_assets
        WHERE id = asset_id AND status = 'active';
        
        IF NOT FOUND THEN
          RETURN 0;
        END IF;
        
        -- حساب الإهلاك حسب الطريقة
        CASE asset_record."depreciationMethod"
          WHEN 'straight_line' THEN
            -- القسط الثابت: (التكلفة - قيمة الإنقاذ) / العمر الإنتاجي / 12
            monthly_depreciation := (asset_record."purchaseCost" - asset_record."salvageValue") / asset_record."usefulLife" / 12;
          
          WHEN 'declining_balance' THEN
            -- القسط المتناقص: معدل مضاعف × القيمة الدفترية / 12
            -- معدل مضاعف = 2 / العمر الإنتاجي
            monthly_depreciation := (2.0 / asset_record."usefulLife") * asset_record."purchaseCost" / 12;
          
          ELSE
            -- افتراضي: القسط الثابت
            monthly_depreciation := (asset_record."purchaseCost" - asset_record."salvageValue") / asset_record."usefulLife" / 12;
        END CASE;
        
        RETURN ROUND(monthly_depreciation, 2);
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ تم إنشاء دالة حساب الإهلاك');

    // 4. إنشاء دالة توليد جدولة الإهلاك
    console.log('\n📊 إنشاء دالة توليد الجدولة...');
    
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION generate_depreciation_schedule(asset_id UUID)
      RETURNS INTEGER AS $$
      DECLARE
        asset_record RECORD;
        schedule_date DATE;
        monthly_depreciation DECIMAL(15,2);
        accumulated_dep DECIMAL(15,2) := 0;
        book_value DECIMAL(15,2);
        months_count INTEGER := 0;
        total_months INTEGER;
      BEGIN
        -- الحصول على بيانات الأصل
        SELECT "purchaseCost", "salvageValue", "usefulLife", "purchaseDate"
        INTO asset_record
        FROM fixed_assets
        WHERE id = asset_id AND status = 'active';
        
        IF NOT FOUND THEN
          RETURN 0;
        END IF;
        
        -- حذف الجدولة الموجودة للأصل
        DELETE FROM depreciation_schedules WHERE "fixedAssetId" = asset_id;
        
        -- حساب الإهلاك الشهري
        monthly_depreciation := calculate_monthly_depreciation(asset_id);
        total_months := asset_record."usefulLife" * 12;
        book_value := asset_record."purchaseCost";
        
        -- توليد الجدولة الشهرية
        FOR i IN 1..total_months LOOP
          schedule_date := asset_record."purchaseDate" + INTERVAL '1 month' * i;
          accumulated_dep := accumulated_dep + monthly_depreciation;
          book_value := asset_record."purchaseCost" - accumulated_dep;
          
          -- التأكد من عدم تجاوز قيمة الإنقاذ
          IF book_value < asset_record."salvageValue" THEN
            book_value := asset_record."salvageValue";
            monthly_depreciation := asset_record."purchaseCost" - accumulated_dep + monthly_depreciation - asset_record."salvageValue";
            accumulated_dep := asset_record."purchaseCost" - asset_record."salvageValue";
          END IF;
          
          INSERT INTO depreciation_schedules (
            "fixedAssetId", "scheduleDate", "depreciationAmount", 
            "accumulatedDepreciation", "bookValue", status
          ) VALUES (
            asset_id, schedule_date, monthly_depreciation,
            accumulated_dep, book_value, 'pending'
          );
          
          months_count := months_count + 1;
          
          -- التوقف عند الوصول لقيمة الإنقاذ
          IF book_value <= asset_record."salvageValue" THEN
            EXIT;
          END IF;
        END LOOP;
        
        RETURN months_count;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ تم إنشاء دالة توليد الجدولة');

    // 5. إنشاء دالة إنشاء قيد الإهلاك
    console.log('\n📝 إنشاء دالة قيد الإهلاك...');
    
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION create_depreciation_entry(
        schedule_id UUID,
        created_by_user UUID
      )
      RETURNS UUID AS $$
      DECLARE
        schedule_record RECORD;
        asset_record RECORD;
        entry_id UUID;
        entry_number VARCHAR(20);
        sequence_num INTEGER;
      BEGIN
        -- الحصول على بيانات الجدولة
        SELECT ds.*, fa.name as asset_name, fa."assetNumber"
        INTO schedule_record
        FROM depreciation_schedules ds
        JOIN fixed_assets fa ON ds."fixedAssetId" = fa.id
        WHERE ds.id = schedule_id AND ds.status = 'pending';
        
        IF NOT FOUND THEN
          RAISE EXCEPTION 'جدولة الإهلاك غير موجودة أو تم ترحيلها مسبقاً';
        END IF;
        
        -- الحصول على حسابات الأصل
        SELECT 
          "depreciationExpenseAccountId",
          "accumulatedDepreciationAccountId"
        INTO asset_record
        FROM fixed_assets
        WHERE id = schedule_record."fixedAssetId";
        
        IF asset_record."depreciationExpenseAccountId" IS NULL OR 
           asset_record."accumulatedDepreciationAccountId" IS NULL THEN
          RAISE EXCEPTION 'حسابات الإهلاك غير مكتملة للأصل';
        END IF;
        
        -- إنشاء رقم تسلسلي لقيد الإهلاك
        SELECT COALESCE(MAX(CAST(SUBSTRING("entryNumber" FROM 'DEP-(\\d+)') AS INTEGER)), 0) + 1
        INTO sequence_num
        FROM journal_entries
        WHERE "entryNumber" LIKE 'DEP-%';
        
        entry_number := 'DEP-' || LPAD(sequence_num::TEXT, 6, '0');
        entry_id := gen_random_uuid();
        
        -- إنشاء قيد الإهلاك
        INSERT INTO journal_entries (
          id, "entryNumber", date, description, status, 
          "isDepreciationEntry", "totalDebit", "totalCredit", "postedBy", "createdAt", "updatedAt"
        ) VALUES (
          entry_id, entry_number, schedule_record."scheduleDate",
          'قيد إهلاك شهري - ' || schedule_record.asset_name || ' (' || schedule_record."assetNumber" || ')',
          'posted', TRUE, schedule_record."depreciationAmount", schedule_record."depreciationAmount",
          created_by_user, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
        
        -- إضافة تفاصيل القيد
        -- مدين: مصاريف الإهلاك
        INSERT INTO journal_entry_details (
          id, "journalEntryId", "accountId", debit, credit, description, "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), entry_id, asset_record."depreciationExpenseAccountId",
          schedule_record."depreciationAmount", 0,
          'مصاريف إهلاك - ' || schedule_record.asset_name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
        
        -- دائن: مجمع الإهلاك
        INSERT INTO journal_entry_details (
          id, "journalEntryId", "accountId", debit, credit, description, "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), entry_id, asset_record."accumulatedDepreciationAccountId",
          0, schedule_record."depreciationAmount",
          'مجمع إهلاك - ' || schedule_record.asset_name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
        
        -- تحديث حالة الجدولة
        UPDATE depreciation_schedules
        SET 
          status = 'posted',
          "journalEntryId" = entry_id,
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = schedule_id;
        
        RETURN entry_id;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ تم إنشاء دالة قيد الإهلاك');

    // 6. إنشاء دالة المعالجة الشهرية للإهلاك
    console.log('\n🔄 إنشاء دالة المعالجة الشهرية...');
    
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION process_monthly_depreciation(
        process_date DATE DEFAULT CURRENT_DATE,
        created_by_user UUID DEFAULT NULL
      )
      RETURNS TABLE(
        processed_count INTEGER,
        total_amount DECIMAL(15,2),
        error_count INTEGER
      ) AS $$
      DECLARE
        schedule_rec RECORD;
        entry_id UUID;
        processed INTEGER := 0;
        errors INTEGER := 0;
        total_dep DECIMAL(15,2) := 0;
        default_user UUID;
      BEGIN
        -- الحصول على مستخدم افتراضي إذا لم يتم تحديده
        IF created_by_user IS NULL THEN
          SELECT id INTO default_user FROM users ORDER BY "createdAt" LIMIT 1;
          created_by_user := default_user;
        END IF;
        
        -- معالجة جميع جدولات الإهلاك المستحقة
        FOR schedule_rec IN
          SELECT id, "depreciationAmount"
          FROM depreciation_schedules
          WHERE "scheduleDate" <= process_date
            AND status = 'pending'
          ORDER BY "scheduleDate", "fixedAssetId"
        LOOP
          BEGIN
            -- إنشاء قيد الإهلاك
            entry_id := create_depreciation_entry(schedule_rec.id, created_by_user);
            processed := processed + 1;
            total_dep := total_dep + schedule_rec."depreciationAmount";
            
          EXCEPTION WHEN OTHERS THEN
            errors := errors + 1;
            -- تسجيل الخطأ في الملاحظات
            UPDATE depreciation_schedules
            SET notes = 'خطأ في الترحيل: ' || SQLERRM
            WHERE id = schedule_rec.id;
          END;
        END LOOP;
        
        RETURN QUERY SELECT processed, total_dep, errors;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ تم إنشاء دالة المعالجة الشهرية');

    // 7. إنشاء حماية قيود الإهلاك من الحذف
    console.log('\n🛡️ إنشاء حماية قيود الإهلاك...');
    
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION protect_depreciation_entry()
      RETURNS TRIGGER AS $$
      BEGIN
        IF OLD."isDepreciationEntry" = TRUE THEN
          RAISE EXCEPTION 'لا يمكن حذف قيود الإهلاك. استخدم عكس القيد للتصحيح.';
        END IF;
        RETURN OLD;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await sequelize.query(`
      DROP TRIGGER IF EXISTS protect_depreciation_entry_deletion ON journal_entries;
      CREATE TRIGGER protect_depreciation_entry_deletion
      BEFORE DELETE ON journal_entries
      FOR EACH ROW
      EXECUTE FUNCTION protect_depreciation_entry();
    `);
    
    console.log('✅ تم إنشاء حماية قيود الإهلاك');

    console.log('\n🎉 تم تطبيق نظام الإهلاك التلقائي بنجاح!');
    
    // عرض ملخص النظام
    console.log('\n📋 ملخص نظام الإهلاك التلقائي:');
    console.log('1. ✅ جدول جدولة الإهلاك مع الحالات');
    console.log('2. ✅ دالة حساب الإهلاك (قسط ثابت ومتناقص)');
    console.log('3. ✅ دالة توليد الجدولة الشهرية');
    console.log('4. ✅ دالة إنشاء قيود الإهلاك التلقائية');
    console.log('5. ✅ دالة المعالجة الشهرية المجمعة');
    console.log('6. ✅ حماية قيود الإهلاك من الحذف');

  } catch (error) {
    console.error('❌ خطأ في تطبيق نظام الإهلاك:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// تشغيل تطبيق نظام الإهلاك
applyDepreciationSystem()
  .then(() => {
    console.log('\n🎉 انتهى تطبيق نظام الإهلاك التلقائي بنجاح');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 فشل تطبيق نظام الإهلاك:', error);
    process.exit(1);
  });
