import { Op } from 'sequelize';
import { sequelize } from '../models/index.js';
// More robust way to determine the like operator
let likeOp = Op.like; // Default to case-sensitive LIKE
try {
  if (sequelize.getDialect && typeof sequelize.getDialect === 'function') {
    const dialect = sequelize.getDialect();
    console.log('🔍 Database dialect detected:', dialect);
    // Use case-insensitive LIKE for PostgreSQL and MySQL, case-sensitive for SQLite
    if (dialect === 'postgres' || dialect === 'mysql' || dialect === 'mariadb') {
      likeOp = Op.iLike;
    }
  }
} catch (error) {
  console.warn('⚠️  Could not determine database dialect, using default LIKE operator:', error.message);
}
import { v4 as uuidv4 } from 'uuid';
import models from '../models/index.js';

const { Account, FixedAsset } = models;

/**
 * Generate hierarchical asset number based on category account code
 * Format: categoryCode.nextSequentialNumber
 * Example: 1.2.1.1, 1.2.1.2, etc.
 */
export const generateHierarchicalAssetNumber = async (categoryAccountId) => {
  try {
    // Get category account
    const categoryAccount = await Account.findByPk(categoryAccountId);
    if (!categoryAccount) {
      throw new Error('Category account not found');
    }

    // Get existing assets count for this category
    const existingAssetsCount = await FixedAsset.count({
      where: { categoryAccountId }
    });

    // Generate hierarchical asset number: categoryCode.nextNumber
    const nextNumber = existingAssetsCount + 1;
    return `${categoryAccount.code}.${nextNumber}`;
  } catch (error) {
    console.error('Error generating hierarchical asset number:', error);
    return null;
  }
};

/**
 * Create all related accounts for a fixed asset
 * 1. Asset Account (under selected category)
 * 2. Depreciation Expense Account (under 2.1.1)
 * 3. Accumulated Depreciation Account (under 3.x.x)
 */
export const createFixedAssetAccounts = async (fixedAsset, categoryAccount, transaction) => {
  try {
    const createdAccounts = {
      assetAccount: null,
      depreciationExpenseAccount: null,
      accumulatedDepreciationAccount: null
    };

    // 1. Create Asset Account (under the selected category)
    const assetAccountCode = fixedAsset.assetNumber;
    createdAccounts.assetAccount = await Account.create({
      code: assetAccountCode,
      name: fixedAsset.name,
      nameEn: fixedAsset.nameEn || fixedAsset.name,
      type: 'asset',
      rootType: 'Asset',
      reportType: 'Balance Sheet',
      parentId: categoryAccount.id,
      level: categoryAccount.level + 1,
      isGroup: false,
      isActive: true,
      balance: fixedAsset.purchaseCost,
      currency: fixedAsset.currency || 'LYD',
      nature: 'debit',
      accountType: 'sub',
      description: `حساب الأصل الثابت: ${fixedAsset.name}`,
      isSystemAccount: false,
      isMonitored: true
    }, { transaction });

    // 2. Create Depreciation Expense Account (under 2.1.1)
    const depreciationExpenseAccount = await createDepreciationExpenseAccount(fixedAsset, transaction);
    if (depreciationExpenseAccount) {
      createdAccounts.depreciationExpenseAccount = depreciationExpenseAccount;
    }

    // 3. Create Accumulated Depreciation Account (under 3.x.x)
    const accumulatedDepreciationAccount = await createAccumulatedDepreciationAccount(fixedAsset, transaction);
    if (accumulatedDepreciationAccount) {
      createdAccounts.accumulatedDepreciationAccount = accumulatedDepreciationAccount;
    }

    return createdAccounts;
  } catch (error) {
    console.error('Error creating fixed asset accounts:', error);
    throw error;
  }
};

/**
 * Create or find depreciation expenses parent account and create specific depreciation expense account
 */
const createDepreciationExpenseAccount = async (fixedAsset, transaction) => {
  try {
    // Find or create the depreciation expenses parent account (2.1.1)
    let depreciationExpensesParent = await Account.findOne({
      where: {
        [Op.or]: [
          { code: '2.1.1' },
          { name: { [likeOp]: '%مصروفات الإهلاك%' } },
          { nameEn: { [likeOp]: '%Depreciation Expenses%' } }
        ]
      }
    });

    if (!depreciationExpensesParent) {
      // Find administrative expenses parent (2.1)
      const adminExpensesParent = await Account.findOne({
        where: {
          [Op.or]: [
            { code: '2.1' },
            { name: { [likeOp]: '%المصروفات الإدارية%' } },
            { nameEn: { [likeOp]: '%Administrative Expenses%' } }
          ]
        }
      });

      if (!adminExpensesParent) {
        // Find main expenses account (2)
        const mainExpensesAccount = await Account.findOne({
          where: {
            code: '2',
            type: 'expense'
          }
        });

        if (mainExpensesAccount) {
          // Create administrative expenses parent first
          const newAdminExpensesParent = await Account.create({
            code: '2.1',
            name: 'المصروفات الإدارية والعمومية',
            nameEn: 'Administrative and General Expenses',
            type: 'expense',
            rootType: 'Expense',
            reportType: 'Profit and Loss',
            parentId: mainExpensesAccount.id,
            level: mainExpensesAccount.level + 1,
            isGroup: true,
            isActive: true,
            balance: 0,
            currency: 'LYD',
            nature: 'debit',
            accountType: 'sub',
            description: 'مجموعة حسابات المصروفات الإدارية والعمومية',
            isSystemAccount: true
          }, { transaction });

          // Now create depreciation expenses parent
          depreciationExpensesParent = await Account.create({
            code: '2.1.1',
            name: 'مصروفات الإهلاك',
            nameEn: 'Depreciation Expenses',
            type: 'expense',
            rootType: 'Expense',
            reportType: 'Profit and Loss',
            parentId: newAdminExpensesParent.id,
            level: newAdminExpensesParent.level + 1,
            isGroup: true,
            isActive: true,
            balance: 0,
            currency: 'LYD',
            nature: 'debit',
            accountType: 'sub',
            description: 'مجموعة حسابات مصروفات إهلاك الأصول الثابتة',
            isSystemAccount: true
          }, { transaction });
        }
      } else {
        // Create depreciation expenses parent under existing admin expenses
        depreciationExpensesParent = await Account.create({
          code: '2.1.1',
          name: 'مصروفات الإهلاك',
          nameEn: 'Depreciation Expenses',
          type: 'expense',
          rootType: 'Expense',
          reportType: 'Profit and Loss',
          parentId: adminExpensesParent.id,
          level: adminExpensesParent.level + 1,
          isGroup: true,
          isActive: true,
          balance: 0,
          currency: 'LYD',
          nature: 'debit',
          accountType: 'sub',
          description: 'مجموعة حسابات مصروفات إهلاك الأصول الثابتة',
          isSystemAccount: true
        }, { transaction });
      }
    }

    if (depreciationExpensesParent) {
      // Get next sequential number for depreciation expense accounts
      const existingDepreciationAccounts = await Account.count({
        where: {
          parentId: depreciationExpensesParent.id,
          code: { [Op.like]: `${depreciationExpensesParent.code}.%` }
        }
      });

      const depreciationExpenseCode = `${depreciationExpensesParent.code}.${existingDepreciationAccounts + 1}`;

      return await Account.create({
        code: depreciationExpenseCode,
        name: `مصروف إهلاك ${fixedAsset.name}`,
        nameEn: `Depreciation Expense - ${fixedAsset.nameEn || fixedAsset.name}`,
        type: 'expense',
        rootType: 'Expense',
        reportType: 'Profit and Loss',
        parentId: depreciationExpensesParent.id,
        level: depreciationExpensesParent.level + 1,
        isGroup: false,
        isActive: true,
        balance: 0,
        currency: fixedAsset.currency || 'LYD',
        nature: 'debit',
        accountType: 'sub',
        description: `حساب مصروف إهلاك الأصل الثابت: ${fixedAsset.name}`,
        isSystemAccount: false,
        isMonitored: true
      }, { transaction });
    }

    return null;
  } catch (error) {
    console.error('Error creating depreciation expense account:', error);
    throw error;
  }
};

/**
 * Create or find provisions parent account and create specific accumulated depreciation account
 */
const createAccumulatedDepreciationAccount = async (fixedAsset, transaction) => {
  try {
    // Find or create provisions parent account under liabilities
    let provisionsParent = await Account.findOne({
      where: {
        [Op.or]: [
          { name: { [likeOp]: '%المخصصات%' } },
          { nameEn: { [likeOp]: '%Provisions%' } }
        ],
        type: 'liability',
        isGroup: true
      }
    });

    if (!provisionsParent) {
      // Find current liabilities parent (3.1)
      const currentLiabilitiesParent = await Account.findOne({
        where: {
          [Op.or]: [
            { code: '3.1' },
            { name: { [likeOp]: '%الالتزامات المتداولة%' } },
            { nameEn: { [likeOp]: '%Current Liabilities%' } }
          ],
          type: 'liability'
        }
      });

      if (!currentLiabilitiesParent) {
        // Find main liabilities account (3)
        const mainLiabilitiesAccount = await Account.findOne({
          where: {
            code: '3',
            type: 'liability'
          }
        });

        if (mainLiabilitiesAccount) {
          // Create current liabilities parent first
          const newCurrentLiabilitiesParent = await Account.create({
            code: '3.1',
            name: 'الالتزامات المتداولة',
            nameEn: 'Current Liabilities',
            type: 'liability',
            rootType: 'Liability',
            reportType: 'Balance Sheet',
            parentId: mainLiabilitiesAccount.id,
            level: mainLiabilitiesAccount.level + 1,
            isGroup: true,
            isActive: true,
            balance: 0,
            currency: 'LYD',
            nature: 'credit',
            accountType: 'sub',
            description: 'مجموعة حسابات الالتزامات المتداولة',
            isSystemAccount: true
          }, { transaction });

          // Now create provisions parent
          provisionsParent = await Account.create({
            code: '3.1.2',
            name: 'المخصصات',
            nameEn: 'Provisions',
            type: 'liability',
            rootType: 'Liability',
            reportType: 'Balance Sheet',
            parentId: newCurrentLiabilitiesParent.id,
            level: newCurrentLiabilitiesParent.level + 1,
            isGroup: true,
            isActive: true,
            balance: 0,
            currency: 'LYD',
            nature: 'credit',
            accountType: 'sub',
            description: 'مجموعة حسابات المخصصات',
            isSystemAccount: true
          }, { transaction });
        }
      } else {
        // Create provisions parent under existing current liabilities
        provisionsParent = await Account.create({
          code: '3.1.2',
          name: 'المخصصات',
          nameEn: 'Provisions',
          type: 'liability',
          rootType: 'Liability',
          reportType: 'Balance Sheet',
          parentId: currentLiabilitiesParent.id,
          level: currentLiabilitiesParent.level + 1,
          isGroup: true,
          isActive: true,
          balance: 0,
          currency: 'LYD',
          nature: 'credit',
          accountType: 'sub',
          description: 'مجموعة حسابات المخصصات',
          isSystemAccount: true
        }, { transaction });
      }
    }

    if (provisionsParent) {
      // Get next sequential number for accumulated depreciation accounts
      const existingAccumulatedAccounts = await Account.count({
        where: {
          parentId: provisionsParent.id,
          code: { [Op.like]: `${provisionsParent.code}.%` }
        }
      });

      const accumulatedDepreciationCode = `${provisionsParent.code}.${existingAccumulatedAccounts + 1}`;

      return await Account.create({
        code: accumulatedDepreciationCode,
        name: `مخصص إهلاك ${fixedAsset.name}`,
        nameEn: `Accumulated Depreciation - ${fixedAsset.nameEn || fixedAsset.name}`,
        type: 'liability',
        rootType: 'Liability',
        reportType: 'Balance Sheet',
        parentId: provisionsParent.id,
        level: provisionsParent.level + 1,
        isGroup: false,
        isActive: true,
        balance: 0,
        currency: fixedAsset.currency || 'LYD',
        nature: 'credit',
        accountType: 'sub',
        description: `حساب مخصص إهلاك الأصل الثابت: ${fixedAsset.name}`,
        isSystemAccount: false,
        isMonitored: true
      }, { transaction });
    }

    return null;
  } catch (error) {
    console.error('Error creating accumulated depreciation account:', error);
    throw error;
  }
};

/**
 * Format number for display (remove decimal places for whole numbers)
 * @deprecated Use formatters from ../utils/formatters.js instead
 */
import { formatCurrencyAmount } from './formatters.js';

/**
 * Format number for display (remove decimal places for whole numbers)
 * @deprecated Use formatters from ../utils/formatters.js instead
 */
export const formatCurrency = (amount) => {
  return formatCurrencyAmount(amount, {
    showZeroDecimals: false
  });
};

/**
 * Ensure Fixed Assets parent and default categories exist
 * Creates parent 'الأصول الثابتة' (Fixed Assets) if missing, under main Asset root,
 * and ensures leaf categories: سيارات, معدات وآلات, أثاث
 */
export const ensureFixedAssetsStructure = async (transaction = null) => {
  console.log('🔧 ensureFixedAssetsStructure: Starting...');
  
  // 1) Find or create Fixed Assets parent (code '1.2' or by name)
  console.log('🔍 Looking for Fixed Assets parent account...');
  let fixedAssetsParent = await Account.findOne({
    where: {
      [Op.or]: [
        { code: '1.2' },
        { name: { [likeOp]: '%الأصول الثابتة%' } },
        { nameEn: { [likeOp]: '%Fixed Assets%' } }
      ],
      type: 'asset'
    }
  });
  
  console.log('🔍 Fixed Assets parent search result:', fixedAssetsParent?.name, fixedAssetsParent?.code);

  // If not found, try to locate main Assets root '1'
  if (!fixedAssetsParent) {
    console.log('❌ Fixed Assets parent not found, looking for main Assets root...');
    const assetsRoot = await Account.findOne({
      where: {
        code: '1',
        type: 'asset'
      }
    });
    
    console.log('🔍 Assets root search result:', assetsRoot?.name, assetsRoot?.code);

    if (assetsRoot) {
      console.log('✅ Found assets root, creating Fixed Assets parent under it...');
      // Create Fixed Assets parent under assets root
      fixedAssetsParent = await Account.create({
        code: '1.2',
        name: 'الأصول الثابتة',
        nameEn: 'Fixed Assets',
        type: 'asset',
        rootType: 'Asset',
        reportType: 'Balance Sheet',
        parentId: assetsRoot.id,
        level: (assetsRoot.level || 1) + 1,
        isGroup: true,
        isActive: true,
        balance: 0,
        currency: 'LYD',
        nature: 'debit',
        accountType: 'sub',
        description: 'مجموعة الأصول الثابتة',
        isSystemAccount: true
      }, { transaction });
      console.log('✅ Created Fixed Assets parent under assets root:', fixedAssetsParent.name, fixedAssetsParent.code);
    } else {
      console.log('❌ Assets root not found, creating Fixed Assets as top-level...');
      // As a last resort, create Fixed Assets as a top-level asset group with code '1.2'
      fixedAssetsParent = await Account.create({
        code: '1.2',
        name: 'الأصول الثابتة',
        nameEn: 'Fixed Assets',
        type: 'asset',
        rootType: 'Asset',
        reportType: 'Balance Sheet',
        parentId: null,
        level: 2,
        isGroup: true,
        isActive: true,
        balance: 0,
        currency: 'LYD',
        nature: 'debit',
        accountType: 'sub',
        description: 'مجموعة الأصول الثابتة',
        isSystemAccount: true
      }, { transaction });
      console.log('✅ Created Fixed Assets as top-level:', fixedAssetsParent.name, fixedAssetsParent.code);
    }
  } else {
    console.log('✅ Found existing Fixed Assets parent:', fixedAssetsParent.name, fixedAssetsParent.code);
  }

  // Helper to create/find a category by name and suggested code
  const ensureCategory = async (arabicName, englishName, suggestedCodeSuffix) => {
    console.log(`🔍 Ensuring category: ${arabicName} (${englishName})`);
    // Find existing by name under parent
    let cat = await Account.findOne({
      where: {
        parentId: fixedAssetsParent.id,
        [Op.or]: [
          { name: { [likeOp]: `%${arabicName}%` } },
          { nameEn: { [likeOp]: `%${englishName}%` } }
        ]
      }
    });

    if (cat) {
      console.log(`✅ Found existing category: ${cat.name} (${cat.code})`);
      return cat;
    }

    // Determine code
    const suggestedCode = `${fixedAssetsParent.code}.${suggestedCodeSuffix}`;
    console.log(`🔧 Suggested code for ${arabicName}: ${suggestedCode}`);
    // If suggested code taken, pick next available integer suffix
    let codeToUse = suggestedCode;
    const existingSameCode = await Account.findOne({ where: { code: codeToUse } });
    if (existingSameCode) {
      console.log(`❌ Suggested code ${suggestedCode} already taken, finding next available...`);
      // Find max numeric suffix
      const siblings = await Account.findAll({
        where: {
          parentId: fixedAssetsParent.id,
          code: { [Op.like]: `${fixedAssetsParent.code}.%` }
        },
        attributes: ['code']
      });
      let maxSuffix = 0;
      siblings.forEach(s => {
        const parts = String(s.code).split('.');
        const last = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(last) && last > maxSuffix) maxSuffix = last;
      });
      codeToUse = `${fixedAssetsParent.code}.${maxSuffix + 1}`;
      console.log(`🔧 Using code: ${codeToUse}`);
    }

    console.log(`➕ Creating new category: ${arabicName} with code ${codeToUse}`);
    return await Account.create({
      code: codeToUse,
      name: arabicName,
      nameEn: englishName,
      type: 'asset',
      rootType: 'Asset',
      reportType: 'Balance Sheet',
      parentId: fixedAssetsParent.id,
      level: (fixedAssetsParent.level || 2) + 1,
      isGroup: false,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      nature: 'debit',
      accountType: 'sub',
      description: `فئة أصل ثابت: ${arabicName}`,
      isSystemAccount: true
    }, { transaction });
  };

  console.log('🔧 Ensuring default categories...');
  const vehicles = await ensureCategory('سيارات', 'Vehicles', '1');
  const equipment = await ensureCategory('معدات وآلات', 'Equipment and Machinery', '2');
  const furniture = await ensureCategory('أثاث', 'Furniture', '3');
  
  console.log('✅ All categories ensured');
  return { fixedAssetsParent, vehicles, equipment, furniture };
};

