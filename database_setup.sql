-- ========================================
-- Golden Horse Shipping System
-- Database Setup Script
-- قاعدة البيانات السحابية
-- ========================================

-- تشغيل هذا السكريبت على قاعدة البيانات:
-- postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres

-- ========================================
-- الخطوة 1: التحقق من الحسابات الموجودة
-- ========================================
SELECT 
  id, code, name, "nameEn", type, "rootType", "isGroup", balance
FROM accounts 
WHERE type IN ('revenue', 'asset', 'liability')
ORDER BY code;

-- ========================================
-- الخطوة 2: إنشاء الحسابات الأساسية
-- ========================================

-- حساب إيرادات الشحن البحري
INSERT INTO accounts (
  id, code, name, "nameEn", type, "rootType", "reportType", 
  level, "isGroup", "isActive", balance, currency, nature, 
  "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  '4101',
  'إيرادات خدمات الشحن البحري',
  'Sea Freight Revenue',
  'revenue',
  'revenue',
  'income_statement',
  2,
  false,
  true,
  0,
  'LYD',
  'credit',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE code = '4101');

-- حساب ذمم العملاء (مجموعة)
INSERT INTO accounts (
  id, code, name, "nameEn", type, "rootType", "reportType", 
  level, "isGroup", "isActive", balance, currency, nature, 
  "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  '1201',
  'ذمم العملاء',
  'Accounts Receivable',
  'asset',
  'current_assets',
  'balance_sheet',
  2,
  true,
  true,
  0,
  'LYD',
  'debit',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE code = '1201');

-- حساب ضريبة القيمة المضافة
INSERT INTO accounts (
  id, code, name, "nameEn", type, "rootType", "reportType", 
  level, "isGroup", "isActive", balance, currency, nature, 
  "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  '2301',
  'ضريبة القيمة المضافة',
  'VAT Payable',
  'liability',
  'current_liabilities',
  'balance_sheet',
  2,
  false,
  true,
  0,
  'LYD',
  'credit',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE code = '2301');

-- حساب خصومات المبيعات
INSERT INTO accounts (
  id, code, name, "nameEn", type, "rootType", "reportType", 
  level, "isGroup", "isActive", balance, currency, nature, 
  "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  '4102',
  'خصومات المبيعات',
  'Sales Discounts',
  'revenue',
  'revenue',
  'income_statement',
  2,
  false,
  true,
  0,
  'LYD',
  'debit',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE code = '4102');

-- حساب إيرادات التخليص الجمركي
INSERT INTO accounts (
  id, code, name, "nameEn", type, "rootType", "reportType", 
  level, "isGroup", "isActive", balance, currency, nature, 
  "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  '4103',
  'إيرادات خدمات التخليص الجمركي',
  'Customs Clearance Revenue',
  'revenue',
  'revenue',
  'income_statement',
  2,
  false,
  true,
  0,
  'LYD',
  'credit',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE code = '4103');

-- حساب إيرادات التخزين
INSERT INTO accounts (
  id, code, name, "nameEn", type, "rootType", "reportType", 
  level, "isGroup", "isActive", balance, currency, nature, 
  "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  '4104',
  'إيرادات خدمات التخزين',
  'Storage Services Revenue',
  'revenue',
  'revenue',
  'income_statement',
  2,
  false,
  true,
  0,
  'LYD',
  'credit',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE code = '4104');

-- حساب إيرادات التأمين
INSERT INTO accounts (
  id, code, name, "nameEn", type, "rootType", "reportType", 
  level, "isGroup", "isActive", balance, currency, nature, 
  "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  '4105',
  'إيرادات خدمات التأمين',
  'Insurance Services Revenue',
  'revenue',
  'revenue',
  'income_statement',
  2,
  false,
  true,
  0,
  'LYD',
  'credit',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE code = '4105');

-- ========================================
-- الخطوة 3: إنشاء AccountMapping
-- ========================================

-- حذف أي mapping قديم غير نشط
UPDATE account_mappings SET "isActive" = false WHERE "isActive" = true;

-- إنشاء AccountMapping جديد
INSERT INTO account_mappings (
  id,
  "salesRevenueAccount",
  "accountsReceivableAccount",
  "salesTaxAccount",
  "discountAccount",
  "shippingRevenueAccount",
  "customsClearanceAccount",
  "storageAccount",
  "insuranceAccount",
  "isActive",
  description,
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM accounts WHERE code = '4101'),
  (SELECT id FROM accounts WHERE code = '1201'),
  (SELECT id FROM accounts WHERE code = '2301'),
  (SELECT id FROM accounts WHERE code = '4102'),
  (SELECT id FROM accounts WHERE code = '4101'),
  (SELECT id FROM accounts WHERE code = '4103'),
  (SELECT id FROM accounts WHERE code = '4104'),
  (SELECT id FROM accounts WHERE code = '4105'),
  true,
  'Account Mapping للشحن الدولي من الصين إلى ليبيا - تم الإنشاء يدوياً',
  NOW(),
  NOW()
);

-- ========================================
-- الخطوة 4: التحقق من النتيجة
-- ========================================

-- التحقق من الحسابات المنشأة
SELECT 
  code, name, "nameEn", type, "isGroup", balance
FROM accounts 
WHERE code IN ('4101', '1201', '2301', '4102', '4103', '4104', '4105')
ORDER BY code;

-- التحقق من AccountMapping
SELECT 
  am.id,
  am.description,
  am."isActive",
  sr.code as sales_code,
  sr.name as sales_name,
  ar.code as ar_code,
  ar.name as ar_name,
  tax.code as tax_code,
  tax.name as tax_name,
  disc.code as discount_code,
  disc.name as discount_name
FROM account_mappings am
LEFT JOIN accounts sr ON am."salesRevenueAccount" = sr.id
LEFT JOIN accounts ar ON am."accountsReceivableAccount" = ar.id
LEFT JOIN accounts tax ON am."salesTaxAccount" = tax.id
LEFT JOIN accounts disc ON am."discountAccount" = disc.id
WHERE am."isActive" = true;

-- ========================================
-- الخطوة 5: فحص صحة النظام
-- ========================================

-- عدد الحسابات
SELECT 
  type,
  COUNT(*) as count,
  SUM(CASE WHEN "isActive" = true THEN 1 ELSE 0 END) as active_count
FROM accounts
GROUP BY type
ORDER BY type;

-- عدد القيود المحاسبية
SELECT 
  'GL Entries' as table_name,
  COUNT(*) as count
FROM gl_entries
UNION ALL
SELECT 
  'Journal Entries' as table_name,
  COUNT(*) as count
FROM journal_entries;

-- الفواتير بدون قيود محاسبية
SELECT 
  COUNT(*) as invoices_without_journal_entry
FROM sales_invoices si
LEFT JOIN journal_entries je ON je.description LIKE '%' || si."invoiceNumber" || '%'
WHERE je.id IS NULL;

-- ========================================
-- ملاحظات مهمة
-- ========================================

/*
بعد تشغيل هذا السكريبت:

1. ✅ تم إنشاء الحسابات الأساسية
2. ✅ تم إنشاء AccountMapping نشط
3. ✅ النظام جاهز لإنشاء فواتير مع قيود محاسبية

الخطوات التالية:
1. إعادة تشغيل السيرفر (npm run dev)
2. السيرفر سيقوم تلقائياً بالتحقق من النظام
3. اختبار إنشاء فاتورة جديدة
4. التحقق من إنشاء القيد المحاسبي تلقائياً

للتحقق من صحة النظام عبر API:
GET http://localhost:5001/api/financial/system-health
*/
