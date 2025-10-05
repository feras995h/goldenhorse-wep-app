import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { 
  dialect: 'postgres', 
  logging: console.log 
});

/**
 * إصلاح جدول accounting_periods ليطابق Model
 */
async function fixAccountingPeriods() {
  try {
    console.log('🔍 الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بنجاح\n');

    console.log('🗑️  حذف الجدول القديم...');
    await sequelize.query('DROP TABLE IF EXISTS accounting_periods CASCADE;');
    console.log('✅ تم الحذف\n');

    console.log('📋 إنشاء الجدول الجديد...');
    await sequelize.query(`
      CREATE TABLE accounting_periods (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2050),
        month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
        status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'archived')),
        "startDate" DATE NOT NULL,
        "endDate" DATE NOT NULL,
        "closedAt" TIMESTAMP,
        "closedBy" INTEGER REFERENCES users(id),
        "archivedAt" TIMESTAMP,
        "archivedBy" INTEGER REFERENCES users(id),
        notes TEXT,
        "totalTransactions" INTEGER DEFAULT 0,
        "totalDebit" DECIMAL(15,2) DEFAULT 0.00,
        "totalCredit" DECIMAL(15,2) DEFAULT 0.00,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_year_month UNIQUE (year, month)
      );
    `);
    console.log('✅ تم إنشاء الجدول\n');

    console.log('📊 إنشاء indexes...');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_accounting_periods_status ON accounting_periods(status);');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_accounting_periods_dates ON accounting_periods("startDate", "endDate");');
    console.log('✅ تم إنشاء indexes\n');

    console.log('✅ تم إصلاح جدول accounting_periods بنجاح!\n');

    await sequelize.close();
    
  } catch (error) {
    console.error('\n❌ خطأ:', error);
    await sequelize.close();
    process.exit(1);
  }
}

fixAccountingPeriods();
