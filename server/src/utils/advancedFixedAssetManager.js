import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import models, { sequelize } from '../models/index.js';

const { Account, FixedAsset, JournalEntry, GLEntry } = models;

/**
 * Advanced Fixed Asset Manager
 * Handles automatic account creation, journal entries, and depreciation scheduling
 */
class AdvancedFixedAssetManager {
  
  /**
   * Create sub-accounts for a fixed asset
   * Creates: Asset Account, Accumulated Depreciation Account, Depreciation Expense Account
   */
  async createFixedAssetAccounts(fixedAsset, categoryAccount, transaction) {
    try {
      console.log(`🏗️ Creating accounts for asset: ${fixedAsset.name}`);
      
      const createdAccounts = {};
      
      // 1. Create specific asset account (e.g., 1.2.1.001)
      const assetAccount = await this.createAssetAccount(fixedAsset, categoryAccount, transaction);
      createdAccounts.assetAccount = assetAccount;
      
      // 2. Create accumulated depreciation account (e.g., 1.2.5.001)
      const accumulatedDepAccount = await this.createAccumulatedDepreciationAccount(fixedAsset, categoryAccount, transaction);
      createdAccounts.accumulatedDepreciationAccount = accumulatedDepAccount;
      
      // 3. Create depreciation expense account (e.g., 2.1.5.001)
      const depExpenseAccount = await this.createDepreciationExpenseAccount(fixedAsset, categoryAccount, transaction);
      createdAccounts.depreciationExpenseAccount = depExpenseAccount;
      
      console.log(`✅ Created ${Object.keys(createdAccounts).length} accounts for asset ${fixedAsset.assetNumber}`);
      
      return createdAccounts;
      
    } catch (error) {
      console.error('❌ Error creating fixed asset accounts:', error);
      throw error;
    }
  }
  
  /**
   * Create specific asset account under category
   */
  async createAssetAccount(fixedAsset, categoryAccount, transaction) {
    // Find next available sub-account number under this category
    const nextSubCode = await this.getNextSubAccountCode(categoryAccount.code);
    
    const assetAccount = await Account.create({
      id: uuidv4(),
      code: nextSubCode,
      name: `${fixedAsset.name} - أصل`,
      nameEn: `${fixedAsset.name} - Asset`,
      type: 'asset',
      rootType: 'Asset',
      reportType: 'Balance Sheet',
      parentId: categoryAccount.id,
      level: categoryAccount.level + 1,
      isGroup: false,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      nature: 'debit',
      accountType: 'sub',
      description: `حساب الأصل الثابت: ${fixedAsset.name}`,
      isSystemAccount: false
    }, { transaction });
    
    console.log(`  ✓ Asset Account: ${assetAccount.code} - ${assetAccount.name}`);
    return assetAccount;
  }
  
  /**
   * Create accumulated depreciation account
   */
  async createAccumulatedDepreciationAccount(fixedAsset, categoryAccount, transaction) {
    // Find or create accumulated depreciation parent account (1.2.5)
    let accDepParent = await Account.findOne({
      where: { code: '1.2.5' }
    });
    
    if (!accDepParent) {
      // Create accumulated depreciation parent
      const fixedAssetsParent = await Account.findOne({
        where: { code: '1.2' }
      });
      
      accDepParent = await Account.create({
        id: uuidv4(),
        code: '1.2.5',
        name: 'مجمع إهلاك الأصول الثابتة',
        nameEn: 'Accumulated Depreciation - Fixed Assets',
        type: 'asset',
        rootType: 'Asset',
        reportType: 'Balance Sheet',
        parentId: fixedAssetsParent?.id,
        level: 3,
        isGroup: true,
        isActive: true,
        balance: 0,
        currency: 'LYD',
        nature: 'credit', // Contra-asset account
        accountType: 'sub',
        description: 'مجموعة حسابات مجمع إهلاك الأصول الثابتة',
        isSystemAccount: true
      }, { transaction });
    }
    
    // Create specific accumulated depreciation account
    const nextSubCode = await this.getNextSubAccountCode(accDepParent.code);
    
    const accDepAccount = await Account.create({
      id: uuidv4(),
      code: nextSubCode,
      name: `مجمع إهلاك - ${fixedAsset.name}`,
      nameEn: `Accumulated Depreciation - ${fixedAsset.name}`,
      type: 'asset',
      rootType: 'Asset',
      reportType: 'Balance Sheet',
      parentId: accDepParent.id,
      level: accDepParent.level + 1,
      isGroup: false,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      nature: 'credit', // Contra-asset account
      accountType: 'sub',
      description: `حساب مجمع إهلاك الأصل الثابت: ${fixedAsset.name}`,
      isSystemAccount: false
    }, { transaction });
    
    console.log(`  ✓ Accumulated Depreciation Account: ${accDepAccount.code} - ${accDepAccount.name}`);
    return accDepAccount;
  }
  
  /**
   * Create depreciation expense account
   */
  async createDepreciationExpenseAccount(fixedAsset, categoryAccount, transaction) {
    // Find or create depreciation expense parent account (2.1.5)
    let depExpParent = await Account.findOne({
      where: { code: '2.1.5' }
    });
    
    if (!depExpParent) {
      // Find operating expenses parent (2.1)
      const operatingExpParent = await Account.findOne({
        where: { code: '2.1' }
      });
      
      depExpParent = await Account.create({
        id: uuidv4(),
        code: '2.1.5',
        name: 'مصروفات الإهلاك',
        nameEn: 'Depreciation Expenses',
        type: 'expense',
        rootType: 'Expense',
        reportType: 'Profit and Loss',
        parentId: operatingExpParent?.id,
        level: 3,
        isGroup: true,
        isActive: true,
        balance: 0,
        currency: 'LYD',
        nature: 'debit',
        accountType: 'sub',
        description: 'مجموعة حسابات مصروفات الإهلاك',
        isSystemAccount: true
      }, { transaction });
    }
    
    // Create specific depreciation expense account
    const nextSubCode = await this.getNextSubAccountCode(depExpParent.code);
    
    const depExpAccount = await Account.create({
      id: uuidv4(),
      code: nextSubCode,
      name: `مصروف إهلاك - ${fixedAsset.name}`,
      nameEn: `Depreciation Expense - ${fixedAsset.name}`,
      type: 'expense',
      rootType: 'Expense',
      reportType: 'Profit and Loss',
      parentId: depExpParent.id,
      level: depExpParent.level + 1,
      isGroup: false,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      nature: 'debit',
      accountType: 'sub',
      description: `حساب مصروف إهلاك الأصل الثابت: ${fixedAsset.name}`,
      isSystemAccount: false
    }, { transaction });
    
    console.log(`  ✓ Depreciation Expense Account: ${depExpAccount.code} - ${depExpAccount.name}`);
    return depExpAccount;
  }
  
  /**
   * Get next available sub-account code under a parent
   */
  async getNextSubAccountCode(parentCode) {
    const existingCodes = await Account.findAll({
      where: {
        code: {
          [Op.like]: `${parentCode}.%`
        }
      },
      attributes: ['code'],
      order: [['code', 'ASC']]
    });
    
    let maxNumber = 0;
    const pattern = new RegExp(`^${parentCode.replace('.', '\\.')}\\.([0-9]+)$`);
    
    existingCodes.forEach(account => {
      const match = account.code.match(pattern);
      if (match) {
        const number = parseInt(match[1]);
        if (number > maxNumber) {
          maxNumber = number;
        }
      }
    });
    
    const nextNumber = maxNumber + 1;
    return `${parentCode}.${String(nextNumber).padStart(3, '0')}`;
  }
  
  /**
   * Create journal entry for asset purchase
   */
  async createAssetPurchaseEntry(fixedAsset, createdAccounts, userId, transaction) {
    try {
      console.log(`📝 Creating purchase journal entry for asset: ${fixedAsset.name}`);
      
      // Generate unique entry number
      const timestamp = Date.now();
      const entryNumber = `FA-PUR-${timestamp}`;
      
      // Find cash/bank account for credit entry
      const cashAccount = await Account.findOne({
        where: {
          [Op.or]: [
            { code: '1.1.1.1' }, // الصندوق
            { code: '1.1.1' },   // النقدية والبنوك
            { name: { [Op.like]: '%صندوق%' } },
            { name: { [Op.like]: '%نقد%' } }
          ]
        }
      });
      
      if (!cashAccount) {
        throw new Error('Cash account not found for asset purchase entry');
      }
      
      // Create journal entry
      const journalEntry = await JournalEntry.create({
        id: uuidv4(),
        entryNumber,
        date: fixedAsset.purchaseDate,
        description: `شراء أصل ثابت: ${fixedAsset.name}`,
        totalDebit: fixedAsset.purchaseCost,
        totalCredit: fixedAsset.purchaseCost,
        status: 'posted',
        postedBy: userId,
        postedAt: new Date()
      }, { transaction });
      
      // Create GL entries
      const glEntries = [
        {
          id: uuidv4(),
          postingDate: fixedAsset.purchaseDate,
          accountId: createdAccounts.assetAccount.id,
          debit: fixedAsset.purchaseCost,
          credit: 0,
          voucherType: 'Asset Purchase',
          voucherNo: entryNumber,
          journalEntryId: journalEntry.id,
          remarks: `شراء أصل ثابت - ${fixedAsset.name}`,
          createdBy: userId,
          currency: 'LYD',
          exchangeRate: 1.0
        },
        {
          id: uuidv4(),
          postingDate: fixedAsset.purchaseDate,
          accountId: cashAccount.id,
          debit: 0,
          credit: fixedAsset.purchaseCost,
          voucherType: 'Asset Purchase',
          voucherNo: entryNumber,
          journalEntryId: journalEntry.id,
          remarks: `دفع ثمن أصل ثابت - ${fixedAsset.name}`,
          createdBy: userId,
          currency: 'LYD',
          exchangeRate: 1.0
        }
      ];
      
      await GLEntry.bulkCreate(glEntries, { transaction });
      
      console.log(`✅ Created purchase journal entry: ${entryNumber}`);
      return journalEntry;
      
    } catch (error) {
      console.error('❌ Error creating asset purchase entry:', error);
      throw error;
    }
  }
  
  /**
   * Generate depreciation schedule for an asset
   */
  async generateDepreciationSchedule(fixedAsset, transaction) {
    try {
      console.log(`📊 Generating depreciation schedule for asset: ${fixedAsset.name}`);
      
      // Use the existing PostgreSQL function
      const [result] = await sequelize.query(
        'SELECT generate_depreciation_schedule(:assetId) as months_created',
        {
          replacements: { assetId: fixedAsset.id },
          type: sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      
      console.log(`✅ Generated ${result.months_created} months of depreciation schedule`);
      return result.months_created;
      
    } catch (error) {
      console.error('❌ Error generating depreciation schedule:', error);
      throw error;
    }
  }
  
  /**
   * Complete fixed asset creation with all advanced features
   */
  async createCompleteFixedAsset(assetData, userId, transaction) {
    try {
      console.log(`🚀 Creating complete fixed asset: ${assetData.name}`);
      
      // 1. Create the fixed asset
      const fixedAsset = await FixedAsset.create(assetData, { transaction });
      
      // 2. Get category account
      const categoryAccount = await Account.findByPk(assetData.categoryAccountId);
      if (!categoryAccount) {
        throw new Error('Category account not found');
      }
      
      // 3. Create related accounts
      const createdAccounts = await this.createFixedAssetAccounts(fixedAsset, categoryAccount, transaction);
      
      // 4. Update fixed asset with account IDs
      await fixedAsset.update({
        assetAccountId: createdAccounts.assetAccount?.id,
        depreciationExpenseAccountId: createdAccounts.depreciationExpenseAccount?.id,
        accumulatedDepreciationAccountId: createdAccounts.accumulatedDepreciationAccount?.id
      }, { transaction });
      
      // 5. Create purchase journal entry
      const journalEntry = await this.createAssetPurchaseEntry(fixedAsset, createdAccounts, userId, transaction);
      
      // 6. Generate depreciation schedule
      const monthsCreated = await this.generateDepreciationSchedule(fixedAsset, transaction);
      
      console.log(`🎉 Successfully created complete fixed asset with ${monthsCreated} months of depreciation`);
      
      return {
        fixedAsset,
        createdAccounts,
        journalEntry,
        depreciationMonths: monthsCreated
      };
      
    } catch (error) {
      console.error('❌ Error creating complete fixed asset:', error);
      throw error;
    }
  }
}

export default new AdvancedFixedAssetManager();
