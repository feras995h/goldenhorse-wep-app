import { Sequelize } from 'sequelize';

async function createNewTables() {
  console.log('🔧 إنشاء الجداول الجديدة...');

  const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping', {
    dialect: 'postgres',
    logging: false
  });

  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // Create suppliers table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        "nameEn" VARCHAR(200),
        "contactPerson" VARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(100),
        address TEXT,
        city VARCHAR(100),
        country VARCHAR(100),
        "taxNumber" VARCHAR(50),
        "creditLimit" DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
        "paymentTerms" INTEGER DEFAULT 30 NOT NULL,
        currency VARCHAR(10) DEFAULT 'LYD' NOT NULL CHECK (currency IN ('LYD', 'USD', 'EUR', 'CNY')),
        "isActive" BOOLEAN DEFAULT true NOT NULL,
        notes TEXT,
        "createdBy" UUID NOT NULL REFERENCES users(id),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ تم إنشاء جدول suppliers');

    // Create receipt_vouchers table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS receipt_vouchers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "voucherNumber" VARCHAR(50) UNIQUE NOT NULL,
        date DATE NOT NULL,
        "customerId" UUID REFERENCES customers(id),
        "customerName" VARCHAR(200) NOT NULL,
        "shipmentId" UUID REFERENCES shipments(id),
        "paymentMethod" VARCHAR(20) DEFAULT 'cash' NOT NULL CHECK ("paymentMethod" IN ('cash', 'bank_transfer', 'check', 'credit_card', 'other')),
        currency VARCHAR(10) DEFAULT 'LYD' NOT NULL CHECK (currency IN ('LYD', 'USD', 'EUR', 'CNY')),
        amount DECIMAL(15,2) NOT NULL,
        purpose VARCHAR(20) DEFAULT 'invoice_payment' NOT NULL CHECK (purpose IN ('invoice_payment', 'advance_payment', 'settlement', 'refund', 'other')),
        "purposeDescription" VARCHAR(500),
        "debitAccountId" UUID NOT NULL REFERENCES accounts(id),
        "creditAccountId" UUID NOT NULL REFERENCES accounts(id),
        "exchangeRate" DECIMAL(10,4) DEFAULT 1.0000 NOT NULL,
        notes TEXT,
        attachments JSON DEFAULT '[]',
        status VARCHAR(20) DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'posted', 'cancelled')),
        "createdBy" UUID NOT NULL REFERENCES users(id),
        "approvedBy" UUID REFERENCES users(id),
        "approvedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ تم إنشاء جدول receipt_vouchers');

    // Create payment_vouchers table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS payment_vouchers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "voucherNumber" VARCHAR(50) UNIQUE NOT NULL,
        date DATE NOT NULL,
        "beneficiaryId" UUID REFERENCES suppliers(id),
        "beneficiaryName" VARCHAR(200) NOT NULL,
        purpose VARCHAR(20) DEFAULT 'invoice_payment' NOT NULL CHECK (purpose IN ('invoice_payment', 'operating_expenses', 'shipping_costs', 'salary', 'rent', 'utilities', 'other')),
        "purposeDescription" VARCHAR(500),
        "paymentMethod" VARCHAR(20) DEFAULT 'cash' NOT NULL CHECK ("paymentMethod" IN ('cash', 'bank_transfer', 'check', 'credit_card', 'other')),
        currency VARCHAR(10) DEFAULT 'LYD' NOT NULL CHECK (currency IN ('LYD', 'USD', 'EUR', 'CNY')),
        amount DECIMAL(15,2) NOT NULL,
        "debitAccountId" UUID NOT NULL REFERENCES accounts(id),
        "creditAccountId" UUID NOT NULL REFERENCES accounts(id),
        "exchangeRate" DECIMAL(10,4) DEFAULT 1.0000 NOT NULL,
        notes TEXT,
        attachments JSON DEFAULT '[]',
        status VARCHAR(20) DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'posted', 'cancelled')),
        "createdBy" UUID NOT NULL REFERENCES users(id),
        "approvedBy" UUID REFERENCES users(id),
        "approvedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ تم إنشاء جدول payment_vouchers');

    // Create purchase_invoices table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS purchase_invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "invoiceNumber" VARCHAR(50) UNIQUE NOT NULL,
        date DATE NOT NULL,
        "dueDate" DATE NOT NULL,
        "supplierId" UUID NOT NULL REFERENCES suppliers(id),
        "shipmentId" UUID REFERENCES shipments(id),
        "serviceDescription" TEXT NOT NULL,
        "serviceDescriptionEn" TEXT,
        quantity DECIMAL(10,3) DEFAULT 1.000 NOT NULL,
        "unitPrice" DECIMAL(15,2) NOT NULL,
        subtotal DECIMAL(15,2) NOT NULL,
        "taxAmount" DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
        total DECIMAL(15,2) NOT NULL,
        "paidAmount" DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
        outstandingamount DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
        currency VARCHAR(10) DEFAULT 'LYD' NOT NULL CHECK (currency IN ('LYD', 'USD', 'EUR', 'CNY')),
        "exchangeRate" DECIMAL(10,4) DEFAULT 1.0000 NOT NULL,
        status VARCHAR(20) DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
        "paymentStatus" VARCHAR(20) DEFAULT 'unpaid' NOT NULL CHECK ("paymentStatus" IN ('unpaid', 'partial', 'paid', 'overdue')),
        "debitAccountId" UUID NOT NULL REFERENCES accounts(id),
        "creditAccountId" UUID NOT NULL REFERENCES accounts(id),
        notes TEXT,
        attachments JSON DEFAULT '[]',
        "createdBy" UUID NOT NULL REFERENCES users(id),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ تم إنشاء جدول purchase_invoices');

    // Create warehouse table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS warehouse (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "internalShipmentNumber" VARCHAR(50) UNIQUE NOT NULL,
        "trackingNumber" VARCHAR(50) UNIQUE,
        "customerId" UUID NOT NULL REFERENCES customers(id),
        "supplierId" UUID REFERENCES suppliers(id),
        "originCountry" VARCHAR(100) DEFAULT 'China' NOT NULL,
        "destinationCountry" VARCHAR(100) DEFAULT 'Libya' NOT NULL,
        weight DECIMAL(10,3) NOT NULL,
        volume DECIMAL(15,3),
        "cargoType" VARCHAR(200) NOT NULL,
        "arrivalDate" DATE,
        "departureDate" DATE,
        "storageLocation" VARCHAR(200),
        status VARCHAR(20) DEFAULT 'stored' NOT NULL CHECK (status IN ('stored', 'shipped', 'delivered', 'returned')),
        "salesInvoiceId" UUID REFERENCES sales_invoices(id),
        "purchaseInvoiceId" UUID REFERENCES purchase_invoices(id),
        notes TEXT,
        "createdBy" UUID NOT NULL REFERENCES users(id),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ تم إنشاء جدول warehouse');

    // Add new columns to sales_invoices table
    const salesInvoicesColumns = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sales_invoices'
    `);

    const existingColumns = salesInvoicesColumns[0].map(col => col.column_name);

    if (!existingColumns.includes('serviceDescription')) {
      await sequelize.query(`
        ALTER TABLE sales_invoices ADD COLUMN "serviceDescription" TEXT
      `);
      console.log('✅ تم إضافة serviceDescription إلى sales_invoices');
    }

    if (!existingColumns.includes('serviceDescriptionEn')) {
      await sequelize.query(`
        ALTER TABLE sales_invoices ADD COLUMN "serviceDescriptionEn" TEXT
      `);
      console.log('✅ تم إضافة serviceDescriptionEn إلى sales_invoices');
    }

    if (!existingColumns.includes('shipmentNumbers')) {
      await sequelize.query(`
        ALTER TABLE sales_invoices ADD COLUMN "shipmentNumbers" JSON DEFAULT '[]'
      `);
      console.log('✅ تم إضافة shipmentNumbers إلى sales_invoices');
    }

    if (!existingColumns.includes('serviceType')) {
      await sequelize.query(`
        ALTER TABLE sales_invoices ADD COLUMN "serviceType" VARCHAR(20) DEFAULT 'sea_freight' 
        CHECK ("serviceType" IN ('sea_freight', 'air_freight', 'land_freight', 'express', 'other'))
      `);
      console.log('✅ تم إضافة serviceType إلى sales_invoices');
    }

    if (!existingColumns.includes('weight')) {
      await sequelize.query(`
        ALTER TABLE sales_invoices ADD COLUMN weight DECIMAL(10,3)
      `);
      console.log('✅ تم إضافة weight إلى sales_invoices');
    }

    if (!existingColumns.includes('volume')) {
      await sequelize.query(`
        ALTER TABLE sales_invoices ADD COLUMN volume DECIMAL(15,3)
      `);
      console.log('✅ تم إضافة volume إلى sales_invoices');
    }

    if (!existingColumns.includes('cbm')) {
      await sequelize.query(`
        ALTER TABLE sales_invoices ADD COLUMN cbm DECIMAL(15,3)
      `);
      console.log('✅ تم إضافة cbm إلى sales_invoices');
    }

    // Create indexes for better performance
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(code)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers("isActive")
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_receipt_vouchers_number ON receipt_vouchers("voucherNumber")
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_receipt_vouchers_date ON receipt_vouchers(date)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_receipt_vouchers_customer ON receipt_vouchers("customerId")
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_vouchers_number ON payment_vouchers("voucherNumber")
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_vouchers_date ON payment_vouchers(date)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_vouchers_beneficiary ON payment_vouchers("beneficiaryId")
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_purchase_invoices_number ON purchase_invoices("invoiceNumber")
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_purchase_invoices_date ON purchase_invoices(date)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier ON purchase_invoices("supplierId")
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_purchase_invoices_outstanding ON purchase_invoices(outstandingamount)
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_warehouse_internal_number ON warehouse("internalShipmentNumber")
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_warehouse_tracking ON warehouse("trackingNumber")
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_warehouse_customer ON warehouse("customerId")
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_warehouse_status ON warehouse(status)
    `);

    console.log('🎉 تم إنشاء جميع الجداول والأعمدة الجديدة بنجاح!');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await sequelize.close();
  }
}

createNewTables();
