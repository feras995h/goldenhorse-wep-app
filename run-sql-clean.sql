-- Cleaned version of run-sql.sql without psql meta-commands
-- Golden Horse - Quick Database Setup (clean)

-- Create basic accounts if not already present
INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", level, "isGroup", "isActive", balance, currency, nature, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), '4101', 'إيرادات خدمات الشحن البحري', 'Sea Freight Revenue', 'revenue', 'Asset', 'Profit and Loss', 2, false, true, 0, 'LYD', 'credit', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", level, "isGroup", "isActive", balance, currency, nature, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), '1201', 'ذمم العملاء', 'Accounts Receivable', 'asset', 'Asset', 'Balance Sheet', 2, true, true, 0, 'LYD', 'debit', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", level, "isGroup", "isActive", balance, currency, nature, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), '2301', 'ضريبة القيمة المضافة', 'VAT Payable', 'liability', 'Asset', 'Balance Sheet', 2, false, true, 0, 'LYD', 'credit', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", level, "isGroup", "isActive", balance, currency, nature, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), '4102', 'خصومات المبيعات', 'Sales Discounts', 'revenue', 'Asset', 'Profit and Loss', 2, false, true, 0, 'LYD', 'debit', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", level, "isGroup", "isActive", balance, currency, nature, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), '4103', 'إيرادات خدمات التخليص الجمركي', 'Customs Clearance Revenue', 'revenue', 'Asset', 'Profit and Loss', 2, false, true, 0, 'LYD', 'credit', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", level, "isGroup", "isActive", balance, currency, nature, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), '4104', 'إيرادات خدمات التخزين', 'Storage Services Revenue', 'revenue', 'Asset', 'Profit and Loss', 2, false, true, 0, 'LYD', 'credit', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", level, "isGroup", "isActive", balance, currency, nature, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), '4105', 'إيرادات خدمات التأمين', 'Insurance Services Revenue', 'revenue', 'Asset', 'Profit and Loss', 2, false, true, 0, 'LYD', 'credit', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Deactivate any old account_mappings
UPDATE account_mappings SET "isActive" = false;

-- Create a new active account mapping (assumes tables exist)
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
  'Account Mapping للشحن الدولي - تم الإنشاء (clean)',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Basic checks
SELECT code, name, type, "isGroup", balance FROM accounts WHERE code IN ('4101','1201','2301','4102','4103','4104','4105') ORDER BY code;
SELECT COUNT(*) AS active_mappings FROM account_mappings WHERE "isActive" = true;