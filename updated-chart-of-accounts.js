/**
 * دليل الحسابات المحدث وفقاً للتصنيف المحاسبي التقليدي
 * 
 * التصنيف الجديد:
 * 1 - الأصول (Assets) - طبيعة مدين
 * 2 - المصروفات (Expenses) - طبيعة مدين  
 * 3 - الالتزامات (Liabilities) - طبيعة دائن
 * 4 - حقوق الملكية (Equity) - طبيعة دائن
 * 5 - الإيرادات (Revenue) - طبيعة دائن
 */

export const updatedChartOfAccounts = [
  // 1 - الأصول (Assets) - طبيعة مدين
  { 
    code: '1', 
    name: 'الأصول', 
    nameEn: 'Assets', 
    type: 'asset', 
    rootType: 'Asset', 
    reportType: 'Balance Sheet', 
    nature: 'debit',
    isGroup: true, 
    parentCode: null,
    level: 1,
    description: 'الحساب الرئيسي للأصول - يشمل جميع الأصول المملوكة للشركة'
  },
  
  // 1.1 - الأصول المتداولة
  { 
    code: '1.1', 
    name: 'الأصول المتداولة', 
    nameEn: 'Current Assets', 
    type: 'asset', 
    rootType: 'Asset', 
    reportType: 'Balance Sheet', 
    nature: 'debit',
    isGroup: true, 
    parentCode: '1',
    level: 2
  },
  
  // 1.1.1 - النقدية والبنوك
  { 
    code: '1.1.1', 
    name: 'النقدية والبنوك', 
    nameEn: 'Cash and Banks', 
    type: 'asset', 
    rootType: 'Asset', 
    reportType: 'Balance Sheet', 
    nature: 'debit',
    isGroup: true, 
    parentCode: '1.1',
    level: 3
  },
  { 
    code: '1.1.1.1', 
    name: 'الصندوق', 
    nameEn: 'Cash', 
    type: 'asset', 
    rootType: 'Asset', 
    reportType: 'Balance Sheet', 
    nature: 'debit',
    isGroup: false, 
    parentCode: '1.1.1', 
    balance: 500,
    level: 4
  },
  { 
    code: '1.1.1.2', 
    name: 'البنك الأهلي', 
    nameEn: 'National Bank', 
    type: 'asset', 
    rootType: 'Asset', 
    reportType: 'Balance Sheet', 
    nature: 'debit',
    isGroup: false, 
    parentCode: '1.1.1', 
    balance: 0,
    level: 4
  },
  
  // 1.1.2 - المدينون
  { 
    code: '1.1.2', 
    name: 'المدينون', 
    nameEn: 'Accounts Receivable', 
    type: 'asset', 
    rootType: 'Asset', 
    reportType: 'Balance Sheet', 
    nature: 'debit',
    isGroup: true, 
    parentCode: '1.1',
    level: 3
  },
  { 
    code: '1.1.2.1', 
    name: 'عملاء', 
    nameEn: 'Customers', 
    type: 'asset', 
    rootType: 'Asset', 
    reportType: 'Balance Sheet', 
    nature: 'debit',
    isGroup: false, 
    parentCode: '1.1.2', 
    balance: 0,
    level: 4
  },
  
  // 1.2 - الأصول الثابتة
  { 
    code: '1.2', 
    name: 'الأصول الثابتة', 
    nameEn: 'Fixed Assets', 
    type: 'asset', 
    rootType: 'Asset', 
    reportType: 'Balance Sheet', 
    nature: 'debit',
    isGroup: true, 
    parentCode: '1',
    level: 2
  },
  { 
    code: '1.2.1', 
    name: 'المباني', 
    nameEn: 'Buildings', 
    type: 'asset', 
    rootType: 'Asset', 
    reportType: 'Balance Sheet', 
    nature: 'debit',
    isGroup: false, 
    parentCode: '1.2', 
    balance: 0,
    level: 3
  },

  // 2 - المصروفات (Expenses) - طبيعة مدين
  { 
    code: '2', 
    name: 'المصروفات', 
    nameEn: 'Expenses', 
    type: 'expense', 
    rootType: 'Expense', 
    reportType: 'Profit and Loss', 
    nature: 'debit',
    isGroup: true, 
    parentCode: null,
    level: 1,
    description: 'الحساب الرئيسي للمصروفات - يشمل جميع المصروفات التشغيلية والإدارية'
  },
  
  // 2.1 - تكلفة البضاعة المباعة
  { 
    code: '2.1', 
    name: 'تكلفة البضاعة المباعة', 
    nameEn: 'Cost of Goods Sold', 
    type: 'expense', 
    rootType: 'Expense', 
    reportType: 'Profit and Loss', 
    nature: 'debit',
    isGroup: false, 
    parentCode: '2', 
    balance: 0,
    level: 2
  },
  
  // 2.2 - مصروفات التشغيل
  { 
    code: '2.2', 
    name: 'مصروفات التشغيل', 
    nameEn: 'Operating Expenses', 
    type: 'expense', 
    rootType: 'Expense', 
    reportType: 'Profit and Loss', 
    nature: 'debit',
    isGroup: true, 
    parentCode: '2',
    level: 2
  },
  { 
    code: '2.2.1', 
    name: 'رواتب الموظفين', 
    nameEn: 'Employee Salaries', 
    type: 'expense', 
    rootType: 'Expense', 
    reportType: 'Profit and Loss', 
    nature: 'debit',
    isGroup: false, 
    parentCode: '2.2', 
    balance: 0,
    level: 3
  },
  { 
    code: '2.2.2', 
    name: 'إيجار المكتب', 
    nameEn: 'Office Rent', 
    type: 'expense', 
    rootType: 'Expense', 
    reportType: 'Profit and Loss', 
    nature: 'debit',
    isGroup: false, 
    parentCode: '2.2', 
    balance: 0,
    level: 3
  },

  // 3 - الالتزامات (Liabilities) - طبيعة دائن
  { 
    code: '3', 
    name: 'الالتزامات', 
    nameEn: 'Liabilities', 
    type: 'liability', 
    rootType: 'Liability', 
    reportType: 'Balance Sheet', 
    nature: 'credit',
    isGroup: true, 
    parentCode: null,
    level: 1,
    description: 'الحساب الرئيسي للالتزامات - يشمل جميع الديون والالتزامات المالية'
  },
  
  // 3.1 - الالتزامات المتداولة
  { 
    code: '3.1', 
    name: 'الالتزامات المتداولة', 
    nameEn: 'Current Liabilities', 
    type: 'liability', 
    rootType: 'Liability', 
    reportType: 'Balance Sheet', 
    nature: 'credit',
    isGroup: true, 
    parentCode: '3',
    level: 2
  },
  { 
    code: '3.1.1', 
    name: 'موردون', 
    nameEn: 'Suppliers', 
    type: 'liability', 
    rootType: 'Liability', 
    reportType: 'Balance Sheet', 
    nature: 'credit',
    isGroup: false, 
    parentCode: '3.1', 
    balance: 0,
    level: 3
  },

  // 4 - حقوق الملكية (Equity) - طبيعة دائن
  { 
    code: '4', 
    name: 'حقوق الملكية', 
    nameEn: 'Equity', 
    type: 'equity', 
    rootType: 'Equity', 
    reportType: 'Balance Sheet', 
    nature: 'credit',
    isGroup: true, 
    parentCode: null,
    level: 1,
    description: 'الحساب الرئيسي لحقوق الملكية - يشمل رأس المال والأرباح المحتجزة'
  },
  { 
    code: '4.1', 
    name: 'رأس المال', 
    nameEn: 'Capital', 
    type: 'equity', 
    rootType: 'Equity', 
    reportType: 'Balance Sheet', 
    nature: 'credit',
    isGroup: false, 
    parentCode: '4', 
    balance: 0,
    level: 2
  },
  { 
    code: '4.2', 
    name: 'الأرباح المحتجزة', 
    nameEn: 'Retained Earnings', 
    type: 'equity', 
    rootType: 'Equity', 
    reportType: 'Balance Sheet', 
    nature: 'credit',
    isGroup: false, 
    parentCode: '4', 
    balance: 0,
    level: 2
  },

  // 5 - الإيرادات (Revenue) - طبيعة دائن
  { 
    code: '5', 
    name: 'الإيرادات', 
    nameEn: 'Revenue', 
    type: 'revenue', 
    rootType: 'Income', 
    reportType: 'Profit and Loss', 
    nature: 'credit',
    isGroup: true, 
    parentCode: null,
    level: 1,
    description: 'الحساب الرئيسي للإيرادات - يشمل جميع الإيرادات من المبيعات والخدمات'
  },
  { 
    code: '5.1', 
    name: 'إيرادات المبيعات', 
    nameEn: 'Sales Revenue', 
    type: 'revenue', 
    rootType: 'Income', 
    reportType: 'Profit and Loss', 
    nature: 'credit',
    isGroup: false, 
    parentCode: '5', 
    balance: 0,
    level: 2
  },
  { 
    code: '5.2', 
    name: 'إيرادات الخدمات', 
    nameEn: 'Service Revenue', 
    type: 'revenue', 
    rootType: 'Income', 
    reportType: 'Profit and Loss', 
    nature: 'credit',
    isGroup: false, 
    parentCode: '5', 
    balance: 0,
    level: 2
  }
];

// دالة للحصول على طبيعة الحساب بناءً على النوع
export function getAccountNature(type) {
  const natureMap = {
    'asset': 'debit',      // الأصول - مدين
    'expense': 'debit',    // المصروفات - مدين
    'liability': 'credit', // الالتزامات - دائن
    'equity': 'credit',    // حقوق الملكية - دائن
    'revenue': 'credit'    // الإيرادات - دائن
  };
  
  return natureMap[type] || 'debit';
}

// دالة للتحقق من صحة التصنيف
export function validateAccountClassification() {
  console.log('📊 التصنيف المحاسبي الجديد:');
  console.log('1 - الأصول (Assets) - طبيعة مدين');
  console.log('2 - المصروفات (Expenses) - طبيعة مدين');
  console.log('3 - الالتزامات (Liabilities) - طبيعة دائن');
  console.log('4 - حقوق الملكية (Equity) - طبيعة دائن');
  console.log('5 - الإيرادات (Revenue) - طبيعة دائن');
  
  return true;
}
