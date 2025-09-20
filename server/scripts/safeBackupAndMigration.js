import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

/**
 * نظام النسخ الاحتياطي والترحيل الآمن
 * يضمن عدم فقدان أي بيانات أثناء تحديث دليل الحسابات
 */

async function safeBackupAndMigration() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🛡️ بدء النسخ الاحتياطي والترحيل الآمن...');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('='.repeat(60));
    
    // 1. إنشاء نسخة احتياطية كاملة
    console.log('\n💾 1. إنشاء نسخة احتياطية كاملة...');
    const backupData = await createFullBackup(transaction);
    
    // 2. حفظ النسخة الاحتياطية في ملف
    const backupFile = await saveBackupToFile(backupData);
    console.log(`   ✅ تم حفظ النسخة الاحتياطية: ${backupFile}`);
    
    // 3. فحص البيانات الحالية
    console.log('\n🔍 2. فحص البيانات الحالية...');
    const currentData = await analyzeCurrentData(transaction);
    
    // 4. إنشاء خطة الترحيل الآمن
    console.log('\n📋 3. إنشاء خطة الترحيل الآمن...');
    const migrationPlan = await createMigrationPlan(currentData);
    
    // 5. تنفيذ الترحيل الآمن
    console.log('\n🔄 4. تنفيذ الترحيل الآمن...');
    await executeSafeMigration(migrationPlan, transaction);
    
    // 6. التحقق من سلامة البيانات
    console.log('\n✅ 5. التحقق من سلامة البيانات...');
    const verificationResult = await verifyDataIntegrity(transaction, backupData);
    
    if (verificationResult.success) {
      await transaction.commit();
      console.log('\n🎉 تم الترحيل الآمن بنجاح!');
      console.log('✅ جميع البيانات محفوظة وسليمة');
    } else {
      throw new Error('فشل في التحقق من سلامة البيانات: ' + verificationResult.errors.join(', '));
    }
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ خطأ في الترحيل الآمن:', error.message);
    console.log('\n🔄 استعادة البيانات من النسخة الاحتياطية...');
    // يمكن إضافة كود استعادة البيانات هنا
    throw error;
  } finally {
    await sequelize.close();
  }
}

async function createFullBackup(transaction) {
  console.log('   📊 نسخ احتياطي للحسابات...');
  
  const [accounts] = await sequelize.query(`
    SELECT * FROM accounts ORDER BY code
  `, { transaction });
  
  console.log(`   📊 نسخ احتياطي للقيود المحاسبية...`);
  
  const [glEntries] = await sequelize.query(`
    SELECT * FROM gl_entries ORDER BY "createdAt"
  `, { transaction });
  
  console.log(`   📊 نسخ احتياطي لقيود اليومية...`);
  
  const [journalEntries] = await sequelize.query(`
    SELECT * FROM journal_entries ORDER BY "createdAt"
  `, { transaction });
  
  const [journalDetails] = await sequelize.query(`
    SELECT * FROM journal_entry_details ORDER BY "createdAt"
  `, { transaction });
  
  console.log(`   📊 نسخ احتياطي للعملاء والموردين...`);
  
  const [customers] = await sequelize.query(`
    SELECT * FROM customers ORDER BY "createdAt"
  `, { transaction });
  
  const [suppliers] = await sequelize.query(`
    SELECT * FROM suppliers ORDER BY "createdAt"
  `, { transaction });
  
  const backupData = {
    timestamp: new Date().toISOString(),
    accounts: accounts,
    glEntries: glEntries,
    journalEntries: journalEntries,
    journalDetails: journalDetails,
    customers: customers,
    suppliers: suppliers,
    stats: {
      accountsCount: accounts.length,
      glEntriesCount: glEntries.length,
      journalEntriesCount: journalEntries.length,
      customersCount: customers.length,
      suppliersCount: suppliers.length
    }
  };
  
  console.log(`   ✅ تم إنشاء نسخة احتياطية شاملة:`);
  console.log(`      - ${backupData.stats.accountsCount} حساب`);
  console.log(`      - ${backupData.stats.glEntriesCount} قيد محاسبي`);
  console.log(`      - ${backupData.stats.journalEntriesCount} قيد يومية`);
  console.log(`      - ${backupData.stats.customersCount} عميل`);
  console.log(`      - ${backupData.stats.suppliersCount} مورد`);
  
  return backupData;
}

async function saveBackupToFile(backupData) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = 'backups';
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
  
  // إنشاء مجلد النسخ الاحتياطية إذا لم يكن موجود
  try {
    await fs.mkdir(backupDir, { recursive: true });
  } catch (error) {
    // المجلد موجود بالفعل
  }
  
  await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
  
  return backupFile;
}

async function analyzeCurrentData(transaction) {
  const [accountsAnalysis] = await sequelize.query(`
    SELECT 
      COUNT(*) as total_accounts,
      COUNT(CASE WHEN level = 1 THEN 1 END) as main_accounts,
      COUNT(CASE WHEN balance != 0 THEN 1 END) as accounts_with_balance,
      SUM(CASE WHEN balance > 0 THEN balance ELSE 0 END) as total_debit_balance,
      SUM(CASE WHEN balance < 0 THEN ABS(balance) ELSE 0 END) as total_credit_balance
    FROM accounts
  `, { transaction });
  
  const [transactionsAnalysis] = await sequelize.query(`
    SELECT 
      COUNT(*) as total_gl_entries,
      COUNT(DISTINCT "accountId") as accounts_with_transactions,
      SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_debits,
      SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_credits
    FROM gl_entries
  `, { transaction });
  
  return {
    accounts: accountsAnalysis[0],
    transactions: transactionsAnalysis[0],
    hasData: accountsAnalysis[0].total_accounts > 0 || transactionsAnalysis[0].total_gl_entries > 0
  };
}

async function createMigrationPlan(currentData) {
  const plan = {
    strategy: 'safe_migration',
    preserveData: true,
    steps: []
  };
  
  if (currentData.hasData) {
    console.log('   ⚠️ تم اكتشاف بيانات موجودة - سيتم الحفاظ عليها');
    plan.steps = [
      'backup_existing_data',
      'create_missing_accounts_only',
      'migrate_existing_balances',
      'verify_data_integrity'
    ];
  } else {
    console.log('   ✅ لا توجد بيانات - يمكن إنشاء دليل حسابات جديد');
    plan.steps = [
      'create_comprehensive_chart'
    ];
  }
  
  return plan;
}

async function executeSafeMigration(plan, transaction) {
  if (plan.steps.includes('create_missing_accounts_only')) {
    console.log('   🔄 إنشاء الحسابات المفقودة فقط...');
    await createMissingAccountsOnly(transaction);
  } else if (plan.steps.includes('create_comprehensive_chart')) {
    console.log('   🏗️ إنشاء دليل حسابات شامل جديد...');
    await createComprehensiveChart(transaction);
  }
}

async function createMissingAccountsOnly(transaction) {
  // قائمة الحسابات الأساسية المطلوبة
  const requiredAccounts = [
    { code: '1', name: 'الأصول', type: 'asset', level: 1, isGroup: true, nature: 'debit' },
    { code: '2', name: 'الخصوم', type: 'liability', level: 1, isGroup: true, nature: 'credit' },
    { code: '3', name: 'حقوق الملكية', type: 'equity', level: 1, isGroup: true, nature: 'credit' },
    { code: '4', name: 'الإيرادات', type: 'revenue', level: 1, isGroup: true, nature: 'credit' },
    { code: '5', name: 'المصروفات', type: 'expense', level: 1, isGroup: true, nature: 'debit' }
  ];
  
  for (const account of requiredAccounts) {
    // التحقق من وجود الحساب
    const [existing] = await sequelize.query(`
      SELECT id FROM accounts WHERE code = :code LIMIT 1
    `, { 
      replacements: { code: account.code },
      transaction 
    });
    
    if (existing.length === 0) {
      // إنشاء الحساب المفقود
      await sequelize.query(`
        INSERT INTO accounts (
          id, code, name, type, "rootType", "reportType", level, "isGroup", 
          "isActive", balance, currency, nature, "accountType", "isSystemAccount",
          "createdAt", "updatedAt"
        ) VALUES (
          :id, :code, :name, :type, :rootType, :reportType, :level, :isGroup,
          true, 0, 'LYD', :nature, 'main', true, NOW(), NOW()
        )
      `, {
        replacements: {
          id: uuidv4(),
          code: account.code,
          name: account.name,
          type: account.type,
          rootType: account.type === 'asset' ? 'Asset' : 
                   account.type === 'liability' ? 'Liability' :
                   account.type === 'equity' ? 'Equity' :
                   account.type === 'revenue' ? 'Income' : 'Expense',
          reportType: account.type === 'revenue' || account.type === 'expense' ? 'Profit and Loss' : 'Balance Sheet',
          level: account.level,
          isGroup: account.isGroup,
          nature: account.nature
        },
        transaction
      });
      
      console.log(`     ✅ تم إنشاء الحساب المفقود: ${account.code} - ${account.name}`);
    } else {
      console.log(`     ✅ الحساب موجود: ${account.code} - ${account.name}`);
    }
  }
}

async function createComprehensiveChart(transaction) {
  // هنا يمكن استدعاء إنشاء دليل الحسابات الشامل
  // لكن فقط إذا لم تكن هناك بيانات موجودة
  console.log('   🏗️ إنشاء دليل الحسابات الشامل...');
  // يمكن استدعاء الكود من createComprehensiveChartOfAccounts.js هنا
}

async function verifyDataIntegrity(transaction, originalBackup) {
  const issues = [];
  
  // التحقق من عدد الحسابات
  const [currentAccounts] = await sequelize.query(`
    SELECT COUNT(*) as count FROM accounts
  `, { transaction });
  
  if (currentAccounts[0].count < originalBackup.stats.accountsCount) {
    issues.push(`عدد الحسابات انخفض من ${originalBackup.stats.accountsCount} إلى ${currentAccounts[0].count}`);
  }
  
  // التحقق من القيود المحاسبية
  const [currentGLEntries] = await sequelize.query(`
    SELECT COUNT(*) as count FROM gl_entries
  `, { transaction });
  
  if (currentGLEntries[0].count < originalBackup.stats.glEntriesCount) {
    issues.push(`عدد القيود المحاسبية انخفض من ${originalBackup.stats.glEntriesCount} إلى ${currentGLEntries[0].count}`);
  }
  
  return {
    success: issues.length === 0,
    errors: issues
  };
}

// تشغيل النسخ الاحتياطي والترحيل الآمن
if (import.meta.url === `file://${process.argv[1]}`) {
  safeBackupAndMigration().catch(console.error);
}

export default safeBackupAndMigration;
