/**
 * Fixed Asset Helpers
 * Helper functions for fixed asset management
 */

import models from '../models/index.js';
const { Account, FixedAsset } = models;

/**
 * Generate hierarchical asset number
 */
export async function generateHierarchicalAssetNumber(categoryAccountId) {
  try {
    const categoryAccount = await Account.findByPk(categoryAccountId);
    if (!categoryAccount) return null;

    const count = await FixedAsset.count({
      where: { categoryAccountId }
    });

    return `${categoryAccount.code}-${String(count + 1).padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating asset number:', error);
    return null;
  }
}

/**
 * Create fixed asset accounts
 */
export async function createFixedAssetAccounts(fixedAsset, categoryAccount, transaction) {
  try {
    // Create asset account
    const assetAccount = await Account.create({
      code: `${categoryAccount.code}.${fixedAsset.assetNumber}`,
      name: fixedAsset.name,
      nameEn: fixedAsset.nameEn || fixedAsset.name,
      type: 'asset',
      rootType: 'Asset',
      reportType: 'Balance Sheet',
      level: (categoryAccount.level || 0) + 1,
      parentId: categoryAccount.id,
      isGroup: false,
      isActive: true,
      balance: fixedAsset.purchasePrice || 0,
      currency: fixedAsset.currency || 'LYD',
      nature: 'debit'
    }, { transaction });

    return { assetAccount };
  } catch (error) {
    console.error('Error creating fixed asset accounts:', error);
    throw error;
  }
}

/**
 * Ensure fixed assets structure
 */
export async function ensureFixedAssetsStructure() {
  try {
    // Find or create Fixed Assets parent account
    let fixedAssetsParent = await Account.findOne({
      where: { code: '1.3' }
    });

    if (!fixedAssetsParent) {
      fixedAssetsParent = await Account.create({
        code: '1.3',
        name: 'الأصول الثابتة',
        nameEn: 'Fixed Assets',
        type: 'asset',
        rootType: 'Asset',
        reportType: 'Balance Sheet',
        level: 2,
        isGroup: true,
        isActive: true,
        balance: 0,
        currency: 'LYD',
        nature: 'debit'
      });
    }

    return { fixedAssetsParent };
  } catch (error) {
    console.error('Error ensuring fixed assets structure:', error);
    throw error;
  }
}
