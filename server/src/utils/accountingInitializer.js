import { Account, AccountMapping } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * نظام تهيئة المحرك المحاسبي التلقائي
 * يعمل عند بدء تشغيل السيرفر لضمان جاهزية النظام
 */
class AccountingInitializer {
  /**
   * تهيئة النظام المحاسبي عند بدء التشغيل
   */
  static async initialize() {
    try {
      console.log('🔧 بدء تهيئة النظام المحاسبي...');
      
      // 1. التحقق من وجود دليل الحسابات
      await this.ensureChartOfAccounts();
      
      // 2. التحقق من وجود AccountMapping
      await this.ensureAccountMapping();
      
      // 3. التحقق من صحة النظام
      const healthCheck = await this.performHealthCheck();
      
      if (healthCheck.healthy) {
        console.log('✅ النظام المحاسبي جاهز للعمل');
        console.log(`   - عدد الحسابات: ${healthCheck.accountsCount}`);
        console.log(`   - AccountMapping: ${healthCheck.hasActiveMapping ? 'نشط' : 'غير نشط'}`);
      } else {
        console.warn('⚠️ النظام المحاسبي يحتاج إلى مراجعة:');
        healthCheck.issues.forEach(issue => console.warn(`   - ${issue}`));
      }
      
      return healthCheck;
    } catch (error) {
      console.error('❌ فشل تهيئة النظام المحاسبي:', error);
      throw error;
    }
  }

  /**
   * التأكد من وجود الحسابات الأساسية
   */
  static async ensureChartOfAccounts() {
    console.log('📊 التحقق من دليل الحسابات...');
    
    const requiredAccounts = [
      { 
        code: '1000', 
        name: 'الأصول', 
        nameEn: 'Assets', 
        type: 'asset', 
        rootType: 'Asset',
        reportType: 'Balance Sheet', 
        isGroup: true, 
        level: 1,
        nature: 'debit'
      },
      
      // الأصول المتداولة
      { 
        code: '1100', 
        name: 'الأصول المتداولة', 
        nameEn: 'Current Assets', 
        type: 'asset', 
        rootType: 'Asset',
        reportType: 'Balance Sheet', 
        isGroup: true, 
        level: 2, 
        parentCode: '1000',
        nature: 'debit'
      },
      { 
        code: '1101', 
        name: 'النقدية', 
        nameEn: 'Cash', 
        type: 'asset', 
        rootType: 'Asset',
        reportType: 'Balance Sheet', 
        isGroup: false, 
        level: 3, 
        parentCode: '1100',
        nature: 'debit'
      },
      { 
        code: '1102', 
        name: 'البنك - الحساب الجاري', 
        nameEn: 'Bank - Current Account', 
        type: 'asset', 
        rootType: 'Asset',
        reportType: 'Balance Sheet', 
        isGroup: false, 
        level: 3, 
        parentCode: '1100',
        nature: 'debit'
      },
      { 
        code: '1201', 
        name: 'ذمم العملاء', 
        nameEn: 'Accounts Receivable', 
        type: 'asset', 
        rootType: 'Asset',
        reportType: 'Balance Sheet', 
        isGroup: true, 
        level: 2, 
        parentCode: '1000',
        nature: 'debit'
      },
      
      // الخصوم - المستوى الأول
      { 
        code: '2000', 
        name: 'الخصوم', 
        nameEn: 'Liabilities', 
        type: 'liability', 
        rootType: 'Liability',
        reportType: 'Balance Sheet',
        isGroup: true, 
        level: 1,
        nature: 'credit'
      },
      
      // الخصوم المتداولة
      { 
        code: '2100', 
        name: 'الخصوم المتداولة', 
        nameEn: 'Current Liabilities', 
        type: 'liability', 
        rootType: 'Liability',
        reportType: 'Balance Sheet',
        isGroup: true, 
        level: 2, 
        parentCode: '2000',
        nature: 'credit'
      },
      { 
        code: '2201', 
        name: 'ذمم الموردين', 
        nameEn: 'Accounts Payable', 
        type: 'liability', 
        rootType: 'Liability',
        reportType: 'Balance Sheet',
        isGroup: true, 
        level: 2, 
        parentCode: '2000',
        nature: 'credit'
      },
      { 
        code: '2301', 
        name: 'ضريبة القيمة المضافة', 
        nameEn: 'VAT Payable', 
        type: 'liability', 
        rootType: 'Liability',
        reportType: 'Balance Sheet',
        isGroup: false, 
        level: 2, 
        parentCode: '2000',
        nature: 'credit'
      },
      
      // حقوق الملكية
      { 
        code: '3000', 
        name: 'حقوق الملكية', 
        nameEn: 'Equity', 
        type: 'equity', 
        rootType: 'Equity',
        reportType: 'Balance Sheet',
        isGroup: true, 
        level: 1,
        nature: 'credit'
      },
      { 
        code: '3101', 
        name: 'رأس المال', 
        nameEn: 'Capital', 
        type: 'equity', 
        rootType: 'Equity',
        reportType: 'Balance Sheet',
        isGroup: false, 
        level: 2, 
        parentCode: '3000',
        nature: 'credit'
      },
      { 
        code: '3201', 
        name: 'الأرباح المحتجزة', 
        nameEn: 'Retained Earnings', 
        type: 'equity', 
        rootType: 'Equity',
        reportType: 'Balance Sheet',
        isGroup: false, 
        level: 2, 
        parentCode: '3000',
        nature: 'credit'
      },
      
      // الإيرادات
      { 
        code: '4000', 
        name: 'الإيرادات', 
        nameEn: 'Revenue', 
        type: 'revenue', 
        rootType: 'Income',
        reportType: 'Profit and Loss',
        isGroup: true, 
        level: 1,
        nature: 'credit'
      },
      { 
        code: '4101', 
        name: 'إيرادات خدمات الشحن البحري', 
        nameEn: 'Sea Freight Revenue', 
        type: 'revenue', 
        rootType: 'Income',
        reportType: 'Profit and Loss',
        isGroup: false, 
        level: 2, 
        parentCode: '4000',
        nature: 'credit'
      },
      { 
        code: '4102', 
        name: 'خصومات المبيعات', 
        nameEn: 'Sales Discounts', 
        type: 'revenue', 
        rootType: 'Income',
        reportType: 'Profit and Loss',
        isGroup: false, 
        level: 2, 
        parentCode: '4000', 
        nature: 'debit'
      },
      { 
        code: '4103', 
        name: 'إيرادات خدمات التخليص الجمركي', 
        nameEn: 'Customs Clearance Revenue', 
        type: 'revenue', 
        rootType: 'Income',
        reportType: 'Profit and Loss',
        isGroup: false, 
        level: 2, 
        parentCode: '4000',
        nature: 'credit'
      },
      { 
        code: '4104', 
        name: 'إيرادات خدمات التخزين', 
        nameEn: 'Storage Services Revenue', 
        type: 'revenue', 
        rootType: 'Income',
        reportType: 'Profit and Loss',
        isGroup: false, 
        level: 2, 
        parentCode: '4000',
        nature: 'credit'
      },
      { 
        code: '4105', 
        name: 'إيرادات خدمات التأمين', 
        nameEn: 'Insurance Services Revenue', 
        type: 'revenue', 
        rootType: 'Income',
        reportType: 'Profit and Loss',
        isGroup: false, 
        level: 2, 
        parentCode: '4000',
        nature: 'credit'
      },
      
      // المصروفات
      { 
        code: '5000', 
        name: 'المصروفات', 
        nameEn: 'Expenses', 
        type: 'expense', 
        rootType: 'Expense',
        reportType: 'Profit and Loss',
        isGroup: true, 
        level: 1,
        nature: 'debit'
      },
      { 
        code: '5101', 
        name: 'تكلفة الشحن', 
        nameEn: 'Shipping Costs', 
        type: 'expense', 
        rootType: 'Expense',
        reportType: 'Profit and Loss',
        isGroup: false, 
        level: 2, 
        parentCode: '5000',
        nature: 'debit'
      },
      { 
        code: '5102', 
        name: 'رواتب الموظفين', 
        nameEn: 'Salaries', 
        type: 'expense', 
        rootType: 'Expense',
        reportType: 'Profit and Loss',
        isGroup: false, 
        level: 2, 
        parentCode: '5000',
        nature: 'debit'
      },
      { 
        code: '5103', 
        name: 'إيجارات', 
        nameEn: 'Rent', 
        type: 'expense', 
        rootType: 'Expense',
        reportType: 'Profit and Loss',
        isGroup: false, 
        level: 2, 
        parentCode: '5000',
        nature: 'debit'
      },
      { 
        code: '5104', 
        name: 'مصاريف إدارية', 
        nameEn: 'Administrative Expenses', 
        type: 'expense', 
        rootType: 'Expense',
        reportType: 'Profit and Loss',
        isGroup: false, 
        level: 2, 
        parentCode: '5000',
        nature: 'debit'
      },
      { 
        code: '5105', 
        name: 'مصاريف الجمارك والرسوم', 
        nameEn: 'Customs and Duties Expenses', 
        type: 'expense', 
        rootType: 'Expense',
        reportType: 'Profit and Loss',
        isGroup: false, 
        level: 2, 
        parentCode: '5000',
        nature: 'debit'
      }
    ];

    let createdCount = 0;
    let existingCount = 0;

    for (const accountData of requiredAccounts) {
      const exists = await Account.findOne({ where: { code: accountData.code } });
      
      if (!exists) {
        // البحث عن الحساب الأب
        let parentId = null;
        if (accountData.parentCode) {
          const parent = await Account.findOne({ where: { code: accountData.parentCode } });
          parentId = parent?.id;
        }
        
        await Account.create({
          code: accountData.code,
          name: accountData.name,
          nameEn: accountData.nameEn,
          type: accountData.type,
          rootType: accountData.rootType,
          reportType: accountData.type === 'revenue' || accountData.type === 'expense' ? 'Profit and Loss' : 'Balance Sheet',
          parentId: parentId,
          level: accountData.level,
          isGroup: accountData.isGroup,
          isActive: true,
          balance: 0,
          currency: 'LYD',
          nature: accountData.nature
        });
        
        createdCount++;
        console.log(`   ✅ تم إنشاء: ${accountData.code} - ${accountData.name}`);
      } else {
        existingCount++;
      }
    }

    console.log(`✅ دليل الحسابات: ${createdCount} حساب جديد، ${existingCount} حساب موجود`);
  }

  /**
   * التأكد من وجود AccountMapping نشط
   */
  static async ensureAccountMapping() {
    console.log('🔗 التحقق من Account Mapping...');
    
    const mapping = await AccountMapping.findOne({ where: { isActive: true } });
    
    if (!mapping) {
      console.log('⚠️ لا يوجد Account Mapping نشط، جاري الإنشاء...');
      
      // البحث عن الحسابات المطلوبة
      const salesAccount = await Account.findOne({ where: { code: '4101' } });
      const arAccount = await Account.findOne({ where: { code: '1201' } });
      const taxAccount = await Account.findOne({ where: { code: '2301' } });
      const discountAccount = await Account.findOne({ where: { code: '4102' } });
      const customsAccount = await Account.findOne({ where: { code: '4103' } });
      const storageAccount = await Account.findOne({ where: { code: '4104' } });
      const insuranceAccount = await Account.findOne({ where: { code: '4105' } });
      
      if (salesAccount && arAccount && taxAccount) {
        await AccountMapping.create({
          salesRevenueAccount: salesAccount.id,
          accountsReceivableAccount: arAccount.id,
          salesTaxAccount: taxAccount.id,
          discountAccount: discountAccount?.id,
          shippingRevenueAccount: salesAccount.id,
          customsClearanceAccount: customsAccount?.id,
          storageAccount: storageAccount?.id,
          insuranceAccount: insuranceAccount?.id,
          isActive: true,
          description: 'تم الإنشاء تلقائياً عند بدء التشغيل - نظام الشحن الدولي من الصين إلى ليبيا'
        });
        
        console.log('✅ تم إنشاء Account Mapping تلقائياً');
      } else {
        const missing = [];
        if (!salesAccount) missing.push('حساب المبيعات (4101)');
        if (!arAccount) missing.push('حساب ذمم العملاء (1201)');
        if (!taxAccount) missing.push('حساب الضرائب (2301)');
        
        console.error('❌ لا يمكن إنشاء Account Mapping - الحسابات التالية غير موجودة:');
        missing.forEach(m => console.error(`   - ${m}`));
        throw new Error('Missing required accounts for AccountMapping');
      }
    } else {
      console.log('✅ Account Mapping موجود ونشط');
    }
  }

  /**
   * فحص صحة النظام المحاسبي
   */
  static async performHealthCheck() {
    const issues = [];
    
    // 1. فحص AccountMapping
    const mapping = await AccountMapping.findOne({ where: { isActive: true } });
    if (!mapping) {
      issues.push('لا يوجد Account Mapping نشط');
    } else {
      // فحص الحسابات المطلوبة
      const requiredAccounts = [
        mapping.salesRevenueAccount,
        mapping.accountsReceivableAccount,
        mapping.salesTaxAccount
      ].filter(Boolean);
      
      if (requiredAccounts.length > 0) {
        const accountsCount = await Account.count({
          where: { id: { [Op.in]: requiredAccounts } }
        });
        
        if (accountsCount < 3) {
          issues.push('بعض الحسابات المطلوبة في AccountMapping غير موجودة');
        }
      }
    }
    
    // 2. فحص عدد الحسابات
    const accountsCount = await Account.count();
    if (accountsCount < 10) {
      issues.push('عدد الحسابات قليل جداً - قد تحتاج إلى إنشاء المزيد');
    }
    
    return {
      healthy: issues.length === 0,
      issues: issues,
      accountsCount: accountsCount,
      hasActiveMapping: !!mapping
    };
  }
}

export default AccountingInitializer;
