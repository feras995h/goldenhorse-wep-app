-- ===================================================================
-- إصلاحات قاعدة البيانات - Golden Horse Shipping
-- التاريخ: 2025-10-05
-- ===================================================================

-- إنشاء جدول SequelizeMeta إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
    name VARCHAR(255) NOT NULL PRIMARY KEY
);

-- ===================================================================
-- الجزء 1: إنشاء الجداول المفقودة (9 جداول)
-- ===================================================================

-- 1. جدول accounting_periods
CREATE TABLE IF NOT EXISTS accounting_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    "startDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'open' NOT NULL,
    "isCurrent" BOOLEAN DEFAULT false,
    "closedAt" TIMESTAMP,
    "closedBy" UUID REFERENCES users(id),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. جدول audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    "entityType" VARCHAR(255) NOT NULL,
    "entityId" VARCHAR(255),
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" VARCHAR(255),
    "userAgent" TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. جدول company_logo
CREATE TABLE IF NOT EXISTS company_logo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(255) NOT NULL,
    size INTEGER NOT NULL,
    path VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "uploadedBy" UUID REFERENCES users(id),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. جدول purchase_invoice_payments
CREATE TABLE IF NOT EXISTS purchase_invoice_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "purchaseInvoiceId" UUID NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
    "paymentDate" TIMESTAMP NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    "paymentMethod" VARCHAR(50) NOT NULL,
    "referenceNo" VARCHAR(255),
    notes TEXT,
    "createdBy" UUID REFERENCES users(id),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. جدول sales_invoice_items
CREATE TABLE IF NOT EXISTS sales_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "salesInvoiceId" UUID NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    "descriptionEn" TEXT,
    quantity DECIMAL(10, 2) DEFAULT 1 NOT NULL,
    "unitPrice" DECIMAL(15, 2) NOT NULL,
    discount DECIMAL(15, 2) DEFAULT 0,
    "taxRate" DECIMAL(5, 2) DEFAULT 0,
    "taxAmount" DECIMAL(15, 2) DEFAULT 0,
    total DECIMAL(15, 2) NOT NULL,
    "accountId" UUID REFERENCES accounts(id),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. جدول sales_invoice_payments
CREATE TABLE IF NOT EXISTS sales_invoice_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "salesInvoiceId" UUID NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
    "paymentDate" TIMESTAMP NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    "paymentMethod" VARCHAR(50) NOT NULL,
    "referenceNo" VARCHAR(255),
    notes TEXT,
    "createdBy" UUID REFERENCES users(id),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. جدول sales_returns
CREATE TABLE IF NOT EXISTS sales_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "returnNumber" VARCHAR(255) UNIQUE NOT NULL,
    "salesInvoiceId" UUID NOT NULL REFERENCES sales_invoices(id),
    "customerId" UUID NOT NULL REFERENCES customers(id),
    "returnDate" TIMESTAMP NOT NULL,
    reason TEXT,
    "totalAmount" DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    "approvedBy" UUID REFERENCES users(id),
    "approvedAt" TIMESTAMP,
    "createdBy" UUID REFERENCES users(id),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 8. جدول stock_movements
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "movementNumber" VARCHAR(255) UNIQUE NOT NULL,
    "movementType" VARCHAR(50) NOT NULL,
    "movementDate" TIMESTAMP NOT NULL,
    "warehouseId" UUID REFERENCES warehouse(id),
    "referenceType" VARCHAR(255),
    "referenceId" UUID,
    notes TEXT,
    "createdBy" UUID REFERENCES users(id),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 9. جدول warehouse_release_orders
CREATE TABLE IF NOT EXISTS warehouse_release_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "orderNumber" VARCHAR(255) UNIQUE NOT NULL,
    "warehouseId" UUID NOT NULL REFERENCES warehouse(id),
    "shipmentId" UUID REFERENCES shipments(id),
    "customerId" UUID REFERENCES customers(id),
    "releaseDate" TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    "approvedBy" UUID REFERENCES users(id),
    "approvedAt" TIMESTAMP,
    "releasedBy" UUID REFERENCES users(id),
    "releasedAt" TIMESTAMP,
    "createdBy" UUID REFERENCES users(id),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- إنشاء الفهارس للجداول الجديدة
CREATE INDEX IF NOT EXISTS accounting_periods_fiscalYear_idx ON accounting_periods("fiscalYear");
CREATE INDEX IF NOT EXISTS accounting_periods_status_idx ON accounting_periods(status);
CREATE INDEX IF NOT EXISTS audit_logs_userId_idx ON audit_logs("userId");
CREATE INDEX IF NOT EXISTS audit_logs_entityType_entityId_idx ON audit_logs("entityType", "entityId");
CREATE INDEX IF NOT EXISTS audit_logs_timestamp_idx ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS purchase_invoice_payments_purchaseInvoiceId_idx ON purchase_invoice_payments("purchaseInvoiceId");
CREATE INDEX IF NOT EXISTS sales_invoice_items_salesInvoiceId_idx ON sales_invoice_items("salesInvoiceId");
CREATE INDEX IF NOT EXISTS sales_invoice_payments_salesInvoiceId_idx ON sales_invoice_payments("salesInvoiceId");
CREATE INDEX IF NOT EXISTS sales_returns_salesInvoiceId_idx ON sales_returns("salesInvoiceId");
CREATE INDEX IF NOT EXISTS sales_returns_customerId_idx ON sales_returns("customerId");
CREATE INDEX IF NOT EXISTS stock_movements_warehouseId_idx ON stock_movements("warehouseId");
CREATE INDEX IF NOT EXISTS stock_movements_movementDate_idx ON stock_movements("movementDate");
CREATE INDEX IF NOT EXISTS warehouse_release_orders_warehouseId_idx ON warehouse_release_orders("warehouseId");
CREATE INDEX IF NOT EXISTS warehouse_release_orders_shipmentId_idx ON warehouse_release_orders("shipmentId");

-- تسجيل الهجرة الأولى
INSERT INTO "SequelizeMeta" (name) VALUES ('20251005000001-create-missing-tables.js')
ON CONFLICT (name) DO NOTHING;

-- ===================================================================
-- الجزء 2: إضافة الحقول المفقودة
-- ===================================================================

-- account_mappings (10 حقول)
ALTER TABLE account_mappings ADD COLUMN IF NOT EXISTS "localCustomersAccount" UUID REFERENCES accounts(id);
ALTER TABLE account_mappings ADD COLUMN IF NOT EXISTS "foreignCustomersAccount" UUID REFERENCES accounts(id);
ALTER TABLE account_mappings ADD COLUMN IF NOT EXISTS "discountAccount" UUID REFERENCES accounts(id);
ALTER TABLE account_mappings ADD COLUMN IF NOT EXISTS "shippingRevenueAccount" UUID REFERENCES accounts(id);
ALTER TABLE account_mappings ADD COLUMN IF NOT EXISTS "handlingFeeAccount" UUID REFERENCES accounts(id);
ALTER TABLE account_mappings ADD COLUMN IF NOT EXISTS "customsClearanceAccount" UUID REFERENCES accounts(id);
ALTER TABLE account_mappings ADD COLUMN IF NOT EXISTS "insuranceAccount" UUID REFERENCES accounts(id);
ALTER TABLE account_mappings ADD COLUMN IF NOT EXISTS "storageAccount" UUID REFERENCES accounts(id);
ALTER TABLE account_mappings ADD COLUMN IF NOT EXISTS "createdBy" UUID REFERENCES users(id);
ALTER TABLE account_mappings ADD COLUMN IF NOT EXISTS "updatedBy" UUID REFERENCES users(id);

-- customers (5 حقول)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS "accountId" UUID REFERENCES accounts(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS "customerType" VARCHAR(50) DEFAULT 'individual';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS nationality VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS "passportNumber" VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS "residencyStatus" VARCHAR(255);

-- employees (9 حقول)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS code VARCHAR(255) UNIQUE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "terminationDate" TIMESTAMP;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "accountId" UUID REFERENCES accounts(id);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "bankAccount" VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "bankName" VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "taxNumber" VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "emergencyContact" VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "emergencyPhone" VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS notes TEXT;

-- gl_entries (14 حقل)
ALTER TABLE gl_entries ADD COLUMN IF NOT EXISTS "postingDate" TIMESTAMP;
ALTER TABLE gl_entries ADD COLUMN IF NOT EXISTS "accountId" UUID REFERENCES accounts(id);
ALTER TABLE gl_entries ADD COLUMN IF NOT EXISTS debit DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE gl_entries ADD COLUMN IF NOT EXISTS credit DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE gl_entries ADD COLUMN IF NOT EXISTS "voucherType" VARCHAR(255);
ALTER TABLE gl_entries ADD COLUMN IF NOT EXISTS "voucherNo" VARCHAR(255);
ALTER TABLE gl_entries ADD COLUMN IF NOT EXISTS "journalEntryId" UUID REFERENCES journal_entries(id);
ALTER TABLE gl_entries ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE gl_entries ADD COLUMN IF NOT EXISTS "isCancelled" BOOLEAN DEFAULT false;
ALTER TABLE gl_entries ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP;
ALTER TABLE gl_entries ADD COLUMN IF NOT EXISTS "cancelledBy" UUID REFERENCES users(id);
ALTER TABLE gl_entries ADD COLUMN IF NOT EXISTS "createdBy" UUID REFERENCES users(id);
ALTER TABLE gl_entries ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'LYD';
ALTER TABLE gl_entries ADD COLUMN IF NOT EXISTS "exchangeRate" DECIMAL(10, 4) DEFAULT 1;

-- sales_invoices (17 حقل)
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS subtotal DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS "discountAmount" DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS "taxAmount" DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS total DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'LYD';
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS "exchangeRate" DECIMAL(10, 4) DEFAULT 1;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS "paymentStatus" VARCHAR(50) DEFAULT 'unpaid';
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS "paymentMethod" VARCHAR(255);
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS "invoiceDate" TIMESTAMP;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS "postedStatus" VARCHAR(50) DEFAULT 'draft';
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS "postedAt" TIMESTAMP;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS "postedBy" UUID REFERENCES users(id);
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS "documentNo" VARCHAR(255);
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS "fiscalYear" INTEGER;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS "canEdit" BOOLEAN DEFAULT true;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS "voidReason" TEXT;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS "createdBy" UUID REFERENCES users(id);

-- receipts (11 حقل)
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS "receiptNo" VARCHAR(255) UNIQUE;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS "receiptDate" TIMESTAMP;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS "referenceNo" VARCHAR(255);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS "bankAccount" UUID REFERENCES accounts(id);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS "checkNumber" VARCHAR(255);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'LYD';
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS "exchangeRate" DECIMAL(10, 4) DEFAULT 1;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS "createdBy" UUID REFERENCES users(id);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS "completedBy" UUID REFERENCES users(id);

-- suppliers (6 حقول)
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS city VARCHAR(255);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS country VARCHAR(255);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS "paymentTerms" VARCHAR(255);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'LYD';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS "createdBy" UUID REFERENCES users(id);

-- invoices (3 حقول)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "taxAmount" DECIMAL(15, 2) DEFAULT 0;

-- fixed_assets (1 حقل)
ALTER TABLE fixed_assets ADD COLUMN IF NOT EXISTS "categoryAccountId" UUID REFERENCES accounts(id);

-- shipping_invoices (إعادة تسمية + إضافة)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shipping_invoices' AND column_name='invoice_number') THEN
        ALTER TABLE shipping_invoices RENAME COLUMN invoice_number TO "invoiceNumber";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shipping_invoices' AND column_name='customer_id') THEN
        ALTER TABLE shipping_invoices RENAME COLUMN customer_id TO "customerId";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shipping_invoices' AND column_name='total_amount') THEN
        ALTER TABLE shipping_invoices RENAME COLUMN total_amount TO "totalAmount";
    END IF;
END $$;

ALTER TABLE shipping_invoices ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
ALTER TABLE shipping_invoices ADD COLUMN IF NOT EXISTS "shipmentId" UUID REFERENCES shipments(id);
ALTER TABLE shipping_invoices ADD COLUMN IF NOT EXISTS "outstandingAmount" DECIMAL(15, 2) DEFAULT 0;

-- purchase_invoices (تصحيح اسم العمود)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_invoices' AND column_name='outstandingamount') THEN
        ALTER TABLE purchase_invoices RENAME COLUMN outstandingamount TO "outstandingAmount";
    END IF;
END $$;

-- تسجيل الهجرة الثانية
INSERT INTO "SequelizeMeta" (name) VALUES ('20251005000002-add-missing-fields.js')
ON CONFLICT (name) DO NOTHING;

-- ===================================================================
-- اكتمل التطبيق
-- ===================================================================

-- عرض الإحصائيات
SELECT 
    'اكتملت الإصلاحات بنجاح!' as message,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as total_tables,
    (SELECT COUNT(*) FROM "SequelizeMeta") as applied_migrations;
