import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Sequelize, DataTypes } from 'sequelize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// إعداد قاعدة البيانات
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: join(__dirname, 'server', 'database.sqlite'),
  logging: false
});

// تعريف نموذج الحساب
const Account = sequelize.define('Account', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  nameEn: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('asset', 'liability', 'equity', 'revenue', 'expense'),
    allowNull: false
  },
  isGroup: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  parentCode: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  balance: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'accounts',
  timestamps: true
});

// دليل الحسابات الكامل
const chartOfAccounts = [
  // الأصول (Assets) - 1
  { code: '1', name: 'الأصول', nameEn: 'Assets', type: 'asset', isGroup: true, parentCode: null },
  { code: '1.1', name: 'الأصول المتداولة', nameEn: 'Current Assets', type: 'asset', isGroup: true, parentCode: '1' },
  { code: '1.1.1', name: 'النقدية والبنوك', nameEn: 'Cash and Banks', type: 'asset', isGroup: true, parentCode: '1.1' },
  { code: '1.1.1.1', name: 'الصندوق', nameEn: 'Cash', type: 'asset', isGroup: false, parentCode: '1.1.1', balance: 0 },
  { code: '1.1.1.2', name: 'البنك الأهلي', nameEn: 'National Bank', type: 'asset', isGroup: false, parentCode: '1.1.1', balance: 0 },
  { code: '1.1.1.3', name: 'بنك الجمهورية', nameEn: 'Republic Bank', type: 'asset', isGroup: false, parentCode: '1.1.1', balance: 0 },
  
  { code: '1.1.2', name: 'المدينون', nameEn: 'Accounts Receivable', type: 'asset', isGroup: true, parentCode: '1.1' },
  { code: '1.1.2.1', name: 'عملاء', nameEn: 'Customers', type: 'asset', isGroup: false, parentCode: '1.1.2', balance: 0 },
  { code: '1.1.2.2', name: 'أوراق القبض', nameEn: 'Notes Receivable', type: 'asset', isGroup: false, parentCode: '1.1.2', balance: 0 },
  
  { code: '1.1.3', name: 'المخزون', nameEn: 'Inventory', type: 'asset', isGroup: true, parentCode: '1.1' },
  { code: '1.1.3.1', name: 'مخزون البضائع', nameEn: 'Merchandise Inventory', type: 'asset', isGroup: false, parentCode: '1.1.3', balance: 0 },
  { code: '1.1.3.2', name: 'مخزون المواد الخام', nameEn: 'Raw Materials', type: 'asset', isGroup: false, parentCode: '1.1.3', balance: 0 },
  
  { code: '1.2', name: 'الأصول الثابتة', nameEn: 'Fixed Assets', type: 'asset', isGroup: true, parentCode: '1' },
  { code: '1.2.1', name: 'الأراضي', nameEn: 'Land', type: 'asset', isGroup: false, parentCode: '1.2', balance: 0 },
  { code: '1.2.2', name: 'المباني', nameEn: 'Buildings', type: 'asset', isGroup: false, parentCode: '1.2', balance: 0 },
  { code: '1.2.3', name: 'الآلات والمعدات', nameEn: 'Machinery & Equipment', type: 'asset', isGroup: false, parentCode: '1.2', balance: 0 },
  { code: '1.2.4', name: 'الأثاث والتجهيزات', nameEn: 'Furniture & Fixtures', type: 'asset', isGroup: false, parentCode: '1.2', balance: 0 },
  { code: '1.2.5', name: 'السيارات', nameEn: 'Vehicles', type: 'asset', isGroup: false, parentCode: '1.2', balance: 0 },
  { code: '1.2.6', name: 'أجهزة الحاسوب', nameEn: 'Computer Equipment', type: 'asset', isGroup: false, parentCode: '1.2', balance: 0 },
  { code: '1.2.7', name: 'مجمع الاستهلاك', nameEn: 'Accumulated Depreciation', type: 'asset', isGroup: false, parentCode: '1.2', balance: 0 },

  // الخصوم (Liabilities) - 2
  { code: '2', name: 'الخصوم', nameEn: 'Liabilities', type: 'liability', isGroup: true, parentCode: null },
  { code: '2.1', name: 'الخصوم المتداولة', nameEn: 'Current Liabilities', type: 'liability', isGroup: true, parentCode: '2' },
  { code: '2.1.1', name: 'الدائنون', nameEn: 'Accounts Payable', type: 'liability', isGroup: true, parentCode: '2.1' },
  { code: '2.1.1.1', name: 'موردون', nameEn: 'Suppliers', type: 'liability', isGroup: false, parentCode: '2.1.1', balance: 0 },
  { code: '2.1.1.2', name: 'أوراق الدفع', nameEn: 'Notes Payable', type: 'liability', isGroup: false, parentCode: '2.1.1', balance: 0 },
  
  { code: '2.1.2', name: 'مصروفات مستحقة', nameEn: 'Accrued Expenses', type: 'liability', isGroup: false, parentCode: '2.1', balance: 0 },
  { code: '2.1.3', name: 'ضرائب مستحقة', nameEn: 'Accrued Taxes', type: 'liability', isGroup: false, parentCode: '2.1', balance: 0 },
  
  { code: '2.2', name: 'مصروف الاستهلاك', nameEn: 'Depreciation Expense', type: 'expense', isGroup: false, parentCode: '2', balance: 0 },

  // حقوق الملكية (Equity) - 3
  { code: '3', name: 'حقوق الملكية', nameEn: 'Equity', type: 'equity', isGroup: true, parentCode: null },
  { code: '3.1', name: 'رأس المال', nameEn: 'Capital', type: 'equity', isGroup: false, parentCode: '3', balance: 0 },
  { code: '3.2', name: 'الأرباح المحتجزة', nameEn: 'Retained Earnings', type: 'equity', isGroup: false, parentCode: '3', balance: 0 },
  { code: '3.3', name: 'أرباح العام الحالي', nameEn: 'Current Year Earnings', type: 'equity', isGroup: false, parentCode: '3', balance: 0 },

  // الإيرادات (Revenue) - 4
  { code: '4', name: 'الإيرادات', nameEn: 'Revenue', type: 'revenue', isGroup: true, parentCode: null },
  { code: '4.1', name: 'إيرادات المبيعات', nameEn: 'Sales Revenue', type: 'revenue', isGroup: false, parentCode: '4', balance: 0 },
  { code: '4.2', name: 'إيرادات الخدمات', nameEn: 'Service Revenue', type: 'revenue', isGroup: false, parentCode: '4', balance: 0 },
  { code: '4.3', name: 'إيرادات أخرى', nameEn: 'Other Revenue', type: 'revenue', isGroup: false, parentCode: '4', balance: 0 },

  // المصروفات (Expenses) - 5
  { code: '5', name: 'المصروفات', nameEn: 'Expenses', type: 'expense', isGroup: true, parentCode: null },
  { code: '5.1', name: 'تكلفة البضاعة المباعة', nameEn: 'Cost of Goods Sold', type: 'expense', isGroup: false, parentCode: '5', balance: 0 },
  { code: '5.2', name: 'مصروفات التشغيل', nameEn: 'Operating Expenses', type: 'expense', isGroup: true, parentCode: '5' },
  { code: '5.2.1', name: 'مواد نظافة', nameEn: 'Cleaning Supplies', type: 'expense', isGroup: false, parentCode: '5.2', balance: 300 },
  { code: '5.2.2', name: 'رواتب الموظفين', nameEn: 'Employee Salaries', type: 'expense', isGroup: false, parentCode: '5.2', balance: 0 },
  { code: '5.2.3', name: 'إيجار المكتب', nameEn: 'Office Rent', type: 'expense', isGroup: false, parentCode: '5.2', balance: 0 },
  { code: '5.2.4', name: 'فواتير الكهرباء', nameEn: 'Electricity Bills', type: 'expense', isGroup: false, parentCode: '5.2', balance: 0 },
  { code: '5.2.5', name: 'فواتير الهاتف', nameEn: 'Phone Bills', type: 'expense', isGroup: false, parentCode: '5.2', balance: 0 },
  { code: '5.3', name: 'مصروفات إدارية', nameEn: 'Administrative Expenses', type: 'expense', isGroup: false, parentCode: '5', balance: 0 },
  { code: '5.4', name: 'مصروفات مالية', nameEn: 'Financial Expenses', type: 'expense', isGroup: false, parentCode: '5', balance: 0 }
];

async function restoreAccounts() {
  try {
    console.log('🔄 بدء استعادة دليل الحسابات...');
    
    // التحقق من الاتصال بقاعدة البيانات
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // عد الحسابات الموجودة
    const existingCount = await Account.count();
    console.log(`📊 عدد الحسابات الموجودة حالياً: ${existingCount}`);
    
    if (existingCount === 0) {
      console.log('⚠️  لا توجد حسابات! سيتم إنشاء دليل الحسابات كاملاً...');
      
      // إنشاء الحسابات بالترتيب الصحيح (الآباء أولاً)
      for (const accountData of chartOfAccounts) {
        try {
          const existingAccount = await Account.findOne({ where: { code: accountData.code } });
          
          if (!existingAccount) {
            await Account.create({
              ...accountData,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            console.log(`✅ تم إنشاء الحساب: ${accountData.code} - ${accountData.name}`);
          } else {
            console.log(`⏭️  الحساب موجود: ${accountData.code} - ${accountData.name}`);
          }
        } catch (error) {
          console.error(`❌ خطأ في إنشاء الحساب ${accountData.code}:`, error.message);
        }
      }
      
      const finalCount = await Account.count();
      console.log(`🎉 تم الانتهاء! العدد النهائي للحسابات: ${finalCount}`);
      
    } else {
      console.log('✅ توجد حسابات في قاعدة البيانات');
      
      // عرض عينة من الحسابات الموجودة
      const sampleAccounts = await Account.findAll({
        limit: 10,
        attributes: ['code', 'name', 'type', 'isGroup'],
        order: [['code', 'ASC']]
      });
      
      console.log('📋 عينة من الحسابات الموجودة:');
      sampleAccounts.forEach(account => {
        console.log(`  ${account.code} - ${account.name} (${account.type})`);
      });
    }
    
  } catch (error) {
    console.error('❌ خطأ في استعادة الحسابات:', error);
  } finally {
    await sequelize.close();
    console.log('🔒 تم إغلاق الاتصال بقاعدة البيانات');
  }
}

restoreAccounts();
