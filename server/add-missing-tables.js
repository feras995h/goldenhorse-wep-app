import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { 
  dialect: 'postgres', 
  logging: console.log 
});

/**
 * سكريبت لإضافة الجداول المفقودة الأساسية
 */
async function addMissingTables() {
  try {
    console.log('🔍 الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بنجاح\n');

    let createdCount = 0;

    // ==================== Employees ====================
    console.log('📋 إنشاء جدول Employees...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        "nameEn" VARCHAR(255),
        "nationalId" VARCHAR(50),
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        position VARCHAR(100),
        department VARCHAR(100),
        "hireDate" DATE,
        "terminationDate" DATE,
        salary DECIMAL(15,2) DEFAULT 0,
        "isActive" BOOLEAN DEFAULT true,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Employees\n');
    createdCount++;

    // ==================== Settings ====================
    console.log('📋 إنشاء جدول Settings...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Settings\n');
    createdCount++;

    // ==================== Roles ====================
    console.log('📋 إنشاء جدول Roles...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        permissions TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Roles\n');
    createdCount++;

    // ==================== Company Logo ====================
    console.log('📋 إنشاء جدول Company Logo...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS company_logo (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "logoData" BYTEA,
        "mimeType" VARCHAR(50),
        filename VARCHAR(255),
        size INTEGER,
        "uploadedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "isActive" BOOLEAN DEFAULT true
      );
    `);
    console.log('✅ Company Logo\n');
    createdCount++;

    // ==================== GL Entries ====================
    console.log('📋 إنشاء جدول GL Entries...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS gl_entries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "accountId" UUID REFERENCES accounts(id),
        "debitAmount" DECIMAL(15,2) DEFAULT 0,
        "creditAmount" DECIMAL(15,2) DEFAULT 0,
        description TEXT,
        reference VARCHAR(100),
        date DATE NOT NULL,
        "fiscalYear" INTEGER,
        "fiscalPeriod" INTEGER,
        status VARCHAR(50) DEFAULT 'draft',
        "createdBy" INTEGER,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ GL Entries\n');
    createdCount++;

    // ==================== Audit Logs ====================
    console.log('📋 إنشاء جدول Audit Logs...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tableName" VARCHAR(100) NOT NULL,
        "recordId" VARCHAR(255),
        action VARCHAR(50) NOT NULL,
        "userId" INTEGER,
        username VARCHAR(255),
        "ipAddress" VARCHAR(50),
        "oldValues" JSONB,
        "newValues" JSONB,
        metadata JSONB,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Audit Logs\n');
    createdCount++;

    // ==================== Accounting Periods ====================
    console.log('📋 إنشاء جدول Accounting Periods...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS accounting_periods (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        "startDate" DATE NOT NULL,
        "endDate" DATE NOT NULL,
        "fiscalYear" INTEGER NOT NULL,
        "periodNumber" INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'open',
        "isClosed" BOOLEAN DEFAULT false,
        "closedAt" TIMESTAMP,
        "closedBy" INTEGER,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Accounting Periods\n');
    createdCount++;

    // ==================== Employee Advances ====================
    console.log('📋 إنشاء جدول Employee Advances...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS employee_advances (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "employeeId" UUID REFERENCES employees(id),
        amount DECIMAL(15,2) NOT NULL,
        "advanceDate" DATE NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        "repaidAmount" DECIMAL(15,2) DEFAULT 0,
        "balanceAmount" DECIMAL(15,2),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Employee Advances\n');
    createdCount++;

    // ==================== Payroll Entries ====================
    console.log('📋 إنشاء جدول Payroll Entries...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS payroll_entries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "employeeId" UUID REFERENCES employees(id),
        "payrollDate" DATE NOT NULL,
        "basicSalary" DECIMAL(15,2) DEFAULT 0,
        allowances DECIMAL(15,2) DEFAULT 0,
        deductions DECIMAL(15,2) DEFAULT 0,
        "netSalary" DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'draft',
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Payroll Entries\n');
    createdCount++;

    // ==================== Purchase Invoices ====================
    console.log('📋 إنشاء جدول Purchase Invoices...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS purchase_invoices (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "invoiceNumber" VARCHAR(50) UNIQUE NOT NULL,
        "supplierId" UUID REFERENCES suppliers(id),
        date DATE NOT NULL,
        "dueDate" DATE,
        subtotal DECIMAL(15,2) DEFAULT 0,
        "taxAmount" DECIMAL(15,2) DEFAULT 0,
        total DECIMAL(15,2) DEFAULT 0,
        "paidAmount" DECIMAL(15,2) DEFAULT 0,
        "outstandingAmount" DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'draft',
        notes TEXT,
        "createdBy" INTEGER,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Purchase Invoices\n');
    createdCount++;

    // ==================== Purchase Invoice Payments ====================
    console.log('📋 إنشاء جدول Purchase Invoice Payments...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS purchase_invoice_payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "invoiceId" UUID REFERENCES purchase_invoices(id) ON DELETE CASCADE,
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
    console.log('✅ Purchase Invoice Payments\n');
    createdCount++;

    // ==================== Sales Returns ====================
    console.log('📋 إنشاء جدول Sales Returns...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS sales_returns (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "returnNumber" VARCHAR(50) UNIQUE NOT NULL,
        "invoiceId" UUID REFERENCES sales_invoices(id),
        "customerId" UUID REFERENCES customers(id),
        "returnDate" DATE NOT NULL,
        reason TEXT,
        amount DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        "createdBy" INTEGER,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Sales Returns\n');
    createdCount++;

    // ==================== Receipts ====================
    console.log('📋 إنشاء جدول Receipts...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS receipts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "receiptNumber" VARCHAR(50) UNIQUE NOT NULL,
        "customerId" UUID REFERENCES customers(id),
        date DATE NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        "paymentMethod" VARCHAR(50),
        reference VARCHAR(100),
        description TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        "createdBy" INTEGER,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Receipts\n');
    createdCount++;

    // ==================== Payments ====================
    console.log('📋 إنشاء جدول Payments...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "paymentNumber" VARCHAR(50) UNIQUE NOT NULL,
        "supplierId" UUID REFERENCES suppliers(id),
        date DATE NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        "paymentMethod" VARCHAR(50),
        reference VARCHAR(100),
        description TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        "createdBy" INTEGER,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Payments\n');
    createdCount++;

    console.log(`\n✅ تم إضافة ${createdCount} جدول جديد بنجاح!`);
    console.log('\n🎉 قاعدة البيانات محدثة!\n');

    await sequelize.close();
    
  } catch (error) {
    console.error('\n❌ خطأ في إضافة الجداول:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// تشغيل السكريبت
addMissingTables();
