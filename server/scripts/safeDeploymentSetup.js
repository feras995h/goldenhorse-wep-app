import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

/**
 * Script إعداد النشر الآمن
 * يحافظ على البيانات الموجودة ولا يحذف أي شيء
 * يضيف الحسابات المفقودة فقط
 */

async function safeDeploymentSetup() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🛡️ بدء إعداد النشر الآمن...');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('🌍 البيئة:', process.env.NODE_ENV || 'development');
    console.log('⚠️ وضع الحماية: تم تفعيل حماية البيانات');
    console.log('='.repeat(60));
    
    // 1. التحقق من الاتصال بقاعدة البيانات
    console.log('\n🔌 1. التحقق من الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('   ✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // 2. فحص البيانات الموجودة
    console.log('\n📊 2. فحص البيانات الموجودة...');
    const dataAnalysis = await analyzeExistingData(transaction);
    
    // 3. إنشاء الحسابات المفقودة فقط
    console.log('\n🏗️ 3. إنشاء الحسابات المفقودة فقط...');
    await createMissingAccountsSafely(transaction, dataAnalysis);
    
    // 4. إنشاء/التحقق من المستخدم الإداري
    console.log('\n👤 4. إعداد المستخدم الإداري...');
    await setupAdminUserSafely(transaction);
    
    // 5. إعداد البيانات الأساسية
    console.log('\n⚙️ 5. إعداد البيانات الأساسية...');
    await setupBasicDataSafely(transaction);
    
    // 6. التحقق من سلامة النظام
    console.log('\n🔍 6. التحقق من سلامة النظام...');
    const integrityCheck = await systemIntegrityCheckSafe(transaction);
    
    if (integrityCheck.success) {
      await transaction.commit();
      
      console.log('\n' + '='.repeat(60));
      console.log('🎉 تم إكمال إعداد النشر الآمن بنجاح!');
      console.log('✅ جميع البيانات الموجودة محفوظة');
      console.log('✅ تم إضافة الحسابات المفقودة فقط');
      console.log('✅ النظام جاهز للاستخدام');
      
      // عرض ملخص التغييرات
      console.log('\n📊 ملخص التغييرات:');
      console.log(`   📈 الحسابات قبل: ${dataAnalysis.accountsBefore}`);
      console.log(`   📈 الحسابات بعد: ${dataAnalysis.accountsBefore + (dataAnalysis.missingMainAccounts || 0)}`);
      console.log(`   💾 القيود المحاسبية: ${dataAnalysis.glEntries} (محفوظة)`);
      console.log(`   👥 العملاء: ${dataAnalysis.customers} (محفوظة)`);
      console.log(`   🏪 الموردين: ${dataAnalysis.suppliers} (محفوظة)`);
      
    } else {
      throw new Error('فشل في فحص سلامة النظام: ' + integrityCheck.errors.join(', '));
    }
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ خطأ في إعداد النشر الآمن:', error.message);
    console.error('🔄 تم التراجع عن جميع التغييرات');
    console.error('💾 البيانات الأصلية محفوظة');
    throw error;
  } finally {
    await sequelize.close();
  }
}

async function analyzeExistingData(transaction) {
  console.log('   🔍 تحليل البيانات الموجودة...');
  
  // فحص الحسابات
  const [accountsData] = await sequelize.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN level = 1 THEN 1 END) as main_accounts,
      COUNT(CASE WHEN balance != 0 THEN 1 END) as accounts_with_balance
    FROM accounts
  `, { transaction });
  
  // فحص القيود المحاسبية
  const [glData] = await sequelize.query(`
    SELECT COUNT(*) as count FROM gl_entries
  `, { transaction });
  
  // فحص العملاء والموردين
  const [customersData] = await sequelize.query(`
    SELECT COUNT(*) as count FROM customers
  `, { transaction });
  
  const [suppliersData] = await sequelize.query(`
    SELECT COUNT(*) as count FROM suppliers
  `, { transaction });
  
  const analysis = {
    accountsBefore: parseInt(accountsData[0].total),
    mainAccounts: parseInt(accountsData[0].main_accounts),
    accountsWithBalance: parseInt(accountsData[0].accounts_with_balance),
    glEntries: parseInt(glData[0].count),
    customers: parseInt(customersData[0].count),
    suppliers: parseInt(suppliersData[0].count),
    hasImportantData: accountsData[0].accounts_with_balance > 0 || glData[0].count > 0
  };
  
  console.log(`   📊 الحسابات الموجودة: ${analysis.accountsBefore}`);
  console.log(`   📊 الحسابات الرئيسية: ${analysis.mainAccounts}/5`);
  console.log(`   📊 حسابات بأرصدة: ${analysis.accountsWithBalance}`);
  console.log(`   📊 القيود المحاسبية: ${analysis.glEntries}`);
  console.log(`   📊 العملاء: ${analysis.customers}`);
  console.log(`   📊 الموردين: ${analysis.suppliers}`);
  
  if (analysis.hasImportantData) {
    console.log('   ⚠️ تم اكتشاف بيانات مهمة - سيتم الحفاظ عليها');
  } else {
    console.log('   ✅ لا توجد بيانات مهمة - آمن للتعديل');
  }
  
  return analysis;
}

async function createMissingAccountsSafely(transaction, analysis) {
  // قائمة الحسابات الرئيسية المطلوبة
  const requiredMainAccounts = [
    { code: '1', name: 'الأصول', type: 'asset', level: 1, isGroup: true, nature: 'debit' },
    { code: '2', name: 'الخصوم', type: 'liability', level: 1, isGroup: true, nature: 'credit' },
    { code: '3', name: 'حقوق الملكية', type: 'equity', level: 1, isGroup: true, nature: 'credit' },
    { code: '4', name: 'الإيرادات', type: 'revenue', level: 1, isGroup: true, nature: 'credit' },
    { code: '5', name: 'المصروفات', type: 'expense', level: 1, isGroup: true, nature: 'debit' }
  ];
  
  let addedCount = 0;
  
  for (const account of requiredMainAccounts) {
    // التحقق من وجود الحساب
    const [existing] = await sequelize.query(`
      SELECT id FROM accounts WHERE code = :code LIMIT 1
    `, { 
      replacements: { code: account.code },
      transaction 
    });
    
    if (existing.length === 0) {
      // إنشاء الحساب المفقود فقط
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
      
      console.log(`   ✅ تم إضافة الحساب المفقود: ${account.code} - ${account.name}`);
      addedCount++;
    } else {
      console.log(`   ✅ الحساب موجود: ${account.code} - ${account.name}`);
    }
  }
  
  if (addedCount === 0) {
    console.log('   ✅ جميع الحسابات الرئيسية موجودة');
  } else {
    console.log(`   ✅ تم إضافة ${addedCount} حساب رئيسي مفقود`);
  }
  
  analysis.missingMainAccounts = addedCount;
}

async function setupAdminUserSafely(transaction) {
  // التحقق من وجود المستخدم الإداري
  const [existingAdmin] = await sequelize.query(`
    SELECT id FROM users WHERE username = 'admin' LIMIT 1
  `, { transaction });
  
  if (existingAdmin.length === 0) {
    console.log('   🔐 إنشاء المستخدم الإداري...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await sequelize.query(`
      INSERT INTO users (
        id, username, password, name, role, "isActive", "createdAt", "updatedAt"
      ) VALUES (
        :id, 'admin', :password, 'مدير النظام', 'admin', true, NOW(), NOW()
      )
    `, {
      replacements: {
        id: uuidv4(),
        password: hashedPassword
      },
      transaction
    });
    
    console.log('   ✅ تم إنشاء المستخدم الإداري (admin/admin123)');
  } else {
    console.log('   ✅ المستخدم الإداري موجود');
  }
}

async function setupBasicDataSafely(transaction) {
  // إعداد العملات إذا لم تكن موجودة
  const [currenciesCount] = await sequelize.query('SELECT COUNT(*) as count FROM currencies', { transaction });
  
  if (currenciesCount[0].count === 0) {
    console.log('   💱 إنشاء العملات الأساسية...');
    
    const currencies = [
      { code: 'LYD', name: 'دينار ليبي', symbol: 'د.ل', isDefault: true },
      { code: 'USD', name: 'دولار أمريكي', symbol: '$', isDefault: false },
      { code: 'EUR', name: 'يورو', symbol: '€', isDefault: false }
    ];
    
    for (const currency of currencies) {
      await sequelize.query(`
        INSERT INTO currencies (
          id, code, name, symbol, "isDefault", "isActive", "createdAt", "updatedAt"
        ) VALUES (
          :id, :code, :name, :symbol, :isDefault, true, NOW(), NOW()
        )
      `, {
        replacements: {
          id: uuidv4(),
          ...currency
        },
        transaction
      });
    }
    
    console.log('   ✅ تم إنشاء العملات الأساسية');
  } else {
    console.log('   ✅ العملات الأساسية موجودة');
  }
}

async function systemIntegrityCheckSafe(transaction) {
  const issues = [];
  
  // فحص الحسابات الرئيسية
  const [mainAccountsCount] = await sequelize.query(`
    SELECT COUNT(*) as count FROM accounts WHERE level = 1
  `, { transaction });
  
  if (mainAccountsCount[0].count < 5) {
    issues.push(`الحسابات الرئيسية ناقصة: ${mainAccountsCount[0].count}/5`);
  }
  
  // فحص التسلسل الهرمي
  const [hierarchyIssues] = await sequelize.query(`
    SELECT COUNT(*) as count FROM accounts a
    LEFT JOIN accounts p ON a."parentId" = p.id
    WHERE a."parentId" IS NOT NULL AND p.id IS NULL
  `, { transaction });
  
  if (hierarchyIssues[0].count > 0) {
    issues.push(`مشاكل في التسلسل الهرمي: ${hierarchyIssues[0].count}`);
  }
  
  // فحص المستخدمين
  const [usersCount] = await sequelize.query(`
    SELECT COUNT(*) as count FROM users WHERE "isActive" = true
  `, { transaction });
  
  if (usersCount[0].count === 0) {
    issues.push('لا يوجد مستخدمين نشطين');
  }
  
  if (issues.length === 0) {
    console.log('   ✅ جميع فحوصات السلامة نجحت');
  } else {
    console.log('   ⚠️ مشاكل في سلامة النظام:');
    issues.forEach(issue => console.log(`     - ${issue}`));
  }
  
  return {
    success: issues.length === 0,
    errors: issues
  };
}

// تشغيل إعداد النشر الآمن
safeDeploymentSetup().catch(console.error);

export default safeDeploymentSetup;
