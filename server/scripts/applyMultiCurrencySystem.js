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

async function applyMultiCurrencySystem() {
  console.log('💱 بدء تطبيق نظام العملات المتعددة الصارم...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // 1. إنشاء جدول العملات
    console.log('\n💰 إنشاء جدول العملات...');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS currencies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(3) NOT NULL UNIQUE CHECK (LENGTH(code) = 3),
        name VARCHAR(100) NOT NULL,
        symbol VARCHAR(10) NOT NULL,
        "decimalPlaces" INTEGER DEFAULT 2 CHECK ("decimalPlaces" >= 0 AND "decimalPlaces" <= 6),
        "isBaseCurrency" BOOLEAN DEFAULT FALSE,
        "isActive" BOOLEAN DEFAULT TRUE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(code);
      CREATE INDEX IF NOT EXISTS idx_currencies_base ON currencies("isBaseCurrency");
      CREATE INDEX IF NOT EXISTS idx_currencies_active ON currencies("isActive");
    `);
    
    // إدراج العملات الأساسية
    await sequelize.query(`
      INSERT INTO currencies (code, name, symbol, "decimalPlaces", "isBaseCurrency", "isActive")
      VALUES 
        ('LYD', 'الدينار الليبي', 'د.ل', 3, TRUE, TRUE),
        ('USD', 'الدولار الأمريكي', '$', 2, FALSE, TRUE),
        ('EUR', 'اليورو', '€', 2, FALSE, TRUE),
        ('GBP', 'الجنيه الإسترليني', '£', 2, FALSE, TRUE)
      ON CONFLICT (code) DO NOTHING;
    `);
    
    console.log('✅ تم إنشاء جدول العملات');

    // 2. إنشاء جدول أسعار الصرف اليومية
    console.log('\n📈 إنشاء جدول أسعار الصرف...');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS exchange_rates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "fromCurrencyId" UUID NOT NULL REFERENCES currencies(id) ON DELETE CASCADE,
        "toCurrencyId" UUID NOT NULL REFERENCES currencies(id) ON DELETE CASCADE,
        rate DECIMAL(15,6) NOT NULL CHECK (rate > 0),
        "effectiveDate" DATE NOT NULL,
        "isActive" BOOLEAN DEFAULT TRUE,
        source VARCHAR(50) DEFAULT 'manual',
        notes TEXT,
        "createdBy" UUID REFERENCES users(id),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("fromCurrencyId", "toCurrencyId", "effectiveDate"),
        CHECK ("fromCurrencyId" != "toCurrencyId")
      );
    `);
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_exchange_rates_from ON exchange_rates("fromCurrencyId");
      CREATE INDEX IF NOT EXISTS idx_exchange_rates_to ON exchange_rates("toCurrencyId");
      CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates("effectiveDate");
      CREATE INDEX IF NOT EXISTS idx_exchange_rates_active ON exchange_rates("isActive");
    `);
    
    console.log('✅ تم إنشاء جدول أسعار الصرف');

    // 3. إضافة حقول العملة للجداول الرئيسية
    console.log('\n🔧 إضافة حقول العملة للجداول...');
    
    // إضافة حقل العملة لجدول الحسابات
    try {
      await sequelize.query(`
        ALTER TABLE accounts 
        ADD COLUMN IF NOT EXISTS "currencyId" UUID REFERENCES currencies(id);
      `);
      
      // تعيين العملة الأساسية للحسابات الموجودة
      await sequelize.query(`
        UPDATE accounts 
        SET "currencyId" = (SELECT id FROM currencies WHERE "isBaseCurrency" = TRUE LIMIT 1)
        WHERE "currencyId" IS NULL;
      `);
      
      console.log('✅ تم إضافة حقل العملة للحسابات');
    } catch (error) {
      console.log('⚠️ حقل العملة موجود مسبقاً في الحسابات');
    }

    // إضافة حقول العملة لجدول القيود
    try {
      await sequelize.query(`
        ALTER TABLE journal_entries 
        ADD COLUMN IF NOT EXISTS "currencyId" UUID REFERENCES currencies(id),
        ADD COLUMN IF NOT EXISTS "exchangeRate" DECIMAL(15,6) DEFAULT 1.0 CHECK ("exchangeRate" > 0),
        ADD COLUMN IF NOT EXISTS "baseCurrencyAmount" DECIMAL(15,2);
      `);
      
      // تعيين العملة الأساسية للقيود الموجودة
      await sequelize.query(`
        UPDATE journal_entries 
        SET 
          "currencyId" = (SELECT id FROM currencies WHERE "isBaseCurrency" = TRUE LIMIT 1),
          "exchangeRate" = 1.0,
          "baseCurrencyAmount" = "totalDebit"
        WHERE "currencyId" IS NULL;
      `);
      
      console.log('✅ تم إضافة حقول العملة للقيود');
    } catch (error) {
      console.log('⚠️ حقول العملة موجودة مسبقاً في القيود');
    }

    // إضافة حقول العملة لتفاصيل القيود
    try {
      await sequelize.query(`
        ALTER TABLE journal_entry_details 
        ADD COLUMN IF NOT EXISTS "originalCurrencyDebit" DECIMAL(15,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "originalCurrencyCredit" DECIMAL(15,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "exchangeRate" DECIMAL(15,6) DEFAULT 1.0 CHECK ("exchangeRate" > 0);
      `);
      
      // تعيين القيم للتفاصيل الموجودة
      await sequelize.query(`
        UPDATE journal_entry_details 
        SET 
          "originalCurrencyDebit" = debit,
          "originalCurrencyCredit" = credit,
          "exchangeRate" = 1.0
        WHERE "originalCurrencyDebit" = 0 AND "originalCurrencyCredit" = 0;
      `);
      
      console.log('✅ تم إضافة حقول العملة لتفاصيل القيود');
    } catch (error) {
      console.log('⚠️ حقول العملة موجودة مسبقاً في تفاصيل القيود');
    }

    // 4. إنشاء دالة الحصول على سعر الصرف
    console.log('\n💹 إنشاء دالة أسعار الصرف...');
    
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION get_exchange_rate(
        from_currency_code VARCHAR(3),
        to_currency_code VARCHAR(3),
        rate_date DATE DEFAULT CURRENT_DATE
      )
      RETURNS DECIMAL(15,6) AS $$
      DECLARE
        exchange_rate DECIMAL(15,6);
        from_currency_id UUID;
        to_currency_id UUID;
      BEGIN
        -- إذا كانت العملتان متشابهتان
        IF from_currency_code = to_currency_code THEN
          RETURN 1.0;
        END IF;
        
        -- الحصول على معرفات العملات
        SELECT id INTO from_currency_id FROM currencies WHERE code = from_currency_code AND "isActive" = TRUE;
        SELECT id INTO to_currency_id FROM currencies WHERE code = to_currency_code AND "isActive" = TRUE;
        
        IF from_currency_id IS NULL OR to_currency_id IS NULL THEN
          RAISE EXCEPTION 'عملة غير صالحة: % أو %', from_currency_code, to_currency_code;
        END IF;
        
        -- البحث عن سعر الصرف المباشر
        SELECT rate INTO exchange_rate
        FROM exchange_rates
        WHERE "fromCurrencyId" = from_currency_id
          AND "toCurrencyId" = to_currency_id
          AND "effectiveDate" <= rate_date
          AND "isActive" = TRUE
        ORDER BY "effectiveDate" DESC
        LIMIT 1;
        
        -- إذا لم يوجد سعر مباشر، البحث عن السعر العكسي
        IF exchange_rate IS NULL THEN
          SELECT (1.0 / rate) INTO exchange_rate
          FROM exchange_rates
          WHERE "fromCurrencyId" = to_currency_id
            AND "toCurrencyId" = from_currency_id
            AND "effectiveDate" <= rate_date
            AND "isActive" = TRUE
          ORDER BY "effectiveDate" DESC
          LIMIT 1;
        END IF;
        
        -- إذا لم يوجد سعر، البحث عن سعر عبر العملة الأساسية
        IF exchange_rate IS NULL THEN
          DECLARE
            base_currency_id UUID;
            from_to_base_rate DECIMAL(15,6);
            to_to_base_rate DECIMAL(15,6);
          BEGIN
            SELECT id INTO base_currency_id FROM currencies WHERE "isBaseCurrency" = TRUE LIMIT 1;
            
            -- من العملة المصدر إلى الأساسية
            SELECT rate INTO from_to_base_rate
            FROM exchange_rates
            WHERE "fromCurrencyId" = from_currency_id
              AND "toCurrencyId" = base_currency_id
              AND "effectiveDate" <= rate_date
              AND "isActive" = TRUE
            ORDER BY "effectiveDate" DESC
            LIMIT 1;
            
            -- من العملة الهدف إلى الأساسية
            SELECT rate INTO to_to_base_rate
            FROM exchange_rates
            WHERE "fromCurrencyId" = to_currency_id
              AND "toCurrencyId" = base_currency_id
              AND "effectiveDate" <= rate_date
              AND "isActive" = TRUE
            ORDER BY "effectiveDate" DESC
            LIMIT 1;
            
            IF from_to_base_rate IS NOT NULL AND to_to_base_rate IS NOT NULL THEN
              exchange_rate := from_to_base_rate / to_to_base_rate;
            END IF;
          END;
        END IF;
        
        -- إذا لم يوجد أي سعر
        IF exchange_rate IS NULL THEN
          RAISE EXCEPTION 'لا يوجد سعر صرف متاح من % إلى % في تاريخ %', from_currency_code, to_currency_code, rate_date;
        END IF;
        
        RETURN ROUND(exchange_rate, 6);
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ تم إنشاء دالة أسعار الصرف');

    // 5. إنشاء دالة تحويل العملة
    console.log('\n🔄 إنشاء دالة تحويل العملة...');
    
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION convert_currency(
        amount DECIMAL(15,2),
        from_currency_code VARCHAR(3),
        to_currency_code VARCHAR(3),
        conversion_date DATE DEFAULT CURRENT_DATE
      )
      RETURNS DECIMAL(15,2) AS $$
      DECLARE
        exchange_rate DECIMAL(15,6);
        converted_amount DECIMAL(15,2);
      BEGIN
        -- الحصول على سعر الصرف
        exchange_rate := get_exchange_rate(from_currency_code, to_currency_code, conversion_date);
        
        -- تحويل المبلغ
        converted_amount := amount * exchange_rate;
        
        RETURN ROUND(converted_amount, 2);
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ تم إنشاء دالة تحويل العملة');

    // 6. إنشاء دالة قيد تحويل العملة
    console.log('\n📝 إنشاء دالة قيد تحويل العملة...');
    
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION create_currency_conversion_entry(
        from_account_id UUID,
        to_account_id UUID,
        amount DECIMAL(15,2),
        from_currency_code VARCHAR(3),
        to_currency_code VARCHAR(3),
        conversion_date DATE,
        description TEXT,
        created_by_user UUID
      )
      RETURNS UUID AS $$
      DECLARE
        entry_id UUID;
        entry_number VARCHAR(20);
        sequence_num INTEGER;
        exchange_rate DECIMAL(15,6);
        converted_amount DECIMAL(15,2);
        fx_difference DECIMAL(15,2);
        fx_account_id UUID;
        base_currency_id UUID;
      BEGIN
        -- التحقق من صحة الحسابات
        IF NOT EXISTS (SELECT 1 FROM accounts WHERE id = from_account_id AND "isActive" = TRUE) THEN
          RAISE EXCEPTION 'حساب المصدر غير صالح';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM accounts WHERE id = to_account_id AND "isActive" = TRUE) THEN
          RAISE EXCEPTION 'حساب الهدف غير صالح';
        END IF;
        
        -- الحصول على سعر الصرف والمبلغ المحول
        exchange_rate := get_exchange_rate(from_currency_code, to_currency_code, conversion_date);
        converted_amount := convert_currency(amount, from_currency_code, to_currency_code, conversion_date);
        
        -- الحصول على العملة الأساسية
        SELECT id INTO base_currency_id FROM currencies WHERE "isBaseCurrency" = TRUE LIMIT 1;
        
        -- إنشاء رقم تسلسلي لقيد التحويل
        SELECT COALESCE(MAX(CAST(SUBSTRING("entryNumber" FROM 'FX-(\\d+)') AS INTEGER)), 0) + 1
        INTO sequence_num
        FROM journal_entries
        WHERE "entryNumber" LIKE 'FX-%';
        
        entry_number := 'FX-' || LPAD(sequence_num::TEXT, 6, '0');
        entry_id := gen_random_uuid();
        
        -- إنشاء قيد التحويل
        INSERT INTO journal_entries (
          id, "entryNumber", date, description, status, 
          "currencyId", "exchangeRate", "totalDebit", "totalCredit", 
          "baseCurrencyAmount", "postedBy", "createdAt", "updatedAt"
        ) VALUES (
          entry_id, entry_number, conversion_date,
          'تحويل عملة: ' || description || ' (' || from_currency_code || ' → ' || to_currency_code || ')',
          'posted', base_currency_id, 1.0, converted_amount, converted_amount,
          converted_amount, created_by_user, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
        
        -- إضافة تفاصيل القيد
        -- مدين: الحساب الهدف
        INSERT INTO journal_entry_details (
          id, "journalEntryId", "accountId", debit, credit, 
          "originalCurrencyDebit", "originalCurrencyCredit", "exchangeRate", 
          description, "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), entry_id, to_account_id, converted_amount, 0,
          converted_amount, 0, exchange_rate,
          'استلام تحويل عملة - ' || to_currency_code, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
        
        -- دائن: الحساب المصدر
        INSERT INTO journal_entry_details (
          id, "journalEntryId", "accountId", debit, credit,
          "originalCurrencyDebit", "originalCurrencyCredit", "exchangeRate",
          description, "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), entry_id, from_account_id, 0, amount,
          0, amount, 1.0,
          'إرسال تحويل عملة - ' || from_currency_code, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
        
        -- حساب فرق الصرف إذا لزم الأمر
        fx_difference := converted_amount - amount;
        
        IF ABS(fx_difference) > 0.01 THEN
          -- البحث عن حساب فروق الصرف أو إنشاؤه
          SELECT id INTO fx_account_id
          FROM accounts
          WHERE code = '4-9' OR name LIKE '%فروق الصرف%' OR name LIKE '%أرباح وخسائر الصرف%'
          LIMIT 1;
          
          IF fx_account_id IS NULL THEN
            fx_account_id := gen_random_uuid();
            INSERT INTO accounts (
              id, code, name, type, level, balance, "isActive", "currencyId", "createdAt", "updatedAt"
            ) VALUES (
              fx_account_id, '4-9', 'فروق الصرف', 'revenue', 2, 0, TRUE, base_currency_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            );
          END IF;
          
          -- إضافة قيد فرق الصرف
          IF fx_difference > 0 THEN
            -- ربح صرف (دائن)
            INSERT INTO journal_entry_details (
              id, "journalEntryId", "accountId", debit, credit,
              "originalCurrencyDebit", "originalCurrencyCredit", "exchangeRate",
              description, "createdAt", "updatedAt"
            ) VALUES (
              gen_random_uuid(), entry_id, fx_account_id, 0, fx_difference,
              0, fx_difference, 1.0,
              'ربح فرق صرف', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            );
          ELSE
            -- خسارة صرف (مدين)
            INSERT INTO journal_entry_details (
              id, "journalEntryId", "accountId", debit, credit,
              "originalCurrencyDebit", "originalCurrencyCredit", "exchangeRate",
              description, "createdAt", "updatedAt"
            ) VALUES (
              gen_random_uuid(), entry_id, fx_account_id, ABS(fx_difference), 0,
              ABS(fx_difference), 0, 1.0,
              'خسارة فرق صرف', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            );
          END IF;
          
          -- تحديث إجماليات القيد
          UPDATE journal_entries
          SET 
            "totalDebit" = "totalDebit" + ABS(fx_difference),
            "totalCredit" = "totalCredit" + ABS(fx_difference),
            "baseCurrencyAmount" = "baseCurrencyAmount" + ABS(fx_difference)
          WHERE id = entry_id;
        END IF;
        
        RETURN entry_id;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ تم إنشاء دالة قيد تحويل العملة');

    console.log('\n🎉 تم تطبيق نظام العملات المتعددة الصارم بنجاح!');
    
    // عرض ملخص النظام
    console.log('\n📋 ملخص نظام العملات المتعددة:');
    console.log('1. ✅ جدول العملات مع العملة الأساسية');
    console.log('2. ✅ جدول أسعار الصرف اليومية');
    console.log('3. ✅ حقول العملة في جميع الجداول');
    console.log('4. ✅ دالة الحصول على أسعار الصرف');
    console.log('5. ✅ دالة تحويل العملات');
    console.log('6. ✅ دالة قيود تحويل العملة مع فروق الصرف');

  } catch (error) {
    console.error('❌ خطأ في تطبيق نظام العملات المتعددة:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// تشغيل تطبيق نظام العملات المتعددة
applyMultiCurrencySystem()
  .then(() => {
    console.log('\n🎉 انتهى تطبيق نظام العملات المتعددة بنجاح');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 فشل تطبيق نظام العملات المتعددة:', error);
    process.exit(1);
  });
