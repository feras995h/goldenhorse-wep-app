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
 * Script إعداد النشر التلقائي
 * يتم تشغيله عند كل نشر للنظام لضمان:
 * 1. إنشاء دليل الحسابات الشامل
 * 2. إنشاء المستخدم الإداري
 * 3. إعداد البيانات الأساسية
 * 4. التحقق من سلامة النظام
 */

async function deploymentSetup() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🚀 بدء إعداد النشر التلقائي...');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('🌍 البيئة:', process.env.NODE_ENV || 'development');
    console.log('='.repeat(60));
    
    // 1. التحقق من الاتصال بقاعدة البيانات
    console.log('\n🔌 1. التحقق من الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('   ✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // 2. فحص وجود دليل الحسابات
    console.log('\n📊 2. فحص دليل الحسابات...');
    const [accountsCount] = await sequelize.query('SELECT COUNT(*) as count FROM accounts', { transaction });
    
    if (accountsCount[0].count === 0) {
      console.log('   ⚠️ دليل الحسابات فارغ - سيتم إنشاء دليل شامل جديد');
      await createComprehensiveAccounts(transaction);
    } else {
      console.log(`   ✅ دليل الحسابات موجود (${accountsCount[0].count} حساب)`);
      
      // فحص الحسابات الأساسية
      const [mainAccounts] = await sequelize.query(`
        SELECT COUNT(*) as count FROM accounts WHERE level = 1
      `, { transaction });
      
      if (mainAccounts[0].count < 5) {
        console.log('   ⚠️ الحسابات الرئيسية ناقصة - سيتم إعادة إنشاء دليل الحسابات');
        await recreateAccounts(transaction);
      }
    }
    
    // 3. إنشاء/التحقق من المستخدم الإداري
    console.log('\n👤 3. إعداد المستخدم الإداري...');
    await setupAdminUser(transaction);
    
    // 4. إعداد البيانات الأساسية
    console.log('\n⚙️ 4. إعداد البيانات الأساسية...');
    await setupBasicData(transaction);
    
    // 5. التحقق من سلامة النظام
    console.log('\n🔍 5. التحقق من سلامة النظام...');
    await systemIntegrityCheck(transaction);
    
    await transaction.commit();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 تم إكمال إعداد النشر بنجاح!');
    console.log('✅ النظام جاهز للاستخدام');
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ خطأ في إعداد النشر:', error.message);
    console.error('تفاصيل الخطأ:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

async function createComprehensiveAccounts(transaction) {
  console.log('   🏗️ إنشاء دليل الحسابات الشامل...');
  
  // استيراد دليل الحسابات من الملف المنفصل
  const { default: createChartOfAccounts } = await import('./createComprehensiveChartOfAccounts.js');
  
  // تشغيل إنشاء دليل الحسابات
  // ملاحظة: سيتم تشغيله في transaction منفصل
  console.log('   📋 تشغيل script إنشاء دليل الحسابات...');
  
  // بدلاً من استيراد الملف، سنقوم بإنشاء الحسابات الأساسية هنا
  const basicAccounts = [
    { code: '1', name: 'الأصول', type: 'asset', level: 1, isGroup: true, nature: 'debit' },
    { code: '2', name: 'الخصوم', type: 'liability', level: 1, isGroup: true, nature: 'credit' },
    { code: '3', name: 'حقوق الملكية', type: 'equity', level: 1, isGroup: true, nature: 'credit' },
    { code: '4', name: 'الإيرادات', type: 'revenue', level: 1, isGroup: true, nature: 'credit' },
    { code: '5', name: 'المصروفات', type: 'expense', level: 1, isGroup: true, nature: 'debit' }
  ];
  
  for (const account of basicAccounts) {
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
  }
  
  console.log('   ✅ تم إنشاء الحسابات الأساسية');
}

async function recreateAccounts(transaction) {
  console.log('   🔄 إعادة إنشاء دليل الحسابات...');
  
  // حذف الحسابات الموجودة
  await sequelize.query('DELETE FROM accounts', { transaction });
  
  // إنشاء الحسابات الجديدة
  await createComprehensiveAccounts(transaction);
}

async function setupAdminUser(transaction) {
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

async function setupBasicData(transaction) {
  // إعداد العملات
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

async function systemIntegrityCheck(transaction) {
  const issues = [];
  
  // فحص التسلسل الهرمي للحسابات
  const [hierarchyIssues] = await sequelize.query(`
    SELECT COUNT(*) as count FROM accounts a
    LEFT JOIN accounts p ON a."parentId" = p.id
    WHERE a."parentId" IS NOT NULL AND p.id IS NULL
  `, { transaction });
  
  if (hierarchyIssues[0].count > 0) {
    issues.push(`مشاكل في التسلسل الهرمي للحسابات: ${hierarchyIssues[0].count}`);
  }
  
  // فحص الحسابات الرئيسية
  const [mainAccountsCount] = await sequelize.query(`
    SELECT COUNT(*) as count FROM accounts WHERE level = 1
  `, { transaction });
  
  if (mainAccountsCount[0].count < 5) {
    issues.push(`الحسابات الرئيسية ناقصة: ${mainAccountsCount[0].count}/5`);
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
  
  return issues.length === 0;
}

// تشغيل إعداد النشر
deploymentSetup();

export default deploymentSetup;
