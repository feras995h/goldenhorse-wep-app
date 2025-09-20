-- Check existing Fixed Asset Categories in the database
-- Run this on your production database to see what categories exist

-- 1. Check main Assets account
SELECT 'Main Assets Account' as check_type, id, code, name, "nameEn", type, level, "isActive"
FROM accounts 
WHERE code = '1' AND type = 'asset';

-- 2. Check Fixed Assets parent
SELECT 'Fixed Assets Parent' as check_type, id, code, name, "nameEn", type, level, "parentId", "isActive"
FROM accounts 
WHERE code = '1.2' AND type = 'asset';

-- 3. Check all accounts under Fixed Assets parent
SELECT 'All Accounts Under Fixed Assets' as check_type, id, code, name, "nameEn", type, level, "parentId", "isActive", "isGroup"
FROM accounts 
WHERE "parentId" = (SELECT id FROM accounts WHERE code = '1.2' AND type = 'asset' LIMIT 1)
AND type = 'asset'
ORDER BY code;

-- 4. Check specifically for leaf categories (non-group accounts)
SELECT 'Leaf Categories (Non-Group)' as check_type, id, code, name, "nameEn", type, level, "parentId", "isActive"
FROM accounts 
WHERE "parentId" = (SELECT id FROM accounts WHERE code = '1.2' AND type = 'asset' LIMIT 1)
AND type = 'asset'
AND "isGroup" = false
AND "isActive" = true
ORDER BY code;

-- 5. Search for accounts with "fixed" or "asset" keywords
SELECT 'Accounts with Asset Keywords' as check_type, id, code, name, "nameEn", type, level, "parentId", "isActive"
FROM accounts 
WHERE (
  LOWER(name) LIKE '%أصل%' OR 
  LOWER(name) LIKE '%ثابت%' OR 
  LOWER("nameEn") LIKE '%asset%' OR 
  LOWER("nameEn") LIKE '%fixed%'
)
AND type = 'asset'
ORDER BY code;

-- 6. Count summary
SELECT 
  'Summary' as check_type,
  (SELECT COUNT(*) FROM accounts WHERE code = '1' AND type = 'asset') as main_assets_count,
  (SELECT COUNT(*) FROM accounts WHERE code = '1.2' AND type = 'asset') as fixed_assets_parent_count,
  (SELECT COUNT(*) FROM accounts WHERE "parentId" = (SELECT id FROM accounts WHERE code = '1.2' AND type = 'asset' LIMIT 1) AND type = 'asset') as children_count,
  (SELECT COUNT(*) FROM accounts WHERE "parentId" = (SELECT id FROM accounts WHERE code = '1.2' AND type = 'asset' LIMIT 1) AND type = 'asset' AND "isGroup" = false AND "isActive" = true) as leaf_categories_count;
