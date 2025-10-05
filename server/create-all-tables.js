import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { 
  dialect: 'postgres', 
  logging: false 
});

/**
 * سكريبت شامل لإنشاء جميع جداول قاعدة البيانات
 * يحتوي على جميع الجداول المطلوبة للنظام
 */
async function createAllTables() {
  try {
    console.log('🔍 الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بنجاح\n');

    console.log('🏗️  بدء إنشاء جميع الجداول...\n');

    // تفعيل UUID extension
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    console.log('✅ تم تفعيل UUID extension\n');

    let createdCount = 0;

    // ==================== 1. Users ====================
    console.log('📋 إنشاء جدول Users...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        "isActive" BOOLEAN DEFAULT true,
        "lastLogin" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Users\n');
    createdCount++;

    // ==================== 2. Customers ====================
    console.log('📋 إنشاء جدول Customers...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        "nameEn" VARCHAR(255),
        type VARCHAR(50),
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        city VARCHAR(100),
        country VARCHAR(100) DEFAULT 'Libya',
        "taxNumber" VARCHAR(100),
        "creditLimit" DECIMAL(15,2) DEFAULT 0,
        balance DECIMAL(15,2) DEFAULT 0,
        "isActive" BOOLEAN DEFAULT true,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Customers\n');
    createdCount++;

    // ==================== 3. Suppliers ====================
    console.log('📋 إنشاء جدول Suppliers...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        "nameEn" VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        city VARCHAR(100),
        country VARCHAR(100) DEFAULT 'China',
        "taxNumber" VARCHAR(100),
        balance DECIMAL(15,2) DEFAULT 0,
        "isActive" BOOLEAN DEFAULT true,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Suppliers\n');
    createdCount++;

    // ==================== 4. Accounts (دليل الحسابات) ====================
    console.log('📋 إنشاء جدول Accounts...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        "nameEn" VARCHAR(255),
        type VARCHAR(50) NOT NULL,
        "rootType" VARCHAR(50),
        "reportType" VARCHAR(50),
        "parentId" UUID REFERENCES accounts(id),
        level INTEGER DEFAULT 1,
        "isGroup" BOOLEAN DEFAULT false,
        "isActive" BOOLEAN DEFAULT true,
        balance DECIMAL(15,2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'LYD',
        nature VARCHAR(20),
        description TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Accounts\n');
    createdCount++;

    // ==================== 5. Account Mappings ====================
    console.log('📋 إنشاء جدول Account Mappings...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS account_mappings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "salesRevenueAccount" UUID REFERENCES accounts(id),
        "accountsReceivableAccount" UUID REFERENCES accounts(id),
        "salesTaxAccount" UUID REFERENCES accounts(id),
        "discountAccount" UUID REFERENCES accounts(id),
        "shippingRevenueAccount" UUID REFERENCES accounts(id),
        "customsClearanceAccount" UUID REFERENCES accounts(id),
        "storageAccount" UUID REFERENCES accounts(id),
        "insuranceAccount" UUID REFERENCES accounts(id),
        "isActive" BOOLEAN DEFAULT true,
        description TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Account Mappings\n');
    createdCount++;

    // ==================== 6. Sales Invoices ====================
    console.log('📋 إنشاء جدول Sales Invoices...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS sales_invoices (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "invoiceNumber" VARCHAR(50) UNIQUE NOT NULL,
        "customerId" UUID REFERENCES customers(id) NOT NULL,
        date DATE NOT NULL,
        "dueDate" DATE NOT NULL,
        subtotal DECIMAL(15,2) DEFAULT 0,
        "discountAmount" DECIMAL(15,2) DEFAULT 0,
        "taxAmount" DECIMAL(15,2) DEFAULT 0,
        total DECIMAL(15,2) DEFAULT 0,
        "paidAmount" DECIMAL(15,2) DEFAULT 0,
        "outstandingAmount" DECIMAL(15,2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'LYD',
        "exchangeRate" DECIMAL(10,4) DEFAULT 1.0000,
        status VARCHAR(50) DEFAULT 'draft',
        "paymentStatus" VARCHAR(50) DEFAULT 'unpaid',
        "paymentMethod" VARCHAR(50),
        notes TEXT,
        "invoiceDate" DATE,
        "totalAmount" DECIMAL(15,2),
        "postedStatus" VARCHAR(50),
        "posted_at" TIMESTAMP,
        "posted_by" UUID,
        "document_no" VARCHAR(50),
        "fiscalYear" INTEGER,
        "salesPerson" VARCHAR(255),
        "isActive" BOOLEAN DEFAULT true,
        "createdBy" UUID NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Sales Invoices\n');
    createdCount++;

    // ==================== 7. Sales Invoice Items ====================
    console.log('📋 إنشاء جدول Sales Invoice Items...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS sales_invoice_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "invoiceId" UUID REFERENCES sales_invoices(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        quantity DECIMAL(15,3) NOT NULL,
        "unitPrice" DECIMAL(15,2) NOT NULL,
        "discountPercent" DECIMAL(5,2) DEFAULT 0,
        "discountAmount" DECIMAL(15,2) DEFAULT 0,
        "taxPercent" DECIMAL(5,2) DEFAULT 0,
        "taxAmount" DECIMAL(15,2) DEFAULT 0,
        total DECIMAL(15,2) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Sales Invoice Items\n');
    createdCount++;

    // ==================== 8. Shipments ====================
    console.log('📋 إنشاء جدول Shipments...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "trackingNumber" VARCHAR(100) UNIQUE NOT NULL,
        "customerId" UUID REFERENCES customers(id),
        "supplierId" UUID REFERENCES suppliers(id),
        origin VARCHAR(255),
        destination VARCHAR(255),
        "departureDate" DATE,
        "arrivalDate" DATE,
        "estimatedArrival" DATE,
        status VARCHAR(50) DEFAULT 'pending',
        "shippingMethod" VARCHAR(50),
        "containerNumber" VARCHAR(100),
        weight DECIMAL(15,3),
        volume DECIMAL(15,3),
        "itemDescription" TEXT,
        "declaredValue" DECIMAL(15,2),
        "insuranceValue" DECIMAL(15,2),
        "customsStatus" VARCHAR(50),
        "customsClearanceDate" DATE,
        notes TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "createdBy" INTEGER,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Shipments\n');
    createdCount++;

    // ==================== 9. Shipping Invoices ====================
    console.log('📋 إنشاء جدول Shipping Invoices...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS shipping_invoices (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        date DATE NOT NULL,
        customer_id UUID REFERENCES customers(id),
        total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        status VARCHAR(50),
        notes TEXT,
        is_active BOOLEAN DEFAULT true,
        shipment_id UUID REFERENCES shipments(id),
        outstanding_amount DECIMAL(15,2) DEFAULT 0,
        paid_amount DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Shipping Invoices\n');
    createdCount++;

    // ==================== 10. Receipt Vouchers ====================
    console.log('📋 إنشاء جدول Receipt Vouchers...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS receipt_vouchers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "voucherNumber" VARCHAR(50) UNIQUE NOT NULL,
        date DATE NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        "paymentMethod" VARCHAR(50),
        description TEXT,
        "customerId" UUID REFERENCES customers(id),
        "accountId" UUID REFERENCES accounts(id),
        "createdBy" INTEGER,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Receipt Vouchers\n');
    createdCount++;

    // ==================== 11. Payment Vouchers ====================
    console.log('📋 إنشاء جدول Payment Vouchers...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS payment_vouchers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "voucherNumber" VARCHAR(50) UNIQUE NOT NULL,
        date DATE NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        "paymentMethod" VARCHAR(50),
        description TEXT,
        "supplierId" UUID REFERENCES suppliers(id),
        "accountId" UUID REFERENCES accounts(id),
        "createdBy" INTEGER,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Payment Vouchers\n');
    createdCount++;

    // ==================== 12. GL Journals ====================
    console.log('📋 إنشاء جدول GL Journals...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS gl_journals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        journal_no VARCHAR(50) UNIQUE NOT NULL,
        journal_date DATE NOT NULL,
        description TEXT,
        reference VARCHAR(100),
        status VARCHAR(50) DEFAULT 'draft',
        posted_at TIMESTAMP,
        posted_by INTEGER,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ GL Journals\n');
    createdCount++;

    // ==================== 13. Posting Journal Entries ====================
    console.log('📋 إنشاء جدول Posting Journal Entries...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS posting_journal_entries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        journal_id UUID REFERENCES gl_journals(id) ON DELETE CASCADE,
        account_id UUID REFERENCES accounts(id) NOT NULL,
        debit_amount DECIMAL(15,2) DEFAULT 0,
        credit_amount DECIMAL(15,2) DEFAULT 0,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Posting Journal Entries\n');
    createdCount++;

    // ==================== 14. Journal Entries ====================
    console.log('📋 إنشاء جدول Journal Entries...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "entryNumber" VARCHAR(50) UNIQUE NOT NULL,
        date DATE NOT NULL,
        description TEXT,
        reference VARCHAR(100),
        "sourceType" VARCHAR(50),
        "sourceId" UUID,
        status VARCHAR(50) DEFAULT 'draft',
        "postedAt" TIMESTAMP,
        "postedBy" INTEGER,
        "createdBy" INTEGER NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Journal Entries\n');
    createdCount++;

    // ==================== 15. Journal Entry Details ====================
    console.log('📋 إنشاء جدول Journal Entry Details...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS journal_entry_details (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "journalEntryId" UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
        "accountId" UUID REFERENCES accounts(id) NOT NULL,
        "debitAmount" DECIMAL(15,2) DEFAULT 0,
        "creditAmount" DECIMAL(15,2) DEFAULT 0,
        description TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Journal Entry Details\n');
    createdCount++;

    // ==================== 16. Notifications ====================
    console.log('📋 إنشاء جدول Notifications...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" INTEGER,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        "isRead" BOOLEAN DEFAULT false,
        "relatedEntity" VARCHAR(50),
        "relatedId" UUID,
        priority VARCHAR(20) DEFAULT 'normal',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Notifications\n');
    createdCount++;

    // ==================== 17. Fixed Assets ====================
    console.log('📋 إنشاء جدول Fixed Assets...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS fixed_assets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        "purchaseDate" DATE,
        "purchaseCost" DECIMAL(15,2) NOT NULL,
        "salvageValue" DECIMAL(15,2) DEFAULT 0,
        "usefulLife" INTEGER,
        "depreciationMethod" VARCHAR(50) DEFAULT 'straight-line',
        "accumulatedDepreciation" DECIMAL(15,2) DEFAULT 0,
        "bookValue" DECIMAL(15,2),
        status VARCHAR(50) DEFAULT 'active',
        location VARCHAR(255),
        notes TEXT,
        "assetAccountId" UUID REFERENCES accounts(id),
        "depreciationAccountId" UUID REFERENCES accounts(id),
        "accumulatedDepreciationAccountId" UUID REFERENCES accounts(id),
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Fixed Assets\n');
    createdCount++;

    // ==================== 18. Depreciation Entries ====================
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

    // ==================== 19. Invoice Payments ====================
    console.log('📋 إنشاء جدول Invoice Payments...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS invoice_payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "invoiceId" UUID REFERENCES sales_invoices(id) ON DELETE CASCADE,
        "paymentDate" DATE NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        "paymentMethod" VARCHAR(50),
        reference VARCHAR(100),
        notes TEXT,
        "createdBy" INTEGER,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Invoice Payments\n');
    createdCount++;

    // ==================== 20. Invoice Receipts ====================
    console.log('📋 إنشاء جدول Invoice Receipts...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS invoice_receipts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "invoiceId" UUID REFERENCES sales_invoices(id) ON DELETE CASCADE,
        "receiptDate" DATE NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        "paymentMethod" VARCHAR(50),
        reference VARCHAR(100),
        notes TEXT,
        "createdBy" INTEGER,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Invoice Receipts\n');
    createdCount++;

    // ==================== 21. Account Provisions ====================
    console.log('📋 إنشاء جدول Account Provisions...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS account_provisions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "accountId" UUID REFERENCES accounts(id) NOT NULL,
        "provisionType" VARCHAR(50) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        date DATE NOT NULL,
        description TEXT,
        "journalEntryId" UUID REFERENCES journal_entries(id),
        status VARCHAR(50) DEFAULT 'active',
        "createdBy" INTEGER,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Account Provisions\n');
    createdCount++;

    // ==================== 22. Shipment Movements ====================
    console.log('📋 إنشاء جدول Shipment Movements...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS shipment_movements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "shipmentId" UUID REFERENCES shipments(id) ON DELETE CASCADE,
        "movementDate" TIMESTAMP NOT NULL,
        location VARCHAR(255),
        status VARCHAR(50),
        description TEXT,
        "updatedBy" INTEGER,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Shipment Movements\n');
    createdCount++;

    // ==================== إنشاء Indexes ====================
    console.log('\n📊 إنشاء Indexes للأداء...\n');

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer ON sales_invoices("customerId");',
      'CREATE INDEX IF NOT EXISTS idx_sales_invoices_date ON sales_invoices(date);',
      'CREATE INDEX IF NOT EXISTS idx_sales_invoices_status ON sales_invoices(status);',
      'CREATE INDEX IF NOT EXISTS idx_shipments_customer ON shipments("customerId");',
      'CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);',
      'CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments("trackingNumber");',
      'CREATE INDEX IF NOT EXISTS idx_accounts_code ON accounts(code);',
      'CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);',
      'CREATE INDEX IF NOT EXISTS idx_accounts_parent ON accounts("parentId");',
      'CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date);',
      'CREATE INDEX IF NOT EXISTS idx_journal_entries_source ON journal_entries("sourceType", "sourceId");',
      'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications("userId");',
      'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications("isRead");'
    ];

    for (const indexQuery of indexes) {
      await sequelize.query(indexQuery);
    }
    console.log(`✅ تم إنشاء ${indexes.length} index\n`);

    console.log('='.repeat(60));
    console.log(`\n✅ اكتمل إنشاء ${createdCount} جدول بنجاح!`);
    console.log(`✅ تم إنشاء ${indexes.length} index للأداء`);
    console.log('\n🎉 قاعدة البيانات جاهزة للاستخدام!\n');

    await sequelize.close();
    
  } catch (error) {
    console.error('\n❌ خطأ في إنشاء الجداول:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// تشغيل السكريبت
createAllTables();
