-- Fix Fixed Asset Categories in Production Database
-- This script ensures that the necessary accounts exist for fixed asset categories

-- 1. Check and create main Assets account if it doesn't exist
INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", "parentId", level, "isGroup", "isActive", balance, currency, nature, "accountType", description, "isSystemAccount", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    '1',
    'الأصول',
    'Assets',
    'asset',
    'Asset',
    'Balance Sheet',
    NULL,
    1,
    true,
    true,
    0,
    'LYD',
    'debit',
    'main',
    'حساب الأصول الرئيسي',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM accounts WHERE code = '1' AND type = 'asset'
);

-- 2. Create Fixed Assets parent account if it doesn't exist
INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", "parentId", level, "isGroup", "isActive", balance, currency, nature, "accountType", description, "isSystemAccount", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    '1.2',
    'الأصول الثابتة',
    'Fixed Assets',
    'asset',
    'Asset',
    'Balance Sheet',
    (SELECT id FROM accounts WHERE code = '1' AND type = 'asset' LIMIT 1),
    2,
    true,
    true,
    0,
    'LYD',
    'debit',
    'sub',
    'مجموعة الأصول الثابتة',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM accounts WHERE code = '1.2' AND type = 'asset'
);

-- 3. Create default fixed asset categories
INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", "parentId", level, "isGroup", "isActive", balance, currency, nature, "accountType", description, "isSystemAccount", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    '1.2.1',
    'سيارات',
    'Vehicles',
    'asset',
    'Asset',
    'Balance Sheet',
    (SELECT id FROM accounts WHERE code = '1.2' AND type = 'asset' LIMIT 1),
    3,
    false,
    true,
    0,
    'LYD',
    'debit',
    'sub',
    'فئة أصل ثابت: سيارات',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM accounts WHERE code = '1.2.1' AND type = 'asset'
);

INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", "parentId", level, "isGroup", "isActive", balance, currency, nature, "accountType", description, "isSystemAccount", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    '1.2.2',
    'معدات وآلات',
    'Equipment and Machinery',
    'asset',
    'Asset',
    'Balance Sheet',
    (SELECT id FROM accounts WHERE code = '1.2' AND type = 'asset' LIMIT 1),
    3,
    false,
    true,
    0,
    'LYD',
    'debit',
    'sub',
    'فئة أصل ثابت: معدات وآلات',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM accounts WHERE code = '1.2.2' AND type = 'asset'
);

INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", "parentId", level, "isGroup", "isActive", balance, currency, nature, "accountType", description, "isSystemAccount", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    '1.2.3',
    'أثاث',
    'Furniture',
    'asset',
    'Asset',
    'Balance Sheet',
    (SELECT id FROM accounts WHERE code = '1.2' AND type = 'asset' LIMIT 1),
    3,
    false,
    true,
    0,
    'LYD',
    'debit',
    'sub',
    'فئة أصل ثابت: أثاث',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM accounts WHERE code = '1.2.3' AND type = 'asset'
);

INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", "parentId", level, "isGroup", "isActive", balance, currency, nature, "accountType", description, "isSystemAccount", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    '1.2.4',
    'مباني',
    'Buildings',
    'asset',
    'Asset',
    'Balance Sheet',
    (SELECT id FROM accounts WHERE code = '1.2' AND type = 'asset' LIMIT 1),
    3,
    false,
    true,
    0,
    'LYD',
    'debit',
    'sub',
    'فئة أصل ثابت: مباني',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM accounts WHERE code = '1.2.4' AND type = 'asset'
);

INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", "parentId", level, "isGroup", "isActive", balance, currency, nature, "accountType", description, "isSystemAccount", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    '1.2.5',
    'أجهزة حاسوب',
    'Computers',
    'asset',
    'Asset',
    'Balance Sheet',
    (SELECT id FROM accounts WHERE code = '1.2' AND type = 'asset' LIMIT 1),
    3,
    false,
    true,
    0,
    'LYD',
    'debit',
    'sub',
    'فئة أصل ثابت: أجهزة حاسوب',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM accounts WHERE code = '1.2.5' AND type = 'asset'
);

-- 4. Verify the created categories
SELECT 
    a.code,
    a.name,
    a."nameEn",
    a.type,
    a.level,
    a."isActive"
FROM accounts a
WHERE a."parentId" = (
    SELECT id FROM accounts WHERE code = '1.2' AND type = 'asset' LIMIT 1
)
AND a.type = 'asset'
AND a."isActive" = true
ORDER BY a.code;
