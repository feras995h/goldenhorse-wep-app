-- ========================================
-- Golden Horse - Quick Database Setup
-- ========================================

-- إنشاء الحسابات الأساسية
INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", level, "isGroup", "isActive", balance, currency, nature, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), '4101', 'إيرادات خدمات الشحن البحري', 'Sea Freight Revenue', 'revenue', 'Income', 'Profit and Loss', 2, false, true, 0, 'LYD', 'credit', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", level, "isGroup", "isActive", balance, currency, nature, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), '1201', 'ذمم العملاء', 'Accounts Receivable', 'asset', 'Asset', 'Balance Sheet', 2, true, true, 0, 'LYD', 'debit', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", level, "isGroup", "isActive", balance, currency, nature, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), '2301', 'ضريبة القيمة المضافة', 'VAT Payable', 'liability', 'Liability', 'Balance Sheet', 2, false, true, 0, 'LYD', 'credit', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", level, "isGroup", "isActive", balance, currency, nature, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), '4102', 'خصومات المبيعات', 'Sales Discounts', 'revenue', 'Income', 'Profit and Loss', 2, false, true, 0, 'LYD', 'debit', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", level, "isGroup", "isActive", balance, currency, nature, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), '4103', 'إيرادات خدمات التخليص الجمركي', 'Customs Clearance Revenue', 'revenue', 'Income', 'Profit and Loss', 2, false, true, 0, 'LYD', 'credit', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", level, "isGroup", "isActive", balance, currency, nature, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), '4104', 'إيرادات خدمات التخزين', 'Storage Services Revenue', 'revenue', 'Income', 'Profit and Loss', 2, false, true, 0, 'LYD', 'credit', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", level, "isGroup", "isActive", balance, currency, nature, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), '4105', 'إيرادات خدمات التأمين', 'Insurance Services Revenue', 'revenue', 'Income', 'Profit and Loss', 2, false, true, 0, 'LYD', 'credit', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- تعطيل أي AccountMapping قديم
UPDATE account_mappings SET "isActive" = false;

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
  'Account Mapping للشحن الدولي - تم الإنشاء',
  NOW(),
  NOW()
);

-- التحقق من النتائج
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '✅ الحسابات المنشأة:'
\echo ''

SELECT code, name, type, "isGroup", balance
FROM accounts 
WHERE code IN ('4101', '1201', '2301', '4102', '4103', '4104', '4105')
ORDER BY code;

\echo ''
\echo '✅ AccountMapping:'
\echo ''

SELECT 
  am."isActive",
  sr.code as sales_code,
  sr.name as sales_name,
  ar.code as ar_code,
  ar.name as ar_name,
  tax.code as tax_code,
  tax.name as tax_name
FROM account_mappings am
LEFT JOIN accounts sr ON am."salesRevenueAccount" = sr.id
LEFT JOIN accounts ar ON am."accountsReceivableAccount" = ar.id
LEFT JOIN accounts tax ON am."salesTaxAccount" = tax.id
WHERE am."isActive" = true;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🎉 تم بنجاح! النظام جاهز'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
\echo '🚀 الخطوة التالية: npm run dev'
\echo ''
