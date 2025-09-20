// سكريبت لإصلاح مشكلة الحسابات في قاعدة البيانات الإنتاج
// يجب تشغيله على الخادم الإنتاج

const accountsData = `
-- إدراج دليل الحسابات الكامل
INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", "isGroup", "parentCode", balance, "isActive", "createdAt", "updatedAt") VALUES
-- الأصول
(gen_random_uuid(), '1', 'الأصول', 'Assets', 'asset', 'Asset', 'Balance Sheet', true, null, 0, true, NOW(), NOW()),
(gen_random_uuid(), '1.1', 'الأصول المتداولة', 'Current Assets', 'asset', 'Asset', 'Balance Sheet', true, '1', 0, true, NOW(), NOW()),
(gen_random_uuid(), '1.1.1', 'النقدية والبنوك', 'Cash and Banks', 'asset', 'Asset', 'Balance Sheet', true, '1.1', 0, true, NOW(), NOW()),
(gen_random_uuid(), '1.1.1.1', 'الصندوق', 'Cash', 'asset', 'Asset', 'Balance Sheet', false, '1.1.1', 500, true, NOW(), NOW()),
(gen_random_uuid(), '1.1.1.2', 'البنك الأهلي', 'National Bank', 'asset', 'Asset', 'Balance Sheet', false, '1.1.1', 0, true, NOW(), NOW()),
(gen_random_uuid(), '1.1.1.3', 'بنك الجمهورية', 'Republic Bank', 'asset', 'Asset', 'Balance Sheet', false, '1.1.1', 0, true, NOW(), NOW()),

(gen_random_uuid(), '1.1.2', 'المدينون', 'Accounts Receivable', 'asset', 'Asset', 'Balance Sheet', true, '1.1', 0, true, NOW(), NOW()),
(gen_random_uuid(), '1.1.2.1', 'عملاء', 'Customers', 'asset', 'Asset', 'Balance Sheet', false, '1.1.2', 0, true, NOW(), NOW()),
(gen_random_uuid(), '1.1.2.2', 'أوراق القبض', 'Notes Receivable', 'asset', 'Asset', 'Balance Sheet', false, '1.1.2', 0, true, NOW(), NOW()),

(gen_random_uuid(), '1.1.3', 'المخزون', 'Inventory', 'asset', 'Asset', 'Balance Sheet', true, '1.1', 0, true, NOW(), NOW()),
(gen_random_uuid(), '1.1.3.1', 'مخزون البضائع', 'Merchandise Inventory', 'asset', 'Asset', 'Balance Sheet', false, '1.1.3', 0, true, NOW(), NOW()),
(gen_random_uuid(), '1.1.3.2', 'مخزون المواد الخام', 'Raw Materials', 'asset', 'Asset', 'Balance Sheet', false, '1.1.3', 0, true, NOW(), NOW()),

(gen_random_uuid(), '1.2', 'الأصول الثابتة', 'Fixed Assets', 'asset', 'Asset', 'Balance Sheet', true, '1', 0, true, NOW(), NOW()),
(gen_random_uuid(), '1.2.1', 'الأراضي', 'Land', 'asset', 'Asset', 'Balance Sheet', false, '1.2', 0, true, NOW(), NOW()),
(gen_random_uuid(), '1.2.2', 'المباني', 'Buildings', 'asset', 'Asset', 'Balance Sheet', false, '1.2', 0, true, NOW(), NOW()),
(gen_random_uuid(), '1.2.3', 'الآلات والمعدات', 'Machinery & Equipment', 'asset', 'Asset', 'Balance Sheet', false, '1.2', 0, true, NOW(), NOW()),
(gen_random_uuid(), '1.2.4', 'الأثاث والتجهيزات', 'Furniture & Fixtures', 'asset', 'Asset', 'Balance Sheet', false, '1.2', 0, true, NOW(), NOW()),
(gen_random_uuid(), '1.2.5', 'السيارات', 'Vehicles', 'asset', 'Asset', 'Balance Sheet', false, '1.2', 0, true, NOW(), NOW()),
(gen_random_uuid(), '1.2.6', 'أجهزة الحاسوب', 'Computer Equipment', 'asset', 'Asset', 'Balance Sheet', false, '1.2', 0, true, NOW(), NOW()),
(gen_random_uuid(), '1.2.7', 'مجمع الاستهلاك', 'Accumulated Depreciation', 'asset', 'Asset', 'Balance Sheet', false, '1.2', 0, true, NOW(), NOW()),

-- الخصوم
(gen_random_uuid(), '2', 'الخصوم', 'Liabilities', 'liability', 'Liability', 'Balance Sheet', true, null, 0, true, NOW(), NOW()),
(gen_random_uuid(), '2.1', 'الخصوم المتداولة', 'Current Liabilities', 'liability', 'Liability', 'Balance Sheet', true, '2', 0, true, NOW(), NOW()),
(gen_random_uuid(), '2.1.1', 'الدائنون', 'Accounts Payable', 'liability', 'Liability', 'Balance Sheet', true, '2.1', 0, true, NOW(), NOW()),
(gen_random_uuid(), '2.1.1.1', 'موردون', 'Suppliers', 'liability', 'Liability', 'Balance Sheet', false, '2.1.1', 0, true, NOW(), NOW()),
(gen_random_uuid(), '2.1.1.2', 'أوراق الدفع', 'Notes Payable', 'liability', 'Liability', 'Balance Sheet', false, '2.1.1', 0, true, NOW(), NOW()),
(gen_random_uuid(), '2.1.2', 'مصروفات مستحقة', 'Accrued Expenses', 'liability', 'Liability', 'Balance Sheet', false, '2.1', 0, true, NOW(), NOW()),
(gen_random_uuid(), '2.1.3', 'ضرائب مستحقة', 'Accrued Taxes', 'liability', 'Liability', 'Balance Sheet', false, '2.1', 0, true, NOW(), NOW()),
(gen_random_uuid(), '2.2', 'مصروف الاستهلاك', 'Depreciation Expense', 'expense', 'Expense', 'Profit and Loss', false, '2', 0, true, NOW(), NOW()),

-- حقوق الملكية
(gen_random_uuid(), '3', 'حقوق الملكية', 'Equity', 'equity', 'Equity', 'Balance Sheet', true, null, 0, true, NOW(), NOW()),
(gen_random_uuid(), '3.1', 'رأس المال', 'Capital', 'equity', 'Equity', 'Balance Sheet', false, '3', 0, true, NOW(), NOW()),
(gen_random_uuid(), '3.2', 'الأرباح المحتجزة', 'Retained Earnings', 'equity', 'Equity', 'Balance Sheet', false, '3', 0, true, NOW(), NOW()),
(gen_random_uuid(), '3.3', 'أرباح العام الحالي', 'Current Year Earnings', 'equity', 'Equity', 'Balance Sheet', false, '3', 0, true, NOW(), NOW()),

-- الإيرادات
(gen_random_uuid(), '4', 'الإيرادات', 'Revenue', 'revenue', 'Income', 'Profit and Loss', true, null, 0, true, NOW(), NOW()),
(gen_random_uuid(), '4.1', 'إيرادات المبيعات', 'Sales Revenue', 'revenue', 'Income', 'Profit and Loss', false, '4', 0, true, NOW(), NOW()),
(gen_random_uuid(), '4.2', 'إيرادات الخدمات', 'Service Revenue', 'revenue', 'Income', 'Profit and Loss', false, '4', 0, true, NOW(), NOW()),
(gen_random_uuid(), '4.3', 'إيرادات أخرى', 'Other Revenue', 'revenue', 'Income', 'Profit and Loss', false, '4', 0, true, NOW(), NOW()),

-- المصروفات
(gen_random_uuid(), '5', 'المصروفات', 'Expenses', 'expense', 'Expense', 'Profit and Loss', true, null, 0, true, NOW(), NOW()),
(gen_random_uuid(), '5.1', 'تكلفة البضاعة المباعة', 'Cost of Goods Sold', 'expense', 'Expense', 'Profit and Loss', false, '5', 0, true, NOW(), NOW()),
(gen_random_uuid(), '5.2', 'مصروفات التشغيل', 'Operating Expenses', 'expense', 'Expense', 'Profit and Loss', true, '5', 0, true, NOW(), NOW()),
(gen_random_uuid(), '5.2.1', 'مواد نظافة', 'Cleaning Supplies', 'expense', 'Expense', 'Profit and Loss', false, '5.2', 300, true, NOW(), NOW()),
(gen_random_uuid(), '5.2.2', 'رواتب الموظفين', 'Employee Salaries', 'expense', 'Expense', 'Profit and Loss', false, '5.2', 0, true, NOW(), NOW()),
(gen_random_uuid(), '5.2.3', 'إيجار المكتب', 'Office Rent', 'expense', 'Expense', 'Profit and Loss', false, '5.2', 0, true, NOW(), NOW()),
(gen_random_uuid(), '5.2.4', 'فواتير الكهرباء', 'Electricity Bills', 'expense', 'Expense', 'Profit and Loss', false, '5.2', 0, true, NOW(), NOW()),
(gen_random_uuid(), '5.2.5', 'فواتير الهاتف', 'Phone Bills', 'expense', 'Expense', 'Profit and Loss', false, '5.2', 0, true, NOW(), NOW()),
(gen_random_uuid(), '5.3', 'مصروفات إدارية', 'Administrative Expenses', 'expense', 'Expense', 'Profit and Loss', false, '5', 0, true, NOW(), NOW()),
(gen_random_uuid(), '5.4', 'مصروفات مالية', 'Financial Expenses', 'expense', 'Expense', 'Profit and Loss', false, '5', 0, true, NOW(), NOW())

ON CONFLICT (code) DO NOTHING;

-- التحقق من النتائج
SELECT COUNT(*) as total_accounts FROM accounts;
SELECT code, name, type FROM accounts ORDER BY code;
`;

console.log('🚨 حل عاجل لمشكلة الحسابات المفقودة في قاعدة البيانات الإنتاج');
console.log('');
console.log('📋 الخطوات المطلوبة:');
console.log('');
console.log('1️⃣ انسخ الكود SQL التالي:');
console.log('');
console.log(accountsData);
console.log('');
console.log('2️⃣ قم بتنفيذ الكود في قاعدة البيانات الإنتاج عبر:');
console.log('   - لوحة تحكم Coolify');
console.log('   - أو pgAdmin');
console.log('   - أو أي أداة إدارة PostgreSQL');
console.log('');
console.log('3️⃣ تحقق من النتائج بتشغيل:');
console.log('   SELECT COUNT(*) FROM accounts;');
console.log('');
console.log('🎯 هذا سيضيف جميع الحسابات المفقودة ويحل المشكلة فوراً!');
