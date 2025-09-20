-- Database Migration Script for Arabic Accounting System
-- Run this script to add the missing columns for the new features

-- 1. Add categoryAccountId to fixed_assets table
-- This links fixed assets to chart of accounts instead of using hardcoded categories
ALTER TABLE fixed_assets ADD COLUMN categoryAccountId TEXT REFERENCES accounts(id);

-- 2. Add accountId to customers table  
-- This automatically creates corresponding accounts for customers
ALTER TABLE customers ADD COLUMN accountId TEXT REFERENCES accounts(id);

-- 3. Add journalEntryId to gl_entries table (if not exists)
-- This links GL entries to their parent journal entries
ALTER TABLE gl_entries ADD COLUMN journalEntryId TEXT;

-- 4. Add isMonitored flag to accounts table
-- This marks accounts for monitoring in the account monitoring feature
ALTER TABLE accounts ADD COLUMN isMonitored BOOLEAN DEFAULT FALSE;

-- 4. Update existing fixed assets to use a default category (optional)
-- You can run this after creating some fixed asset category accounts
-- UPDATE fixed_assets SET categoryAccountId = (SELECT id FROM accounts WHERE name LIKE '%أصول ثابتة%' LIMIT 1) WHERE categoryAccountId IS NULL;

-- 5. Create some default fixed asset category accounts (optional)
-- INSERT INTO accounts (id, code, name, type, accountCategory, isActive, currency, balance, level, isGroup) 
-- VALUES 
--   (hex(randomblob(16)), '1.3.1', 'مباني', 'asset', 'fixed_assets', 1, 'LYD', 0, 3, 0),
--   (hex(randomblob(16)), '1.3.2', 'معدات', 'asset', 'fixed_assets', 1, 'LYD', 0, 3, 0),
--   (hex(randomblob(16)), '1.3.3', 'أثاث', 'asset', 'fixed_assets', 1, 'LYD', 0, 3, 0),
--   (hex(randomblob(16)), '1.3.4', 'مركبات', 'asset', 'fixed_assets', 1, 'LYD', 0, 3, 0),
--   (hex(randomblob(16)), '1.3.5', 'حاسوب', 'asset', 'fixed_assets', 1, 'LYD', 0, 3, 0);
