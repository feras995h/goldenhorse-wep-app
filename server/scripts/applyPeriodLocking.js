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

async function applyPeriodLocking() {
  console.log('🔒 بدء تطبيق نظام قفل الفترات المحاسبية...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // 1. إنشاء جدول الفترات المحاسبية
    console.log('\n📅 إنشاء جدول الفترات المحاسبية...');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS accounting_periods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2050),
        month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
        status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','archived')),
        "startDate" DATE NOT NULL,
        "endDate" DATE NOT NULL,
        "closedAt" TIMESTAMP,
        "closedBy" UUID REFERENCES users(id) ON DELETE SET NULL,
        "archivedAt" TIMESTAMP,
        "archivedBy" UUID REFERENCES users(id) ON DELETE SET NULL,
        notes TEXT,
        "totalTransactions" INTEGER DEFAULT 0,
        "totalDebit" DECIMAL(15,2) DEFAULT 0.00,
        "totalCredit" DECIMAL(15,2) DEFAULT 0.00,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(year, month),
        CHECK ("startDate" < "endDate")
      );
    `);
    
    console.log('✅ تم إنشاء جدول الفترات المحاسبية');

    // 2. إنشاء فهارس للأداء
    console.log('\n📊 إنشاء فهارس الأداء...');
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_accounting_periods_status ON accounting_periods(status);
      CREATE INDEX IF NOT EXISTS idx_accounting_periods_dates ON accounting_periods("startDate", "endDate");
      CREATE INDEX IF NOT EXISTS idx_accounting_periods_year_month ON accounting_periods(year, month);
    `);
    
    console.log('✅ تم إنشاء فهارس الأداء');

    // 3. إنشاء الفترة الحالية إذا لم تكن موجودة
    console.log('\n🗓️ إنشاء الفترة الحالية...');
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const [existingPeriod] = await sequelize.query(`
      SELECT * FROM accounting_periods WHERE year = ${currentYear} AND month = ${currentMonth};
    `);
    
    if (existingPeriod.length === 0) {
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0);
      
      await sequelize.query(`
        INSERT INTO accounting_periods (year, month, "startDate", "endDate", status)
        VALUES (${currentYear}, ${currentMonth}, '${startDate.toISOString().split('T')[0]}', '${endDate.toISOString().split('T')[0]}', 'open');
      `);
      
      console.log(`✅ تم إنشاء الفترة الحالية: ${currentYear}/${currentMonth.toString().padStart(2, '0')}`);
    } else {
      console.log(`✅ الفترة الحالية موجودة: ${currentYear}/${currentMonth.toString().padStart(2, '0')}`);
    }

    // 4. إنشاء دالة للتحقق من قفل الفترات
    console.log('\n🔐 إنشاء دالة التحقق من قفل الفترات...');
    
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION check_period_lock()
      RETURNS TRIGGER AS $$
      DECLARE
        period_status VARCHAR(20);
        entry_date DATE;
      BEGIN
        -- تحديد تاريخ القيد
        IF TG_TABLE_NAME = 'journal_entries' THEN
          entry_date := NEW.date;
        ELSIF TG_TABLE_NAME = 'gl_entries' THEN
          entry_date := NEW."postingDate";
        ELSE
          RETURN NEW; -- السماح للجداول الأخرى
        END IF;
        
        -- البحث عن الفترة المحاسبية
        SELECT status INTO period_status
        FROM accounting_periods
        WHERE entry_date >= "startDate" AND entry_date <= "endDate"
        LIMIT 1;
        
        -- التحقق من حالة الفترة
        IF period_status = 'closed' THEN
          RAISE EXCEPTION 'لا يمكن إضافة/تعديل قيود في فترة مقفلة (%). استخدم قيود التسوية في الفترة التالية.', entry_date;
        ELSIF period_status = 'archived' THEN
          RAISE EXCEPTION 'لا يمكن إضافة/تعديل قيود في فترة مؤرشفة (%).', entry_date;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ تم إنشاء دالة التحقق من قفل الفترات');

    // 5. إنشاء triggers لحماية الفترات المقفلة
    console.log('\n🛡️ إنشاء triggers حماية الفترات...');
    
    // حماية القيود اليومية
    await sequelize.query(`
      DROP TRIGGER IF EXISTS protect_closed_periods_journal ON journal_entries;
      CREATE TRIGGER protect_closed_periods_journal
      BEFORE INSERT OR UPDATE ON journal_entries
      FOR EACH ROW
      EXECUTE FUNCTION check_period_lock();
    `);
    
    // حماية قيود دفتر الأستاذ
    await sequelize.query(`
      DROP TRIGGER IF EXISTS protect_closed_periods_gl ON gl_entries;
      CREATE TRIGGER protect_closed_periods_gl
      BEFORE INSERT OR UPDATE ON gl_entries
      FOR EACH ROW
      EXECUTE FUNCTION check_period_lock();
    `);
    
    console.log('✅ تم إنشاء triggers حماية الفترات');

    // 6. إنشاء دالة لإقفال الفترات تلقائياً
    console.log('\n🔄 إنشاء دالة الإقفال التلقائي...');
    
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION auto_close_previous_periods()
      RETURNS VOID AS $$
      DECLARE
        current_year INTEGER;
        current_month INTEGER;
      BEGIN
        -- الحصول على السنة والشهر الحاليين
        SELECT EXTRACT(YEAR FROM CURRENT_DATE), EXTRACT(MONTH FROM CURRENT_DATE)
        INTO current_year, current_month;
        
        -- إقفال جميع الفترات السابقة المفتوحة
        UPDATE accounting_periods
        SET 
          status = 'closed',
          "closedAt" = CURRENT_TIMESTAMP
        WHERE status = 'open'
          AND (year < current_year OR (year = current_year AND month < current_month));
        
        -- إنشاء الفترة الحالية إذا لم تكن موجودة
        INSERT INTO accounting_periods (year, month, "startDate", "endDate", status)
        SELECT 
          current_year,
          current_month,
          DATE(current_year || '-' || LPAD(current_month::TEXT, 2, '0') || '-01'),
          (DATE(current_year || '-' || LPAD(current_month::TEXT, 2, '0') || '-01') + INTERVAL '1 month - 1 day')::DATE,
          'open'
        WHERE NOT EXISTS (
          SELECT 1 FROM accounting_periods 
          WHERE year = current_year AND month = current_month
        );
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ تم إنشاء دالة الإقفال التلقائي');

    // 7. إنشاء دالة لحساب إحصائيات الفترة
    console.log('\n📈 إنشاء دالة حساب الإحصائيات...');
    
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION update_period_statistics(period_year INTEGER, period_month INTEGER)
      RETURNS VOID AS $$
      DECLARE
        start_date DATE;
        end_date DATE;
        total_trans INTEGER;
        total_deb DECIMAL(15,2);
        total_cred DECIMAL(15,2);
      BEGIN
        -- الحصول على تواريخ الفترة
        SELECT "startDate", "endDate" INTO start_date, end_date
        FROM accounting_periods
        WHERE year = period_year AND month = period_month;
        
        -- حساب الإحصائيات من القيود اليومية
        SELECT 
          COUNT(*),
          COALESCE(SUM("totalDebit"), 0),
          COALESCE(SUM("totalCredit"), 0)
        INTO total_trans, total_deb, total_cred
        FROM journal_entries
        WHERE date >= start_date AND date <= end_date
          AND status = 'posted';
        
        -- تحديث الإحصائيات
        UPDATE accounting_periods
        SET 
          "totalTransactions" = total_trans,
          "totalDebit" = total_deb,
          "totalCredit" = total_cred,
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE year = period_year AND month = period_month;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ تم إنشاء دالة حساب الإحصائيات');

    // 8. اختبار النظام
    console.log('\n🧪 اختبار نظام قفل الفترات...');
    
    // إنشاء فترة اختبار مقفلة
    const testYear = 2024;
    const testMonth = 1;
    
    await sequelize.query(`
      INSERT INTO accounting_periods (year, month, "startDate", "endDate", status)
      VALUES (${testYear}, ${testMonth}, '2024-01-01', '2024-01-31', 'closed')
      ON CONFLICT (year, month) DO UPDATE SET status = 'closed';
    `);
    
    // محاولة إدخال قيد في فترة مقفلة
    try {
      await sequelize.query(`
        INSERT INTO journal_entries (id, "entryNumber", date, "totalDebit", "totalCredit", status)
        VALUES (gen_random_uuid(), 'TEST-LOCKED-PERIOD', '2024-01-15', 100.00, 100.00, 'draft');
      `);
      console.log('❌ فشل: تم قبول قيد في فترة مقفلة!');
    } catch (error) {
      console.log('✅ نجح: تم رفض القيد في الفترة المقفلة');
    }

    // تنظيف الاختبار
    await sequelize.query(`
      DELETE FROM journal_entries WHERE "entryNumber" = 'TEST-LOCKED-PERIOD';
    `);

    console.log('\n🎉 تم تطبيق نظام قفل الفترات المحاسبية بنجاح!');
    
    // عرض ملخص النظام
    console.log('\n📋 ملخص نظام قفل الفترات:');
    console.log('1. ✅ جدول الفترات المحاسبية مع حالات (open/closed/archived)');
    console.log('2. ✅ حماية تلقائية من التعديل في الفترات المقفلة');
    console.log('3. ✅ دالة الإقفال التلقائي للفترات السابقة');
    console.log('4. ✅ حساب إحصائيات الفترات تلقائياً');
    console.log('5. ✅ فهارس محسنة للأداء');

  } catch (error) {
    console.error('❌ خطأ في تطبيق نظام قفل الفترات:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// تشغيل تطبيق نظام قفل الفترات
applyPeriodLocking()
  .then(() => {
    console.log('\n🎉 انتهى تطبيق نظام قفل الفترات بنجاح');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 فشل تطبيق نظام قفل الفترات:', error);
    process.exit(1);
  });
