-- Migration script to add account reference fields to fixed_assets table
-- This enables automatic account creation and linking for fixed assets

-- Add new columns to fixed_assets table
ALTER TABLE fixed_assets ADD COLUMN assetAccountId TEXT REFERENCES accounts(id);
ALTER TABLE fixed_assets ADD COLUMN depreciationExpenseAccountId TEXT REFERENCES accounts(id);
ALTER TABLE fixed_assets ADD COLUMN accumulatedDepreciationAccountId TEXT REFERENCES accounts(id);

-- Add comments to explain the purpose of each field
COMMENT ON COLUMN fixed_assets.assetAccountId IS 'Reference to the specific asset account created for this fixed asset';
COMMENT ON COLUMN fixed_assets.depreciationExpenseAccountId IS 'Reference to the depreciation expense account for this asset';
COMMENT ON COLUMN fixed_assets.accumulatedDepreciationAccountId IS 'Reference to the accumulated depreciation account for this asset';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fixed_assets_asset_account ON fixed_assets(assetAccountId);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_depreciation_expense_account ON fixed_assets(depreciationExpenseAccountId);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_accumulated_depreciation_account ON fixed_assets(accumulatedDepreciationAccountId);
