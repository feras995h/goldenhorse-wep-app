import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { 
  dialect: 'postgres', 
  logging: console.log 
});

/**
 * سكريبت لتحديث جدول sales_invoices بالأعمدة المفقودة
 */
async function updateSalesInvoices() {
  try {
    console.log('🔍 الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بنجاح\n');

    console.log('📋 تحديث جدول sales_invoices...\n');

    // إضافة salesPerson
    try {
      await sequelize.query(`
        ALTER TABLE sales_invoices 
        ADD COLUMN IF NOT EXISTS "salesPerson" VARCHAR(255);
      `);
      console.log('✅ تم إضافة عمود salesPerson');
    } catch (error) {
      console.log('⚠️  عمود salesPerson موجود بالفعل أو حدث خطأ:', error.message);
    }

    // إضافة discountPercent
    try {
      await sequelize.query(`
        ALTER TABLE sales_invoices 
        ADD COLUMN IF NOT EXISTS "discountPercent" DECIMAL(5,2) DEFAULT 0;
      `);
      console.log('✅ تم إضافة عمود discountPercent');
    } catch (error) {
      console.log('⚠️  عمود discountPercent موجود بالفعل أو حدث خطأ:', error.message);
    }

    // إضافة taxPercent
    try {
      await sequelize.query(`
        ALTER TABLE sales_invoices 
        ADD COLUMN IF NOT EXISTS "taxPercent" DECIMAL(5,2) DEFAULT 0;
      `);
      console.log('✅ تم إضافة عمود taxPercent');
    } catch (error) {
      console.log('⚠️  عمود taxPercent موجود بالفعل أو حدث خطأ:', error.message);
    }

    console.log('\n✅ تم تحديث جدول sales_invoices بنجاح!');

    await sequelize.close();
    
  } catch (error) {
    console.error('\n❌ خطأ في التحديث:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// تشغيل السكريبت
updateSalesInvoices();
