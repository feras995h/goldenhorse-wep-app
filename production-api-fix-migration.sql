
-- Migration script to fix production API errors
-- Generated on 2025-09-20T17:49:03.464Z

-- Add missing columns to payments table
DO $$
BEGIN
  -- Add currency column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='currency') THEN
    ALTER TABLE payments ADD COLUMN currency VARCHAR(3) DEFAULT 'LYD';
  END IF;
  
  -- Add exchangeRate column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='exchangeRate') THEN
    ALTER TABLE payments ADD COLUMN "exchangeRate" DECIMAL(10,6) DEFAULT 1.000000;
  END IF;
  
  -- Add partyType column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='partyType') THEN
    ALTER TABLE payments ADD COLUMN "partyType" VARCHAR(20);
  END IF;
  
  -- Add partyId column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='partyId') THEN
    ALTER TABLE payments ADD COLUMN "partyId" UUID;
  END IF;
  
  -- Add voucherType column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='voucherType') THEN
    ALTER TABLE payments ADD COLUMN "voucherType" VARCHAR(20);
  END IF;
END $$;

-- Add missing columns to receipts table
DO $$
BEGIN
  -- Add currency column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='receipts' AND column_name='currency') THEN
    ALTER TABLE receipts ADD COLUMN currency VARCHAR(3) DEFAULT 'LYD';
  END IF;
  
  -- Add exchangeRate column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='receipts' AND column_name='exchangeRate') THEN
    ALTER TABLE receipts ADD COLUMN "exchangeRate" DECIMAL(10,6) DEFAULT 1.000000;
  END IF;
END $$;

-- Update existing records with default values
UPDATE payments SET currency = 'LYD' WHERE currency IS NULL;
UPDATE payments SET "exchangeRate" = 1.000000 WHERE "exchangeRate" IS NULL;
UPDATE receipts SET currency = 'LYD' WHERE currency IS NULL;
UPDATE receipts SET "exchangeRate" = 1.000000 WHERE "exchangeRate" IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_party ON payments("partyType", "partyId");
CREATE INDEX IF NOT EXISTS idx_payments_voucher_type ON payments("voucherType");
CREATE INDEX IF NOT EXISTS idx_receipts_currency ON receipts(currency);

-- Analyze tables for better query planning
ANALYZE payments;
ANALYZE receipts;
ANALYZE shipping_invoices;
ANALYZE sales_invoices;

COMMIT;
