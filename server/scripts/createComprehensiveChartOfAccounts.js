import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

// دليل الحسابات الشامل الجديد
const comprehensiveChartOfAccounts = [
  // ========== 1. الأصول (Assets) ==========
  {
    code: '1',
    name: 'الأصول',
    nameEn: 'Assets',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 1,
    isGroup: true,
    nature: 'debit',
    accountType: 'main',
    parentCode: null,
    isSystemAccount: true
  },
  
  // 1.1 الأصول المتداولة
  {
    code: '1.1',
    name: 'الأصول المتداولة',
    nameEn: 'Current Assets',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 2,
    isGroup: true,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '1',
    isSystemAccount: true
  },
  
  // 1.1.1 النقدية والبنوك
  {
    code: '1.1.1',
    name: 'النقدية والبنوك',
    nameEn: 'Cash and Banks',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 3,
    isGroup: true,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '1.1',
    isSystemAccount: true
  },
  {
    code: '1.1.1.001',
    name: 'الصندوق الرئيسي',
    nameEn: 'Main Cash',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 4,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '1.1.1',
    isSystemAccount: true
  },
  {
    code: '1.1.1.002',
    name: 'صندوق فرعي',
    nameEn: 'Petty Cash',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 4,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '1.1.1',
    isSystemAccount: true
  },
  {
    code: '1.1.1.101',
    name: 'البنك الأهلي التجاري',
    nameEn: 'National Commercial Bank',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 4,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '1.1.1',
    isSystemAccount: true
  },
  {
    code: '1.1.1.102',
    name: 'مصرف الجمهورية',
    nameEn: 'Republic Bank',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 4,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '1.1.1',
    isSystemAccount: true
  },
  
  // 1.1.2 العملاء والمدينون
  {
    code: '1.1.2',
    name: 'العملاء والمدينون',
    nameEn: 'Accounts Receivable',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 3,
    isGroup: true,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '1.1',
    isSystemAccount: true
  },
  {
    code: '1.1.2.001',
    name: 'عملاء محليون',
    nameEn: 'Local Customers',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 4,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '1.1.2',
    isSystemAccount: true
  },
  {
    code: '1.1.2.002',
    name: 'عملاء أجانب',
    nameEn: 'Foreign Customers',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 4,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '1.1.2',
    isSystemAccount: true
  },
  {
    code: '1.1.2.003',
    name: 'أوراق القبض',
    nameEn: 'Notes Receivable',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 4,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '1.1.2',
    isSystemAccount: true
  },
  
  // 1.1.3 المخزون
  {
    code: '1.1.3',
    name: 'المخزون',
    nameEn: 'Inventory',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 3,
    isGroup: true,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '1.1',
    isSystemAccount: true
  },
  {
    code: '1.1.3.001',
    name: 'مخزون البضائع',
    nameEn: 'Merchandise Inventory',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 4,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '1.1.3',
    isSystemAccount: true
  },
  {
    code: '1.1.3.002',
    name: 'مخزون المواد الخام',
    nameEn: 'Raw Materials Inventory',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 4,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '1.1.3',
    isSystemAccount: true
  },
  {
    code: '1.1.3.003',
    name: 'مخزون قطع الغيار',
    nameEn: 'Spare Parts Inventory',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 4,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '1.1.3',
    isSystemAccount: true
  },
  
  // 1.1.4 المصروفات المدفوعة مقدماً
  {
    code: '1.1.4',
    name: 'المصروفات المدفوعة مقدماً',
    nameEn: 'Prepaid Expenses',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 3,
    isGroup: true,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '1.1',
    isSystemAccount: true
  },
  {
    code: '1.1.4.001',
    name: 'إيجار مدفوع مقدماً',
    nameEn: 'Prepaid Rent',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 4,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '1.1.4',
    isSystemAccount: true
  },
  {
    code: '1.1.4.002',
    name: 'تأمين مدفوع مقدماً',
    nameEn: 'Prepaid Insurance',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 4,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '1.1.4',
    isSystemAccount: true
  },
  
  // 1.2 الأصول الثابتة
  {
    code: '1.2',
    name: 'الأصول الثابتة',
    nameEn: 'Fixed Assets',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 2,
    isGroup: true,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '1',
    isSystemAccount: true
  },
  
  // 1.2.1 الأراضي
  {
    code: '1.2.1',
    name: 'الأراضي',
    nameEn: 'Land',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 3,
    isGroup: true,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '1.2',
    isSystemAccount: true
  },
  
  // 1.2.2 المباني والإنشاءات
  {
    code: '1.2.2',
    name: 'المباني والإنشاءات',
    nameEn: 'Buildings and Constructions',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 3,
    isGroup: true,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '1.2',
    isSystemAccount: true
  },
  
  // 1.2.3 الآلات والمعدات
  {
    code: '1.2.3',
    name: 'الآلات والمعدات',
    nameEn: 'Machinery and Equipment',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 3,
    isGroup: true,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '1.2',
    isSystemAccount: true
  },
  
  // 1.2.4 الأثاث والتجهيزات
  {
    code: '1.2.4',
    name: 'الأثاث والتجهيزات',
    nameEn: 'Furniture and Fixtures',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 3,
    isGroup: true,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '1.2',
    isSystemAccount: true
  },
  
  // 1.2.5 وسائل النقل
  {
    code: '1.2.5',
    name: 'وسائل النقل',
    nameEn: 'Vehicles',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 3,
    isGroup: true,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '1.2',
    isSystemAccount: true
  },
  
  // 1.2.6 أجهزة الحاسوب
  {
    code: '1.2.6',
    name: 'أجهزة الحاسوب',
    nameEn: 'Computer Equipment',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 3,
    isGroup: true,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '1.2',
    isSystemAccount: true
  },
  
  // 1.2.7 مجمع الإهلاك
  {
    code: '1.2.7',
    name: 'مجمع الإهلاك',
    nameEn: 'Accumulated Depreciation',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 3,
    isGroup: true,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '1.2',
    isSystemAccount: true
  },
  {
    code: '1.2.7.001',
    name: 'مجمع إهلاك المباني',
    nameEn: 'Accumulated Depreciation - Buildings',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 4,
    isGroup: false,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '1.2.7',
    isSystemAccount: true
  },
  {
    code: '1.2.7.002',
    name: 'مجمع إهلاك الآلات والمعدات',
    nameEn: 'Accumulated Depreciation - Machinery',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 4,
    isGroup: false,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '1.2.7',
    isSystemAccount: true
  },
  {
    code: '1.2.7.003',
    name: 'مجمع إهلاك الأثاث والتجهيزات',
    nameEn: 'Accumulated Depreciation - Furniture',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 4,
    isGroup: false,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '1.2.7',
    isSystemAccount: true
  },
  {
    code: '1.2.7.004',
    name: 'مجمع إهلاك وسائل النقل',
    nameEn: 'Accumulated Depreciation - Vehicles',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 4,
    isGroup: false,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '1.2.7',
    isSystemAccount: true
  },
  {
    code: '1.2.7.005',
    name: 'مجمع إهلاك أجهزة الحاسوب',
    nameEn: 'Accumulated Depreciation - Computers',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    level: 4,
    isGroup: false,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '1.2.7',
    isSystemAccount: true
  },

  // ========== 2. الخصوم (Liabilities) ==========
  {
    code: '2',
    name: 'الخصوم',
    nameEn: 'Liabilities',
    type: 'liability',
    rootType: 'Liability',
    reportType: 'Balance Sheet',
    level: 1,
    isGroup: true,
    nature: 'credit',
    accountType: 'main',
    parentCode: null,
    isSystemAccount: true
  },

  // 2.1 الالتزامات المتداولة
  {
    code: '2.1',
    name: 'الالتزامات المتداولة',
    nameEn: 'Current Liabilities',
    type: 'liability',
    rootType: 'Liability',
    reportType: 'Balance Sheet',
    level: 2,
    isGroup: true,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '2',
    isSystemAccount: true
  },

  // 2.1.1 الموردون والدائنون
  {
    code: '2.1.1',
    name: 'الموردون والدائنون',
    nameEn: 'Accounts Payable',
    type: 'liability',
    rootType: 'Liability',
    reportType: 'Balance Sheet',
    level: 3,
    isGroup: true,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '2.1',
    isSystemAccount: true
  },
  {
    code: '2.1.1.001',
    name: 'موردون محليون',
    nameEn: 'Local Suppliers',
    type: 'liability',
    rootType: 'Liability',
    reportType: 'Balance Sheet',
    level: 4,
    isGroup: false,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '2.1.1',
    isSystemAccount: true
  },
  {
    code: '2.1.1.002',
    name: 'موردون أجانب',
    nameEn: 'Foreign Suppliers',
    type: 'liability',
    rootType: 'Liability',
    reportType: 'Balance Sheet',
    level: 4,
    isGroup: false,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '2.1.1',
    isSystemAccount: true
  },
  {
    code: '2.1.1.003',
    name: 'أوراق الدفع',
    nameEn: 'Notes Payable',
    type: 'liability',
    rootType: 'Liability',
    reportType: 'Balance Sheet',
    level: 4,
    isGroup: false,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '2.1.1',
    isSystemAccount: true
  },

  // 2.1.2 المصروفات المستحقة
  {
    code: '2.1.2',
    name: 'المصروفات المستحقة',
    nameEn: 'Accrued Expenses',
    type: 'liability',
    rootType: 'Liability',
    reportType: 'Balance Sheet',
    level: 3,
    isGroup: true,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '2.1',
    isSystemAccount: true
  },
  {
    code: '2.1.2.001',
    name: 'رواتب مستحقة',
    nameEn: 'Accrued Salaries',
    type: 'liability',
    rootType: 'Liability',
    reportType: 'Balance Sheet',
    level: 4,
    isGroup: false,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '2.1.2',
    isSystemAccount: true
  },
  {
    code: '2.1.2.002',
    name: 'فوائد مستحقة',
    nameEn: 'Accrued Interest',
    type: 'liability',
    rootType: 'Liability',
    reportType: 'Balance Sheet',
    level: 4,
    isGroup: false,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '2.1.2',
    isSystemAccount: true
  },

  // 2.1.3 الضرائب المستحقة
  {
    code: '2.1.3',
    name: 'الضرائب المستحقة',
    nameEn: 'Accrued Taxes',
    type: 'liability',
    rootType: 'Liability',
    reportType: 'Balance Sheet',
    level: 3,
    isGroup: true,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '2.1',
    isSystemAccount: true
  },
  {
    code: '2.1.3.001',
    name: 'ضريبة الدخل المستحقة',
    nameEn: 'Accrued Income Tax',
    type: 'liability',
    rootType: 'Liability',
    reportType: 'Balance Sheet',
    level: 4,
    isGroup: false,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '2.1.3',
    isSystemAccount: true
  },
  {
    code: '2.1.3.002',
    name: 'ضريبة القيمة المضافة',
    nameEn: 'VAT Payable',
    type: 'liability',
    rootType: 'Liability',
    reportType: 'Balance Sheet',
    level: 4,
    isGroup: false,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '2.1.3',
    isSystemAccount: true
  },

  // 2.1.4 الإيرادات المقبوضة مقدماً
  {
    code: '2.1.4',
    name: 'الإيرادات المقبوضة مقدماً',
    nameEn: 'Unearned Revenue',
    type: 'liability',
    rootType: 'Liability',
    reportType: 'Balance Sheet',
    level: 3,
    isGroup: true,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '2.1',
    isSystemAccount: true
  },
  {
    code: '2.1.4.001',
    name: 'إيرادات خدمات مقبوضة مقدماً',
    nameEn: 'Unearned Service Revenue',
    type: 'liability',
    rootType: 'Liability',
    reportType: 'Balance Sheet',
    level: 4,
    isGroup: false,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '2.1.4',
    isSystemAccount: true
  },

  // 2.2 الخصوم طويلة الأجل
  {
    code: '2.2',
    name: 'الخصوم طويلة الأجل',
    nameEn: 'Long-term Liabilities',
    type: 'liability',
    rootType: 'Liability',
    reportType: 'Balance Sheet',
    level: 2,
    isGroup: true,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '2',
    isSystemAccount: true
  },
  {
    code: '2.2.1',
    name: 'قروض طويلة الأجل',
    nameEn: 'Long-term Loans',
    type: 'liability',
    rootType: 'Liability',
    reportType: 'Balance Sheet',
    level: 3,
    isGroup: false,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '2.2',
    isSystemAccount: true
  },

  // ========== 3. حقوق الملكية (Equity) ==========
  {
    code: '3',
    name: 'حقوق الملكية',
    nameEn: 'Equity',
    type: 'equity',
    rootType: 'Equity',
    reportType: 'Balance Sheet',
    level: 1,
    isGroup: true,
    nature: 'credit',
    accountType: 'main',
    parentCode: null,
    isSystemAccount: true
  },
  {
    code: '3.1',
    name: 'رأس المال',
    nameEn: 'Capital',
    type: 'equity',
    rootType: 'Equity',
    reportType: 'Balance Sheet',
    level: 2,
    isGroup: false,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '3',
    isSystemAccount: true
  },
  {
    code: '3.2',
    name: 'الأرباح المحتجزة',
    nameEn: 'Retained Earnings',
    type: 'equity',
    rootType: 'Equity',
    reportType: 'Balance Sheet',
    level: 2,
    isGroup: false,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '3',
    isSystemAccount: true
  },
  {
    code: '3.3',
    name: 'أرباح العام الحالي',
    nameEn: 'Current Year Earnings',
    type: 'equity',
    rootType: 'Equity',
    reportType: 'Balance Sheet',
    level: 2,
    isGroup: false,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '3',
    isSystemAccount: true
  },

  // ========== 4. الإيرادات (Revenue) ==========
  {
    code: '4',
    name: 'الإيرادات',
    nameEn: 'Revenue',
    type: 'revenue',
    rootType: 'Income',
    reportType: 'Profit and Loss',
    level: 1,
    isGroup: true,
    nature: 'credit',
    accountType: 'main',
    parentCode: null,
    isSystemAccount: true
  },

  // 4.1 إيرادات التشغيل
  {
    code: '4.1',
    name: 'إيرادات التشغيل',
    nameEn: 'Operating Revenue',
    type: 'revenue',
    rootType: 'Income',
    reportType: 'Profit and Loss',
    level: 2,
    isGroup: true,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '4',
    isSystemAccount: true
  },
  {
    code: '4.1.1',
    name: 'إيرادات المبيعات',
    nameEn: 'Sales Revenue',
    type: 'revenue',
    rootType: 'Income',
    reportType: 'Profit and Loss',
    level: 3,
    isGroup: false,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '4.1',
    isSystemAccount: true
  },
  {
    code: '4.1.2',
    name: 'إيرادات الخدمات',
    nameEn: 'Service Revenue',
    type: 'revenue',
    rootType: 'Income',
    reportType: 'Profit and Loss',
    level: 3,
    isGroup: false,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '4.1',
    isSystemAccount: true
  },
  {
    code: '4.1.3',
    name: 'إيرادات الشحن والنقل',
    nameEn: 'Shipping and Transport Revenue',
    type: 'revenue',
    rootType: 'Income',
    reportType: 'Profit and Loss',
    level: 3,
    isGroup: false,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '4.1',
    isSystemAccount: true
  },

  // 4.2 الإيرادات الأخرى
  {
    code: '4.2',
    name: 'الإيرادات الأخرى',
    nameEn: 'Other Revenue',
    type: 'revenue',
    rootType: 'Income',
    reportType: 'Profit and Loss',
    level: 2,
    isGroup: true,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '4',
    isSystemAccount: true
  },
  {
    code: '4.2.1',
    name: 'إيرادات الفوائد',
    nameEn: 'Interest Income',
    type: 'revenue',
    rootType: 'Income',
    reportType: 'Profit and Loss',
    level: 3,
    isGroup: false,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '4.2',
    isSystemAccount: true
  },
  {
    code: '4.2.2',
    name: 'إيرادات متنوعة',
    nameEn: 'Miscellaneous Income',
    type: 'revenue',
    rootType: 'Income',
    reportType: 'Profit and Loss',
    level: 3,
    isGroup: false,
    nature: 'credit',
    accountType: 'sub',
    parentCode: '4.2',
    isSystemAccount: true
  },

  // ========== 5. المصروفات (Expenses) ==========
  {
    code: '5',
    name: 'المصروفات',
    nameEn: 'Expenses',
    type: 'expense',
    rootType: 'Expense',
    reportType: 'Profit and Loss',
    level: 1,
    isGroup: true,
    nature: 'debit',
    accountType: 'main',
    parentCode: null,
    isSystemAccount: true
  },

  // 5.1 تكلفة البضاعة المباعة
  {
    code: '5.1',
    name: 'تكلفة البضاعة المباعة',
    nameEn: 'Cost of Goods Sold',
    type: 'expense',
    rootType: 'Expense',
    reportType: 'Profit and Loss',
    level: 2,
    isGroup: true,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '5',
    isSystemAccount: true
  },
  {
    code: '5.1.1',
    name: 'تكلفة المواد الخام',
    nameEn: 'Raw Materials Cost',
    type: 'expense',
    rootType: 'Expense',
    reportType: 'Profit and Loss',
    level: 3,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '5.1',
    isSystemAccount: true
  },
  {
    code: '5.1.2',
    name: 'تكلفة البضائع المشتراة',
    nameEn: 'Purchased Goods Cost',
    type: 'expense',
    rootType: 'Expense',
    reportType: 'Profit and Loss',
    level: 3,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '5.1',
    isSystemAccount: true
  },

  // 5.2 المصروفات التشغيلية
  {
    code: '5.2',
    name: 'المصروفات التشغيلية',
    nameEn: 'Operating Expenses',
    type: 'expense',
    rootType: 'Expense',
    reportType: 'Profit and Loss',
    level: 2,
    isGroup: true,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '5',
    isSystemAccount: true
  },

  // 5.2.1 الرواتب والأجور
  {
    code: '5.2.1',
    name: 'الرواتب والأجور',
    nameEn: 'Salaries and Wages',
    type: 'expense',
    rootType: 'Expense',
    reportType: 'Profit and Loss',
    level: 3,
    isGroup: true,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '5.2',
    isSystemAccount: true
  },
  {
    code: '5.2.1.001',
    name: 'رواتب الموظفين',
    nameEn: 'Employee Salaries',
    type: 'expense',
    rootType: 'Expense',
    reportType: 'Profit and Loss',
    level: 4,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '5.2.1',
    isSystemAccount: true
  },
  {
    code: '5.2.1.002',
    name: 'أجور العمال',
    nameEn: 'Workers Wages',
    type: 'expense',
    rootType: 'Expense',
    reportType: 'Profit and Loss',
    level: 4,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '5.2.1',
    isSystemAccount: true
  },
  {
    code: '5.2.1.003',
    name: 'مكافآت وحوافز',
    nameEn: 'Bonuses and Incentives',
    type: 'expense',
    rootType: 'Expense',
    reportType: 'Profit and Loss',
    level: 4,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '5.2.1',
    isSystemAccount: true
  },

  // 5.2.2 مصروفات الإهلاك
  {
    code: '5.2.2',
    name: 'مصروفات الإهلاك',
    nameEn: 'Depreciation Expenses',
    type: 'expense',
    rootType: 'Expense',
    reportType: 'Profit and Loss',
    level: 3,
    isGroup: true,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '5.2',
    isSystemAccount: true
  },
  {
    code: '5.2.2.001',
    name: 'إهلاك المباني',
    nameEn: 'Buildings Depreciation',
    type: 'expense',
    rootType: 'Expense',
    reportType: 'Profit and Loss',
    level: 4,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '5.2.2',
    isSystemAccount: true
  },
  {
    code: '5.2.2.002',
    name: 'إهلاك الآلات والمعدات',
    nameEn: 'Machinery Depreciation',
    type: 'expense',
    rootType: 'Expense',
    reportType: 'Profit and Loss',
    level: 4,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '5.2.2',
    isSystemAccount: true
  },
  {
    code: '5.2.2.003',
    name: 'إهلاك وسائل النقل',
    nameEn: 'Vehicles Depreciation',
    type: 'expense',
    rootType: 'Expense',
    reportType: 'Profit and Loss',
    level: 4,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '5.2.2',
    isSystemAccount: true
  },

  // 5.2.3 المصروفات الإدارية
  {
    code: '5.2.3',
    name: 'المصروفات الإدارية',
    nameEn: 'Administrative Expenses',
    type: 'expense',
    rootType: 'Expense',
    reportType: 'Profit and Loss',
    level: 3,
    isGroup: true,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '5.2',
    isSystemAccount: true
  },
  {
    code: '5.2.3.001',
    name: 'إيجار المكاتب',
    nameEn: 'Office Rent',
    type: 'expense',
    rootType: 'Expense',
    reportType: 'Profit and Loss',
    level: 4,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '5.2.3',
    isSystemAccount: true
  },
  {
    code: '5.2.3.002',
    name: 'الكهرباء والماء',
    nameEn: 'Utilities',
    type: 'expense',
    rootType: 'Expense',
    reportType: 'Profit and Loss',
    level: 4,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '5.2.3',
    isSystemAccount: true
  },
  {
    code: '5.2.3.003',
    name: 'الهاتف والإنترنت',
    nameEn: 'Phone and Internet',
    type: 'expense',
    rootType: 'Expense',
    reportType: 'Profit and Loss',
    level: 4,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '5.2.3',
    isSystemAccount: true
  },
  {
    code: '5.2.3.004',
    name: 'القرطاسية واللوازم المكتبية',
    nameEn: 'Office Supplies',
    type: 'expense',
    rootType: 'Expense',
    reportType: 'Profit and Loss',
    level: 4,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '5.2.3',
    isSystemAccount: true
  },

  // 5.2.4 مصروفات التسويق والمبيعات
  {
    code: '5.2.4',
    name: 'مصروفات التسويق والمبيعات',
    nameEn: 'Marketing and Sales Expenses',
    type: 'expense',
    rootType: 'Expense',
    reportType: 'Profit and Loss',
    level: 3,
    isGroup: true,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '5.2',
    isSystemAccount: true
  },
  {
    code: '5.2.4.001',
    name: 'مصروفات الإعلان',
    nameEn: 'Advertising Expenses',
    type: 'expense',
    rootType: 'Expense',
    reportType: 'Profit and Loss',
    level: 4,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '5.2.4',
    isSystemAccount: true
  },
  {
    code: '5.2.4.002',
    name: 'عمولات المبيعات',
    nameEn: 'Sales Commissions',
    type: 'expense',
    rootType: 'Expense',
    reportType: 'Profit and Loss',
    level: 4,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '5.2.4',
    isSystemAccount: true
  },

  // 5.3 المصروفات المالية
  {
    code: '5.3',
    name: 'المصروفات المالية',
    nameEn: 'Financial Expenses',
    type: 'expense',
    rootType: 'Expense',
    reportType: 'Profit and Loss',
    level: 2,
    isGroup: true,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '5',
    isSystemAccount: true
  },
  {
    code: '5.3.1',
    name: 'فوائد القروض',
    nameEn: 'Loan Interest',
    type: 'expense',
    rootType: 'Expense',
    reportType: 'Profit and Loss',
    level: 3,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '5.3',
    isSystemAccount: true
  },
  {
    code: '5.3.2',
    name: 'رسوم بنكية',
    nameEn: 'Bank Charges',
    type: 'expense',
    rootType: 'Expense',
    reportType: 'Profit and Loss',
    level: 3,
    isGroup: false,
    nature: 'debit',
    accountType: 'sub',
    parentCode: '5.3',
    isSystemAccount: true
  }
];

async function createComprehensiveChartOfAccounts() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🏗️ بدء إنشاء دليل الحسابات الشامل الجديد...');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('='.repeat(60));
    
    // 1. حذف جميع الحسابات الموجودة
    console.log('\n🗑️ 1. حذف جميع الحسابات الموجودة...');
    
    // حذف القيود المرتبطة أولاً
    await sequelize.query('DELETE FROM gl_entries', { transaction });
    await sequelize.query('DELETE FROM journal_entry_details', { transaction });
    await sequelize.query('DELETE FROM journal_entries', { transaction });
    
    // حذف الحسابات
    await sequelize.query('DELETE FROM accounts', { transaction });
    
    console.log('   ✅ تم حذف جميع الحسابات والقيود المرتبطة');
    
    // 2. إنشاء الحسابات الجديدة
    console.log('\n🏗️ 2. إنشاء الحسابات الجديدة...');
    
    let createdCount = 0;
    const accountMap = new Map(); // لحفظ معرفات الحسابات
    
    // إنشاء الحسابات بالترتيب الصحيح (الآباء أولاً)
    for (const account of comprehensiveChartOfAccounts) {
      let parentId = null;
      
      if (account.parentCode) {
        parentId = accountMap.get(account.parentCode);
        if (!parentId) {
          console.log(`   ⚠️ تحذير: لم يتم العثور على الحساب الأب ${account.parentCode} للحساب ${account.code}`);
        }
      }
      
      const accountId = uuidv4();
      
      await sequelize.query(`
        INSERT INTO accounts (
          id, code, name, "nameEn", type, "rootType", "reportType", 
          "parentId", level, "isGroup", "isActive", balance, currency,
          nature, "accountType", description, "isSystemAccount",
          "createdAt", "updatedAt"
        ) VALUES (
          :id, :code, :name, :nameEn, :type, :rootType, :reportType,
          :parentId, :level, :isGroup, true, 0, 'LYD',
          :nature, :accountType, :description, :isSystemAccount,
          NOW(), NOW()
        )
      `, {
        replacements: {
          id: accountId,
          code: account.code,
          name: account.name,
          nameEn: account.nameEn,
          type: account.type,
          rootType: account.rootType,
          reportType: account.reportType,
          parentId: parentId,
          level: account.level,
          isGroup: account.isGroup,
          nature: account.nature,
          accountType: account.accountType,
          description: `حساب ${account.name}`,
          isSystemAccount: account.isSystemAccount
        },
        transaction
      });
      
      accountMap.set(account.code, accountId);
      createdCount++;
      
      console.log(`   ✅ ${account.code}: ${account.name}`);
    }
    
    await transaction.commit();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 تم إنشاء دليل الحسابات الشامل بنجاح!');
    console.log(`📊 إجمالي الحسابات المنشأة: ${createdCount}`);
    
    // 3. التحقق من النتائج
    console.log('\n📊 3. التحقق من النتائج...');
    
    const [finalAccounts] = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN level = 1 THEN 1 END) as level1,
        COUNT(CASE WHEN level = 2 THEN 1 END) as level2,
        COUNT(CASE WHEN level = 3 THEN 1 END) as level3,
        COUNT(CASE WHEN level = 4 THEN 1 END) as level4
      FROM accounts
    `);
    
    const stats = finalAccounts[0];
    console.log(`   إجمالي الحسابات: ${stats.total}`);
    console.log(`   المستوى 1 (رئيسية): ${stats.level1}`);
    console.log(`   المستوى 2 (فرعية): ${stats.level2}`);
    console.log(`   المستوى 3 (تفصيلية): ${stats.level3}`);
    console.log(`   المستوى 4 (نهائية): ${stats.level4}`);
    
    // فحص التسلسل الهرمي
    const [hierarchyCheck] = await sequelize.query(`
      SELECT COUNT(*) as issues FROM accounts a
      LEFT JOIN accounts p ON a."parentId" = p.id
      WHERE a."parentId" IS NOT NULL AND p.id IS NULL
    `);
    
    if (hierarchyCheck[0].issues === 0) {
      console.log('   ✅ التسلسل الهرمي صحيح');
    } else {
      console.log(`   ❌ مشاكل في التسلسل الهرمي: ${hierarchyCheck[0].issues}`);
    }
    
    console.log('\n🚀 دليل الحسابات الشامل جاهز للاستخدام!');
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ خطأ في إنشاء دليل الحسابات:', error.message);
    console.error('تفاصيل الخطأ:', error);
  } finally {
    await sequelize.close();
  }
}

createComprehensiveChartOfAccounts();
