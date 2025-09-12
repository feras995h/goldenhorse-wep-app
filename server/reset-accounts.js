import { Sequelize } from 'sequelize';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || 'goldenhorse_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// New simple accounts structure
const NEW_ACCOUNTS = [
  {
    code: '1',
    name: 'الأصول',
    nameEn: 'Assets',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 1,
    isGroup: true,
    isActive: true,
    balance: 0,
    currency: 'LYD',
    nature: 'debit',
    description: 'حساب الأصول الأساسي - يشمل جميع الأصول المملوكة للشركة',
    notes: 'حساب نظام أساسي',
    isSystemAccount: false // Changed to false to allow editing
  },
  {
    code: '2',
    name: 'المصروفات',
    nameEn: 'Expenses',
    type: 'expense',
    rootType: 'Expense',
    reportType: 'Profit and Loss',
    level: 1,
    isGroup: true,
    isActive: true,
    balance: 0,
    currency: 'LYD',
    nature: 'debit',
    description: 'حساب المصروفات الأساسي - يشمل جميع المصروفات التشغيلية',
    notes: 'حساب نظام أساسي',
    isSystemAccount: false
  },
  {
    code: '3',
    name: 'الالتزامات',
    nameEn: 'Liabilities',
    type: 'liability',
    rootType: 'Liability',
    reportType: 'Balance Sheet',
    level: 1,
    isGroup: true,
    isActive: true,
    balance: 0,
    currency: 'LYD',
    nature: 'credit',
    description: 'حساب الالتزامات الأساسي - يشمل جميع الديون والالتزامات',
    notes: 'حساب نظام أساسي',
    isSystemAccount: false
  },
  {
    code: '4',
    name: 'حقوق الملكية',
    nameEn: 'Equity',
    type: 'equity',
    rootType: 'Equity',
    reportType: 'Balance Sheet',
    level: 1,
    isGroup: true,
    isActive: true,
    balance: 0,
    currency: 'LYD',
    nature: 'credit',
    description: 'حساب حقوق الملكية الأساسي - يشمل رأس المال والأرباح المحتجزة',
    notes: 'حساب نظام أساسي',
    isSystemAccount: false
  },
  {
    code: '5',
    name: 'الإيرادات',
    nameEn: 'Revenue',
    type: 'revenue',
    rootType: 'Income',
    reportType: 'Profit and Loss',
    level: 1,
    isGroup: true,
    isActive: true,
    balance: 0,
    currency: 'LYD',
    nature: 'credit',
    description: 'حساب الإيرادات الأساسي - يشمل جميع الإيرادات التشغيلية',
    notes: 'حساب نظام أساسي',
    isSystemAccount: false
  }
];

async function resetAccounts() {
  try {
    console.log('🔄 بدء إعادة تعيين الحسابات...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // Step 1: Delete all existing accounts
    console.log('\n🗑️ حذف جميع الحسابات الموجودة...');
    
    // First, remove all foreign key constraints by setting parentId to null
    await sequelize.query(`
      UPDATE accounts SET "parentId" = NULL WHERE "parentId" IS NOT NULL;
    `);
    console.log('✅ تم إزالة جميع الروابط الأبوية');

    // Delete all GL entries that reference accounts
    await sequelize.query(`DELETE FROM gl_entries WHERE "accountId" IS NOT NULL;`);
    console.log('✅ تم حذف جميع القيود المحاسبية');

    // Delete all journal entry details that reference accounts
    await sequelize.query(`DELETE FROM journal_entry_details WHERE "accountId" IS NOT NULL;`);
    console.log('✅ تم حذف جميع تفاصيل القيود');

    // Now delete all accounts
    await sequelize.query(`DELETE FROM accounts WHERE 1=1;`);
    console.log('✅ تم حذف جميع الحسابات');

    // Step 2: Create new accounts with simple numbering
    console.log('\n📊 إنشاء الحسابات الجديدة بالترقيم البسيط...');
    
    for (const account of NEW_ACCOUNTS) {
      try {
        await sequelize.query(`
          INSERT INTO accounts (
            id, code, name, "nameEn", type, "rootType", "reportType", 
            level, "isGroup", "isActive", balance, currency, nature,
            description, notes, "isSystemAccount", "accountType",
            "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid(), :code, :name, :nameEn, :type, :rootType, :reportType,
            :level, :isGroup, :isActive, :balance, :currency, :nature,
            :description, :notes, :isSystemAccount, 'main',
            NOW(), NOW()
          )
        `, {
          replacements: account,
          type: sequelize.QueryTypes.INSERT
        });
        
        console.log(`✅ تم إنشاء الحساب: ${account.code} - ${account.name}`);
      } catch (error) {
        console.error(`❌ خطأ في إنشاء الحساب ${account.code}:`, error.message);
      }
    }

    // Step 3: Verify the new accounts
    console.log('\n📋 التحقق من الحسابات الجديدة...');
    const [results] = await sequelize.query(`
      SELECT code, name, type, nature, "isSystemAccount"
      FROM accounts 
      ORDER BY code ASC
    `);

    console.log('\n📊 الحسابات الجديدة:');
    console.log('الرقم\tاسم الحساب\t\tالنوع\t\tالطبيعة\tنظام');
    console.log('----\t----------\t\t----\t\t------\t----');
    
    results.forEach(account => {
      const nature = account.nature === 'debit' ? 'مدين' : 'دائن';
      const isSystem = account.isSystemAccount ? 'نعم' : 'لا';
      console.log(`${account.code}\t${account.name}\t\t${account.type}\t${nature}\t${isSystem}`);
    });

    console.log(`\n🎉 تم إنشاء ${results.length} حساب بنجاح!`);
    console.log('\n✅ تم إعادة تعيين الحسابات بالترقيم البسيط بنجاح!');
    console.log('\n📝 ملاحظات:');
    console.log('- جميع الحسابات قابلة للتعديل والحذف (isSystemAccount = false)');
    console.log('- نظام الترقيم البسيط: 1, 2, 3, 4, 5');
    console.log('- الحسابات الفرعية ستكون: 1.1, 1.2, 2.1, 2.2, إلخ');
    console.log('- يمكنك الآن استخدام صفحة "إدارة الحسابات المتقدمة" لإدارة الحسابات');

  } catch (error) {
    console.error('❌ خطأ في إعادة تعيين الحسابات:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Run the script
resetAccounts();
