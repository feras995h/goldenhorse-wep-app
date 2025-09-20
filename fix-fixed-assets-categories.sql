
-- إصلاح فئات الأصول الثابتة
-- التحقق من وجود الفئات المناسبة

-- 1. التحقق من مجموعة الأصول الثابتة
SELECT id, code, name FROM accounts WHERE code = '1.2' AND type = 'asset';

-- 2. التحقق من المجموعات الفرعية
SELECT id, code, name, "isGroup" FROM accounts 
WHERE "parentId" = (SELECT id FROM accounts WHERE code = '1.2' AND type = 'asset')
AND type = 'asset' AND "isActive" = true;

-- 3. التحقق من الفئات الموجودة
SELECT a.id, a.code, a.name, a."nameEn", a.type, a.level, a."parentId"
FROM accounts a
INNER JOIN accounts parent ON a."parentId" = parent.id
WHERE parent."parentId" = (SELECT id FROM accounts WHERE code = '1.2' AND type = 'asset')
AND a.type = 'asset' 
AND a."isActive" = true 
AND a."isGroup" = false
ORDER BY a.code;

-- 4. إنشاء فئات جديدة إذا لم تكن موجودة
INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", "parentId", level, "isGroup", "isActive", balance, currency, nature, "accountType", description, "isSystemAccount", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  '1.2.1.1',
  'أراضي',
  'Land',
  'asset',
  'Asset',
  'Balance Sheet',
  (SELECT id FROM accounts WHERE code = '1.2.1' AND type = 'asset'),
  4,
  false,
  true,
  0,
  'LYD',
  'debit',
  'sub',
  'فئة أصل ثابت: أراضي',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM accounts WHERE code = '1.2.1.1'
);

-- 5. إنشاء فئات أخرى بنفس الطريقة...
-- (يمكن إضافة المزيد حسب الحاجة)
