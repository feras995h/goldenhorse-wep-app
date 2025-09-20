-- إصلاح قاعدة البيانات على VPS
-- تطبيق جميع التحديثات المطلوبة لحل الأخطاء

BEGIN;

-- ==================== إصلاح جدول الحسابات ====================

-- إضافة الأعمدة المفقودة
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS isMonitored BOOLEAN DEFAULT false;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS freezeAccount BOOLEAN DEFAULT false;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS accountCategory VARCHAR(50);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS subCategory VARCHAR(50);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS accountType VARCHAR(20) DEFAULT 'sub';

-- تحديث القيم الافتراضية للحسابات الموجودة
UPDATE accounts 
SET 
    isMonitored = false,
    freezeAccount = false,
    accountType = CASE 
        WHEN isGroup = true THEN 'group'
        ELSE 'sub'
    END
WHERE isMonitored IS NULL OR freezeAccount IS NULL OR accountType IS NULL;

-- ==================== إنشاء جدول العملاء ====================

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE,
    name VARCHAR(200) NOT NULL,
    nameEn VARCHAR(200),
    type VARCHAR(20) DEFAULT 'individual' CHECK (type IN ('individual', 'company')),
    email VARCHAR(100),
    phone VARCHAR(50),
    address TEXT,
    taxNumber VARCHAR(50),
    creditLimit DECIMAL(15,2) DEFAULT 0,
    paymentTerms INTEGER DEFAULT 30,
    currency VARCHAR(3) DEFAULT 'LYD',
    contactPerson VARCHAR(100),
    isActive BOOLEAN DEFAULT true,
    accountId UUID REFERENCES accounts(id),
    notes TEXT,
    createdBy UUID,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== إنشاء جدول الإعدادات ====================

CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    type VARCHAR(20) DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    isSystem BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== إنشاء جدول الأصول الثابتة ====================

CREATE TABLE IF NOT EXISTS fixed_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assetNumber VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    nameEn VARCHAR(200),
    categoryAccountId UUID REFERENCES accounts(id),
    purchaseDate DATE NOT NULL,
    purchaseCost DECIMAL(15,2) NOT NULL,
    salvageValue DECIMAL(15,2) DEFAULT 0,
    usefulLife INTEGER NOT NULL,
    depreciationMethod VARCHAR(20) DEFAULT 'straight_line',
    currentValue DECIMAL(15,2),
    accumulatedDepreciation DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    location VARCHAR(200),
    serialNumber VARCHAR(100),
    model VARCHAR(100),
    manufacturer VARCHAR(100),
    currency VARCHAR(3) DEFAULT 'LYD',
    description TEXT,
    assetAccountId UUID REFERENCES accounts(id),
    depreciationExpenseAccountId UUID REFERENCES accounts(id),
    accumulatedDepreciationAccountId UUID REFERENCES accounts(id),
    createdBy UUID,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== إنشاء جدول قيود الرواتب ====================

CREATE TABLE IF NOT EXISTS payroll_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employeeId UUID NOT NULL,
    employeeName VARCHAR(200) NOT NULL,
    month VARCHAR(7) NOT NULL, -- YYYY-MM format
    basicSalary DECIMAL(15,2) NOT NULL,
    allowances DECIMAL(15,2) DEFAULT 0,
    deductions DECIMAL(15,2) DEFAULT 0,
    overtime DECIMAL(15,2) DEFAULT 0,
    bonuses DECIMAL(15,2) DEFAULT 0,
    netSalary DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'LYD',
    status VARCHAR(20) DEFAULT 'draft',
    paymentMethod VARCHAR(20) DEFAULT 'cash',
    paymentDate DATE,
    remarks TEXT,
    createdBy UUID,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employeeId, month)
);

-- ==================== إنشاء الفهارس للأداء ====================

-- فهارس جدول الحسابات
CREATE INDEX IF NOT EXISTS idx_accounts_isMonitored ON accounts(isMonitored);
CREATE INDEX IF NOT EXISTS idx_accounts_freezeAccount ON accounts(freezeAccount);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
CREATE INDEX IF NOT EXISTS idx_accounts_isActive ON accounts(isActive);
CREATE INDEX IF NOT EXISTS idx_accounts_parentId ON accounts(parentId);

-- فهارس جدول العملاء
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(code);
CREATE INDEX IF NOT EXISTS idx_customers_isActive ON customers(isActive);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type);
CREATE INDEX IF NOT EXISTS idx_customers_accountId ON customers(accountId);

-- فهارس جدول الإعدادات
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_type ON settings(type);

-- فهارس جدول الأصول الثابتة
CREATE INDEX IF NOT EXISTS idx_fixed_assets_assetNumber ON fixed_assets(assetNumber);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_status ON fixed_assets(status);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_categoryAccountId ON fixed_assets(categoryAccountId);

-- فهارس جدول قيود الرواتب
CREATE INDEX IF NOT EXISTS idx_payroll_entries_employeeId ON payroll_entries(employeeId);
CREATE INDEX IF NOT EXISTS idx_payroll_entries_month ON payroll_entries(month);
CREATE INDEX IF NOT EXISTS idx_payroll_entries_status ON payroll_entries(status);

-- ==================== حذف البيانات المكسورة ====================

-- حذف إعدادات الشعار المكسورة
DELETE FROM settings WHERE key LIKE 'logo%';

-- حذف الإشعارات التجريبية والوهمية
DELETE FROM notifications WHERE title LIKE '%تجريبي%' OR title LIKE '%test%' OR message LIKE '%وهمي%' OR message LIKE '%fake%';

-- تنظيف القيود غير المكتملة
DELETE FROM journal_entries WHERE status = 'draft' AND created_at < NOW() - INTERVAL '30 days';

-- تنظيف قيود الأستاذ العام المعلقة
DELETE FROM gl_entries WHERE journal_entry_id IS NULL;

-- ==================== إضافة الإعدادات الافتراضية ====================

INSERT INTO settings (key, value, type, description, isSystem) VALUES 
('companyName', 'Golden Horse', 'string', 'اسم الشركة', true),
('companyNameEn', 'Golden Horse', 'string', 'Company name in English', true),
('currency', 'LYD', 'string', 'العملة الافتراضية', true),
('taxNumber', '', 'string', 'الرقم الضريبي للشركة', false),
('address', '', 'string', 'عنوان الشركة', false),
('phone', '', 'string', 'هاتف الشركة', false),
('email', '', 'string', 'بريد الشركة الإلكتروني', false),
('fiscalYearStart', '01-01', 'string', 'بداية السنة المالية (MM-DD)', true),
('decimalPlaces', '2', 'number', 'عدد الخانات العشرية', true),
('dateFormat', 'YYYY-MM-DD', 'string', 'تنسيق التاريخ', true),
('timeZone', 'Africa/Tripoli', 'string', 'المنطقة الزمنية', true),
('language', 'ar', 'string', 'اللغة الافتراضية', true),
('lastUpdated', CURRENT_TIMESTAMP::text, 'string', 'آخر تحديث للنظام', true)
ON CONFLICT (key) DO NOTHING;

-- ==================== إصلاح البيانات الموجودة ====================

-- تحديث طبيعة الأرصدة للحسابات
UPDATE accounts 
SET nature = CASE 
    WHEN type IN ('asset', 'expense') THEN 'debit'
    WHEN type IN ('liability', 'equity', 'revenue') THEN 'credit'
    ELSE 'debit'
END
WHERE nature IS NULL OR nature = '';

-- تحديث rootType للحسابات
UPDATE accounts 
SET rootType = CASE 
    WHEN type = 'asset' THEN 'Asset'
    WHEN type = 'liability' THEN 'Liability'
    WHEN type = 'equity' THEN 'Equity'
    WHEN type = 'revenue' THEN 'Income'
    WHEN type = 'expense' THEN 'Expense'
    ELSE 'Asset'
END
WHERE rootType IS NULL OR rootType = '';

-- تحديث reportType للحسابات
UPDATE accounts 
SET reportType = CASE 
    WHEN type IN ('asset', 'liability', 'equity') THEN 'Balance Sheet'
    WHEN type IN ('revenue', 'expense') THEN 'Profit and Loss'
    ELSE 'Balance Sheet'
END
WHERE reportType IS NULL OR reportType = '';

-- ==================== التحقق من سلامة البيانات ====================

-- التأكد من وجود الحسابات الرئيسية
DO $$
BEGIN
    -- إنشاء الحسابات الرئيسية إذا لم تكن موجودة
    INSERT INTO accounts (code, name, nameEn, type, rootType, reportType, level, isGroup, isActive, balance, currency, nature, accountType) VALUES 
    ('1', 'الأصول', 'Assets', 'asset', 'Asset', 'Balance Sheet', 1, true, true, 0, 'LYD', 'debit', 'group'),
    ('2', 'المصروفات', 'Expenses', 'expense', 'Expense', 'Profit and Loss', 1, true, true, 0, 'LYD', 'debit', 'group'),
    ('3', 'الالتزامات', 'Liabilities', 'liability', 'Liability', 'Balance Sheet', 1, true, true, 0, 'LYD', 'credit', 'group'),
    ('4', 'حقوق الملكية', 'Equity', 'equity', 'Equity', 'Balance Sheet', 1, true, true, 0, 'LYD', 'credit', 'group'),
    ('5', 'الإيرادات', 'Revenue', 'revenue', 'Income', 'Profit and Loss', 1, true, true, 0, 'LYD', 'credit', 'group')
    ON CONFLICT (code) DO NOTHING;
END $$;

COMMIT;

-- ==================== رسائل التأكيد ====================

DO $$
BEGIN
    RAISE NOTICE 'تم إصلاح قاعدة البيانات بنجاح!';
    RAISE NOTICE 'الجداول المُحدثة:';
    RAISE NOTICE '- accounts: تم إضافة الأعمدة المفقودة';
    RAISE NOTICE '- customers: تم إنشاء الجدول';
    RAISE NOTICE '- settings: تم إنشاء الجدول وإضافة الإعدادات الافتراضية';
    RAISE NOTICE '- fixed_assets: تم إنشاء الجدول';
    RAISE NOTICE '- payroll_entries: تم إنشاء الجدول';
    RAISE NOTICE 'تم إنشاء جميع الفهارس المطلوبة';
    RAISE NOTICE 'تم حذف البيانات المكسورة';
    RAISE NOTICE 'النظام جاهز للاستخدام!';
END $$;
