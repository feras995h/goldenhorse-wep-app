import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { 
  dialect: 'postgres', 
  logging: console.log 
});

/**
 * سكريبت لإنشاء الجداول المتبقية
 */
async function addRemainingTables() {
  try {
    console.log('🔍 الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بنجاح\n');

    let createdCount = 0;

    // ==================== Warehouse ====================
    console.log('📋 إنشاء جدول Warehouse...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS warehouse (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        capacity DECIMAL(15,2),
        "currentStock" DECIMAL(15,2) DEFAULT 0,
        manager VARCHAR(255),
        phone VARCHAR(50),
        "isActive" BOOLEAN DEFAULT true,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Warehouse\n');
    createdCount++;

    // ==================== Stock Movements ====================
    console.log('📋 إنشاء جدول Stock Movements...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "warehouseId" UUID REFERENCES warehouse(id),
        "movementType" VARCHAR(50) NOT NULL,
        "movementDate" DATE NOT NULL,
        quantity DECIMAL(15,3) NOT NULL,
        "itemDescription" TEXT,
        reference VARCHAR(100),
        notes TEXT,
        "createdBy" INTEGER,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Stock Movements\n');
    createdCount++;

    // ==================== Warehouse Release Orders ====================
    console.log('📋 إنشاء جدول Warehouse Release Orders...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS warehouse_release_orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "orderNumber" VARCHAR(50) UNIQUE NOT NULL,
        "warehouseId" UUID REFERENCES warehouse(id),
        "customerId" UUID REFERENCES customers(id),
        "releaseDate" DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        "totalItems" INTEGER DEFAULT 0,
        notes TEXT,
        "approvedBy" INTEGER,
        "approvedAt" TIMESTAMP,
        "executedBy" INTEGER,
        "executedAt" TIMESTAMP,
        "createdBy" INTEGER,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Warehouse Release Orders\n');
    createdCount++;

    // ==================== Invoices (Generic) ====================
    console.log('📋 إنشاء جدول Invoices (Generic)...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "invoiceNumber" VARCHAR(50) UNIQUE NOT NULL,
        "invoiceType" VARCHAR(50) NOT NULL,
        "customerId" UUID REFERENCES customers(id),
        "supplierId" UUID REFERENCES suppliers(id),
        date DATE NOT NULL,
        "dueDate" DATE,
        subtotal DECIMAL(15,2) DEFAULT 0,
        "taxAmount" DECIMAL(15,2) DEFAULT 0,
        total DECIMAL(15,2) DEFAULT 0,
        "paidAmount" DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'draft',
        notes TEXT,
        "createdBy" INTEGER,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Invoices (Generic)\n');
    createdCount++;

    // ==================== Sales Invoice Payments (المدفوعات المخصصة) ====================
    console.log('📋 إنشاء جدول Sales Invoice Payments...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS sales_invoice_payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "invoiceId" UUID REFERENCES sales_invoices(id) ON DELETE CASCADE,
        "paymentDate" DATE NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        "paymentMethod" VARCHAR(50),
        reference VARCHAR(100),
        notes TEXT,
        "isReversed" BOOLEAN DEFAULT false,
        "reversedAt" TIMESTAMP,
        "reversedBy" INTEGER,
        "reverseReason" TEXT,
        "createdBy" INTEGER,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Sales Invoice Payments\n');
    createdCount++;

    // ==================== Depreciation Entries (إذا لم يكن موجوداً) ====================
    console.log('📋 إنشاء جدول Depreciation Entries...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS depreciation_entries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "assetId" UUID REFERENCES fixed_assets(id) ON DELETE CASCADE,
        "journalEntryId" UUID REFERENCES journal_entries(id),
        date DATE NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        "periodStart" DATE,
        "periodEnd" DATE,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Depreciation Entries\n');
    createdCount++;

    console.log(`\n✅ تم إضافة ${createdCount} جدول جديد بنجاح!`);
    console.log('\n🎉 جميع الجداول المطلوبة تم إنشاؤها!\n');

    // عرض إحصائيات نهائية
    const [tables] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name NOT LIKE 'pg_%'
      AND table_name != 'SequelizeMeta';
    `);

    console.log('📊 إحصائيات قاعدة البيانات:');
    console.log(`   - إجمالي الجداول: ${tables[0].count}`);
    console.log('\n✅ قاعدة البيانات جاهزة 100%!\n');

    await sequelize.close();
    
  } catch (error) {
    console.error('\n❌ خطأ في إنشاء الجداول:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// تشغيل السكريبت
addRemainingTables();
