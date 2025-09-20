import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function debugCompleteAdvancedCreation() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔍 Debugging complete advanced fixed asset creation with name "F"...');
    
    // Get available category accounts
    const [categories] = await sequelize.query(`
      SELECT id, code, name, level, "parentId"
      FROM accounts 
      WHERE code LIKE '1.2.%' 
      AND code != '1.2' 
      AND level = 3 
      AND "isActive" = true
      ORDER BY code
      LIMIT 3
    `);
    
    console.log('📊 Available category accounts:', categories.length);
    categories.forEach(cat => {
      console.log(`   ${cat.code}: ${cat.name} (level ${cat.level})`);
    });
    
    if (categories.length === 0) {
      console.log('❌ No category accounts available');
      await transaction.rollback();
      return;
    }
    
    // Create a test fixed asset with name "F"
    const assetData = {
      id: uuidv4(),
      assetNumber: 'TEST-F-COMPLETE-' + Date.now(),
      name: 'F', // This is the problematic name
      category: 'other',
      categoryAccountId: categories[0].id,
      purchaseDate: '2025-09-20',
      purchaseCost: 1000,
      usefulLife: 5,
      depreciationMethod: 'straight_line',
      currentValue: 1000,
      status: 'active',
      location: 'Test Location',
      description: 'Test asset with name F'
    };
    
    console.log('\n📝 Asset data:', assetData);
    
    // 1. Create the fixed asset
    console.log('\n🏗️ Step 1: Creating the fixed asset...');
    const [fixedAssetResult] = await sequelize.query(`
      INSERT INTO fixed_assets (
        id, "assetNumber", name, category, "categoryAccountId", "purchaseDate",
        "purchaseCost", "usefulLife", "depreciationMethod", "currentValue", 
        status, location, description, "createdAt", "updatedAt"
      ) VALUES (
        :id, :assetNumber, :name, :category, :categoryAccountId, :purchaseDate,
        :purchaseCost, :usefulLife, :depreciationMethod, :currentValue,
        :status, :location, :description, NOW(), NOW()
      ) RETURNING id, "assetNumber", name
    `, {
      replacements: assetData,
      transaction,
      type: Sequelize.QueryTypes.INSERT
    });
    
    console.log('✅ Fixed asset created:', fixedAssetResult[0]);
    
    // 2. Get category account details
    console.log('\n📋 Step 2: Getting category account details...');
    const [categoryAccount] = await sequelize.query(`
      SELECT id, code, name, level, "parentId"
      FROM accounts 
      WHERE id = :categoryId
    `, {
      replacements: { categoryId: assetData.categoryAccountId },
      transaction,
      type: Sequelize.QueryTypes.SELECT
    });
    
    console.log('✅ Category account:', categoryAccount);
    
    // 3. Create related accounts (this is where the issue might occur)
    console.log('\n🏦 Step 3: Creating related accounts...');
    const createdAccounts = {};
    
    // 3a. Create specific asset account
    console.log('   Creating asset account...');
    const existingCodes = await sequelize.query(`
      SELECT code FROM accounts 
      WHERE code LIKE :parentPattern
      ORDER BY code ASC
    `, {
      replacements: { parentPattern: `${categoryAccount.code}.%` },
      transaction,
      type: Sequelize.QueryTypes.SELECT
    });
    
    let maxNumber = 0;
    const pattern = new RegExp(`^${categoryAccount.code.replace('.', '\\.')}\\.([0-9]+)$`);
    
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
    const nextSubCode = `${categoryAccount.code}.${String(nextNumber).padStart(3, '0')}`;
    
    const assetAccountData = {
      id: uuidv4(),
      code: nextSubCode,
      name: `${assetData.name} - أصل`, // "F - أصل"
      nameEn: `${assetData.name} - Asset`,
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
      description: `حساب الأصل الثابت: ${assetData.name}`,
      isSystemAccount: false
    };
    
    console.log('   Asset account data:', assetAccountData);
    
    const [assetAccountResult] = await sequelize.query(`
      INSERT INTO accounts (
        id, code, name, "nameEn", type, "rootType", "reportType",
        "parentId", level, "isGroup", "isActive", balance, currency,
        nature, "accountType", description, "isSystemAccount",
        "createdAt", "updatedAt"
      ) VALUES (
        :id, :code, :name, :nameEn, :type, :rootType, :reportType,
        :parentId, :level, :isGroup, :isActive, :balance, :currency,
        :nature, :accountType, :description, :isSystemAccount,
        NOW(), NOW()
      ) RETURNING id, code, name
    `, {
      replacements: assetAccountData,
      transaction,
      type: Sequelize.QueryTypes.INSERT
    });
    
    createdAccounts.assetAccount = assetAccountResult[0];
    console.log('   ✅ Asset account created:', assetAccountResult[0]);
    
    // 3b. Create accumulated depreciation account
    console.log('   Creating accumulated depreciation account...');
    let accDepParent = await sequelize.query(`
      SELECT id, code, name, level, "parentId"
      FROM accounts 
      WHERE code = '1.2.5'
    `, {
      transaction,
      type: Sequelize.QueryTypes.SELECT
    });
    
    if (accDepParent.length === 0) {
      console.log('   Creating accumulated depreciation parent account...');
      // Find fixed assets parent
      const [fixedAssetsParent] = await sequelize.query(`
        SELECT id, code, name, level, "parentId"
        FROM accounts 
        WHERE code = '1.2'
      `, {
        transaction,
        type: Sequelize.QueryTypes.SELECT
      });
      
      // Create accumulated depreciation parent
      const accDepParentData = {
        id: uuidv4(),
        code: '1.2.5',
        name: 'مجمع إهلاك الأصول الثابتة',
        nameEn: 'Accumulated Depreciation - Fixed Assets',
        type: 'asset',
        rootType: 'Asset',
        reportType: 'Balance Sheet',
        parentId: fixedAssetsParent[0]?.id,
        level: 3,
        isGroup: true,
        isActive: true,
        balance: 0,
        currency: 'LYD',
        nature: 'credit',
        accountType: 'sub',
        description: 'مجموعة حسابات مجمع إهلاك الأصول الثابتة',
        isSystemAccount: true
      };
      
      const [accDepParentResult] = await sequelize.query(`
        INSERT INTO accounts (
          id, code, name, "nameEn", type, "rootType", "reportType",
          "parentId", level, "isGroup", "isActive", balance, currency,
          nature, "accountType", description, "isSystemAccount",
          "createdAt", "updatedAt"
        ) VALUES (
          :id, :code, :name, :nameEn, :type, :rootType, :reportType,
          :parentId, :level, :isGroup, :isActive, :balance, :currency,
          :nature, :accountType, :description, :isSystemAccount,
          NOW(), NOW()
        ) RETURNING id, code, name
      `, {
        replacements: accDepParentData,
        transaction,
        type: Sequelize.QueryTypes.INSERT
      });
      
      accDepParent = [accDepParentResult[0]];
    }
    
    // Create specific accumulated depreciation account
    const existingAccDepCodes = await sequelize.query(`
      SELECT code FROM accounts 
      WHERE code LIKE :parentPattern
      ORDER BY code ASC
    `, {
      replacements: { parentPattern: `${accDepParent[0].code}.%` },
      transaction,
      type: Sequelize.QueryTypes.SELECT
    });
    
    let maxAccDepNumber = 0;
    const accDepPattern = new RegExp(`^${accDepParent[0].code.replace('.', '\\.')}\\.([0-9]+)$`);
    
    existingAccDepCodes.forEach(account => {
      const match = account.code.match(accDepPattern);
      if (match) {
        const number = parseInt(match[1]);
        if (number > maxAccDepNumber) {
          maxAccDepNumber = number;
        }
      }
    });
    
    const nextAccDepNumber = maxAccDepNumber + 1;
    const nextAccDepSubCode = `${accDepParent[0].code}.${String(nextAccDepNumber).padStart(3, '0')}`;
    
    const accDepAccountData = {
      id: uuidv4(),
      code: nextAccDepSubCode,
      name: `مجمع إهلاك - ${assetData.name}`, // "مجمع إهلاك - F"
      nameEn: `Accumulated Depreciation - ${assetData.name}`,
      type: 'asset',
      rootType: 'Asset',
      reportType: 'Balance Sheet',
      parentId: accDepParent[0].id,
      level: accDepParent[0].level + 1,
      isGroup: false,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      nature: 'credit',
      accountType: 'sub',
      description: `حساب مجمع إهلاك الأصل الثابت: ${assetData.name}`,
      isSystemAccount: false
    };
    
    const [accDepAccountResult] = await sequelize.query(`
      INSERT INTO accounts (
        id, code, name, "nameEn", type, "rootType", "reportType",
        "parentId", level, "isGroup", "isActive", balance, currency,
        nature, "accountType", description, "isSystemAccount",
        "createdAt", "updatedAt"
      ) VALUES (
        :id, :code, :name, :nameEn, :type, :rootType, :reportType,
        :parentId, :level, :isGroup, :isActive, :balance, :currency,
        :nature, :accountType, :description, :isSystemAccount,
        NOW(), NOW()
      ) RETURNING id, code, name
    `, {
      replacements: accDepAccountData,
      transaction,
      type: Sequelize.QueryTypes.INSERT
    });
    
    createdAccounts.accumulatedDepreciationAccount = accDepAccountResult[0];
    console.log('   ✅ Accumulated depreciation account created:', accDepAccountResult[0]);
    
    // 3c. Create depreciation expense account
    console.log('   Creating depreciation expense account...');
    let depExpParent = await sequelize.query(`
      SELECT id, code, name, level, "parentId"
      FROM accounts 
      WHERE code = '2.1.5'
    `, {
      transaction,
      type: Sequelize.QueryTypes.SELECT
    });
    
    if (depExpParent.length === 0) {
      console.log('   Creating depreciation expense parent account...');
      // Find operating expenses parent
      const [operatingExpParent] = await sequelize.query(`
        SELECT id, code, name, level, "parentId"
        FROM accounts 
        WHERE code = '2.1'
      `, {
        transaction,
        type: Sequelize.QueryTypes.SELECT
      });
      
      // Create depreciation expense parent
      const depExpParentData = {
        id: uuidv4(),
        code: '2.1.5',
        name: 'مصروفات الإهلاك',
        nameEn: 'Depreciation Expenses',
        type: 'expense',
        rootType: 'Expense',
        reportType: 'Profit and Loss',
        parentId: operatingExpParent[0]?.id,
        level: 3,
        isGroup: true,
        isActive: true,
        balance: 0,
        currency: 'LYD',
        nature: 'debit',
        accountType: 'sub',
        description: 'مجموعة حسابات مصروفات الإهلاك',
        isSystemAccount: true
      };
      
      const [depExpParentResult] = await sequelize.query(`
        INSERT INTO accounts (
          id, code, name, "nameEn", type, "rootType", "reportType",
          "parentId", level, "isGroup", "isActive", balance, currency,
          nature, "accountType", description, "isSystemAccount",
          "createdAt", "updatedAt"
        ) VALUES (
          :id, :code, :name, :nameEn, :type, :rootType, :reportType,
          :parentId, :level, :isGroup, :isActive, :balance, :currency,
          :nature, :accountType, :description, :isSystemAccount,
          NOW(), NOW()
        ) RETURNING id, code, name
      `, {
        replacements: depExpParentData,
        transaction,
        type: Sequelize.QueryTypes.INSERT
      });
      
      depExpParent = [depExpParentResult[0]];
    }
    
    // Create specific depreciation expense account
    const existingDepExpCodes = await sequelize.query(`
      SELECT code FROM accounts 
      WHERE code LIKE :parentPattern
      ORDER BY code ASC
    `, {
      replacements: { parentPattern: `${depExpParent[0].code}.%` },
      transaction,
      type: Sequelize.QueryTypes.SELECT
    });
    
    let maxDepExpNumber = 0;
    const depExpPattern = new RegExp(`^${depExpParent[0].code.replace('.', '\\.')}\\.([0-9]+)$`);
    
    existingDepExpCodes.forEach(account => {
      const match = account.code.match(depExpPattern);
      if (match) {
        const number = parseInt(match[1]);
        if (number > maxDepExpNumber) {
          maxDepExpNumber = number;
        }
      }
    });
    
    const nextDepExpNumber = maxDepExpNumber + 1;
    const nextDepExpSubCode = `${depExpParent[0].code}.${String(nextDepExpNumber).padStart(3, '0')}`;
    
    const depExpAccountData = {
      id: uuidv4(),
      code: nextDepExpSubCode,
      name: `مصروف إهلاك - ${assetData.name}`, // "مصروف إهلاك - F"
      nameEn: `Depreciation Expense - ${assetData.name}`,
      type: 'expense',
      rootType: 'Expense',
      reportType: 'Profit and Loss',
      parentId: depExpParent[0].id,
      level: depExpParent[0].level + 1,
      isGroup: false,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      nature: 'debit',
      accountType: 'sub',
      description: `حساب مصروف إهلاك الأصل الثابت: ${assetData.name}`,
      isSystemAccount: false
    };
    
    const [depExpAccountResult] = await sequelize.query(`
      INSERT INTO accounts (
        id, code, name, "nameEn", type, "rootType", "reportType",
        "parentId", level, "isGroup", "isActive", balance, currency,
        nature, "accountType", description, "isSystemAccount",
        "createdAt", "updatedAt"
      ) VALUES (
        :id, :code, :name, :nameEn, :type, :rootType, :reportType,
        :parentId, :level, :isGroup, :isActive, :balance, :currency,
        :nature, :accountType, :description, :isSystemAccount,
        NOW(), NOW()
      ) RETURNING id, code, name
    `, {
      replacements: depExpAccountData,
      transaction,
      type: Sequelize.QueryTypes.INSERT
    });
    
    createdAccounts.depreciationExpenseAccount = depExpAccountResult[0];
    console.log('   ✅ Depreciation expense account created:', depExpAccountResult[0]);
    
    // 4. Update fixed asset with account IDs
    console.log('\n✏️ Step 4: Updating fixed asset with account IDs...');
    await sequelize.query(`
      UPDATE fixed_assets 
      SET "assetAccountId" = :assetAccountId,
          "depreciationExpenseAccountId" = :depreciationExpenseAccountId,
          "accumulatedDepreciationAccountId" = :accumulatedDepreciationAccountId
      WHERE id = :assetId
    `, {
      replacements: {
        assetId: assetData.id,
        assetAccountId: createdAccounts.assetAccount.id,
        depreciationExpenseAccountId: createdAccounts.depreciationExpenseAccount.id,
        accumulatedDepreciationAccountId: createdAccounts.accumulatedDepreciationAccount.id
      },
      transaction,
      type: Sequelize.QueryTypes.UPDATE
    });
    
    console.log('✅ Fixed asset updated with account IDs');
    
    // 5. Create purchase journal entry
    console.log('\n📝 Step 5: Creating purchase journal entry...');
    
    // Get a cash account for credit entry
    const [cashAccounts] = await sequelize.query(`
      SELECT id, code, name 
      FROM accounts 
      WHERE code IN ('1.1.1.1', '1.1.1') OR name LIKE '%صندوق%' OR name LIKE '%نقد%'
      LIMIT 1
    `, {
      transaction,
      type: Sequelize.QueryTypes.SELECT
    });
    
    if (cashAccounts.length === 0) {
      throw new Error('No cash account found for asset purchase entry');
    }
    
    const cashAccount = cashAccounts[0];
    console.log('   Cash account:', cashAccount);
    
    // Create journal entry
    const journalEntryData = {
      id: uuidv4(),
      entryNumber: `FA-PUR-${Date.now()}`,
      date: assetData.purchaseDate,
      description: `شراء أصل ثابت: ${assetData.name}`,
      totalDebit: assetData.purchaseCost,
      totalCredit: assetData.purchaseCost,
      status: 'posted',
      postedBy: uuidv4(), // This should be a valid user ID in real scenario
      postedAt: new Date()
    };
    
    console.log('   Journal entry data:', journalEntryData);
    
    const [journalEntryResult] = await sequelize.query(`
      INSERT INTO journal_entries (
        id, "entryNumber", date, description, "totalDebit", "totalCredit",
        status, "postedBy", "postedAt", "createdAt", "updatedAt"
      ) VALUES (
        :id, :entryNumber, :date, :description, :totalDebit, :totalCredit,
        :status, :postedBy, :postedAt, NOW(), NOW()
      ) RETURNING id, "entryNumber", description
    `, {
      replacements: journalEntryData,
      transaction,
      type: Sequelize.QueryTypes.INSERT
    });
    
    console.log('   ✅ Journal entry created:', journalEntryResult[0]);
    
    // 6. Create GL entries
    console.log('\n💼 Step 6: Creating GL entries...');
    const glEntries = [
      {
        id: uuidv4(),
        postingDate: assetData.purchaseDate,
        accountId: createdAccounts.assetAccount.id,
        debit: assetData.purchaseCost,
        credit: 0,
        voucherType: 'Asset Purchase',
        voucherNo: journalEntryData.entryNumber,
        journalEntryId: journalEntryResult[0].id,
        remarks: `شراء أصل ثابت - ${assetData.name}`,
        createdBy: journalEntryData.postedBy,
        currency: 'LYD',
        exchangeRate: 1.0
      },
      {
        id: uuidv4(),
        postingDate: assetData.purchaseDate,
        accountId: cashAccount.id,
        debit: 0,
        credit: assetData.purchaseCost,
        voucherType: 'Asset Purchase',
        voucherNo: journalEntryData.entryNumber,
        journalEntryId: journalEntryResult[0].id,
        remarks: `دفع ثمن أصل ثابت - ${assetData.name}`,
        createdBy: journalEntryData.postedBy,
        currency: 'LYD',
        exchangeRate: 1.0
      }
    ];
    
    console.log('   GL entries data:', glEntries);
    
    for (let i = 0; i < glEntries.length; i++) {
      const entry = glEntries[i];
      console.log(`   Creating GL entry ${i + 1}...`);
      
      const [glEntryResult] = await sequelize.query(`
        INSERT INTO gl_entries (
          id, "postingDate", "accountId", debit, credit, "voucherType", 
          "voucherNo", "journalEntryId", remarks, "createdBy", currency, 
          "exchangeRate", "createdAt", "updatedAt"
        ) VALUES (
          :id, :postingDate, :accountId, :debit, :credit, :voucherType,
          :voucherNo, :journalEntryId, :remarks, :createdBy, :currency,
          :exchangeRate, NOW(), NOW()
        ) RETURNING id, "voucherNo", "voucherType"
      `, {
        replacements: entry,
        transaction,
        type: Sequelize.QueryTypes.INSERT
      });
      
      console.log(`   ✅ GL entry ${i + 1} created:`, glEntryResult[0]);
    }
    
    // If we reach here, everything worked
    console.log('\n🎉 All steps completed successfully!');
    console.log('✅ Fixed asset with name "F" was created successfully with all related accounts and entries');
    
    // Rollback the transaction to clean up
    await transaction.rollback();
    console.log('🗑️ Rolled back transaction (cleaned up test data)');
    
  } catch (error) {
    console.log('❌ Error in complete advanced creation:', error.message);
    console.log('Error stack:', error.stack);
    
    // Rollback the transaction
    await transaction.rollback();
    console.log('🗑️ Rolled back transaction due to error');
  } finally {
    await sequelize.close();
  }
}

debugCompleteAdvancedCreation();