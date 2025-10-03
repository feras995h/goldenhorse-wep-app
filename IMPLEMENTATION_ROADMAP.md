# خطة العمل الشاملة لتطوير منظومة Golden Horse
## نظام مالي ومبيعات متقدم لشركة شحن دولية (الصين - ليبيا)

**تاريخ البدء**: 2025-10-01  
**المدة المتوقعة**: 12 أسبوع  
**الهدف**: منظومة مالية ومبيعات متكاملة عالمية المستوى

---

## 🆕 تقييم مُحدّث للنظام — 2025-10-03

- آخر تحديث: 2025-10-03 18:37 UTC
- الحالة العامة: التقدم كبير في المرحلة الأولى وبداية قوية للمرحلة الثانية. الأداء أفضل بفضل التكامل مع Redis، مع بقاء بعض العناصر النهائية للمراجعة والاختبارات.

### ملخص الحالة الحالية
- Backend:
  - تم تفعيل التكامل مع Redis للتخزين المؤقت والإشعارات اللحظية في مسارات المالية والمبيعات (خدمات cacheService وrealtimeService وmiddleware ذات الصلة موجودة).
  - تم إنشاء قيود يومية تلقائية لفواتير المبيعات والشحن ضمن النماذج والمسارات ذات الصلة، مع إضافة حساب المبلغ المستحق (Outstanding Amount) في SalesInvoice.
  - إضافة نماذج ومسارات سندات القبض والدفع (Receipt/Payment Vouchers) وتحديثات على PurchaseInvoice.
  - بدء تنفيذ نظام الفترات المحاسبية: يتوفر client/src/pages/AccountingPeriods.tsx وserver/src/routes/accountingPeriods.js، مع حاجة لإكمال منطق إقفال الفترة وإنشاء قيد الإقفال.
  - إضافة خدمات مراقبة الصحة المحاسبية وملفات مسارات مالية محسّنة (accountingHealthMonitor/enhancedFinancial).
- Frontend:
  - صفحات جديدة لـ ReceiptVouchers وPaymentVouchers، وتحسينات على SalesDashboard وFinancialDashboard وAccountTree.
- قاعدة البيانات:
  - ترحيلات متعددة مضافة (019–022) تشمل أعمدة مستخدمين لحسابات الخرائط وإضافة حساب ضريبة المبيعات وغيرها.
  - تتوفر سكربتات Triggers وقابلية التثبيت عبر server/src/scripts/installTriggers.js وملف SQL ضمن server/database/triggers.
- الاختبارات والتوثيق:
  - هيكل اختبارات موجود في server/tests مع حاجة لتثبيت مجموعة أساسية من اختبارات التكامل CI.

### نسبة إنجاز المراحل
- المرحلة الأولى (الإصلاحات الحرجة): 85–90% منجز
  - مكتمل: AccountMapping نشط، دليل حسابات أساسي، إنشاء حسابات تلقائي للعملاء/الموردين، تحسين معالجة الأخطاء، مسارات مالية/مبيعات مستقرة، تكامل Redis.
  - متبقٍ: تفعيل Triggers في جميع البيئات، توحيد نقطة فحص الصحة /system-health وإظهارها في الواجهة، تمرير جولة اختبارات تكامل أساسية.
- المرحلة الثانية (المحرك المحاسبي): بدأت
  - تقدم: ملفات الفترات المحاسبية موجودة (واجهة وخلفية). يلزم إكمال منطق إقفال الفترة وقيد الإقفال وتدفقات الاعتمادات.
- المرحلة الثالثة (المبيعات والشحن): أساس المبيعات/الشحن قوي، نموذج الشحنة الدولية المتقدم مخطط ولم يُنفذ بعد.
- المرحلة الرابعة/الخامسة: لم تبدأ بعد (تُراجع بعد تثبيت استقرار المرحلة 2).

### أهم التغييرات منذ 2025-10-01
- تكامل Redis للتخزين المؤقت والتنبيهات الفورية في المالية والمبيعات.
- تفعيل إنشاء قيود يومية لفواتير المبيعات والشحن وتحسين الاستعلامات الخاصة بالملخصات.
- إضافة Receipt/Payment Vouchers وتعديلات على النماذج المرتبطة.
- إضافة حساب الضريبة لحسابات الخرائط وترحيلات بنيوية جديدة.
- بدء العمل على الفترات المحاسبية (واجهة ومسارات خلفية) وصفحة الإدارة لها.

### القرارات والخطوات القادمة (3–5 أيام)
1) تثبيت وتشغيل Triggers على قاعدة البيانات عبر: node server/src/scripts/installTriggers.js (ثم التحقق من سلامة الأرصدة).
2) تنفيذ/توحيد GET /api/financial/system-health وPOST /api/financial/recalculate-balances (إن لم تكن موجودة) وربطها بلوحة مراقبة بسيطة في الواجهة.
3) إكمال منطق إقفال الفترات في AccountingPeriod وإضافة شاشة إدارة للفترات (إنشاء/فتح/إقفال) مع سجل تدقيق.
4) توحيد سياسة الأخطاء: منع تجاهل إنشاء القيود في sales.js/financial.js وضمان فشل العملية عند فشل القيد مع رسائل واضحة.
5) إعداد مجموعة اختبارات تكامل أساسية وتشغيلها محليًا، ثم تمكينها في CI.

### أثر على الخطة الزمنية
- المرحلة الأولى تختتم مبكرًا نسبيًا، وتنتقل الجهود إلى المرحلة الثانية مع إبقاء نافذة صيانة قصيرة لمعالجة ما تبقى من الإصلاحات الحرجة.

## 📋 جدول المحتويات
1. [المرحلة الأولى: الإصلاحات الحرجة (أسبوع 1-2)](#المرحلة-الأولى)
2. [المرحلة الثانية: تطوير المحرك المحاسبي (أسبوع 3-5)](#المرحلة-الثانية)
3. [المرحلة الثالثة: تطوير نظام المبيعات والشحن (أسبوع 6-8)](#المرحلة-الثالثة)
4. [المرحلة الرابعة: التقارير والتحليلات المتقدمة (أسبوع 9-10)](#المرحلة-الرابعة)
5. [المرحلة الخامسة: التكامل والأتمتة (أسبوع 11-12)](#المرحلة-الخامسة)

---

## 🚨 المرحلة الأولى: الإصلاحات الحرجة
**المدة**: أسبوعان  
**الأولوية**: حرجة 🔴

### الأسبوع الأول: إصلاح المحرك المحاسبي

#### اليوم 1-2: إصلاح AccountMapping وقاعدة البيانات

**المهام**:

1. **إنشاء AccountMapping على قاعدة البيانات السحابية**
```sql
-- Script 1: التحقق من الحسابات الموجودة
SELECT 
  id, code, name, type, "rootType", "isGroup", balance
FROM accounts 
WHERE type IN ('revenue', 'asset', 'liability')
ORDER BY code;

-- Script 2: إنشاء الحسابات الأساسية إذا لم تكن موجودة
-- حساب المبيعات
INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", level, "isGroup", "isActive", balance, currency, nature, "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  '4101',
  'إيرادات خدمات الشحن',
  'Shipping Services Revenue',
  'revenue',
  'revenue',
  'income_statement',
  2,
  false,
  true,
  0,
  'LYD',
  'credit',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE code = '4101');

-- حساب ذمم العملاء
INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", level, "isGroup", "isActive", balance, currency, nature, "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  '1201',
  'ذمم العملاء',
  'Accounts Receivable',
  'asset',
  'current_assets',
  'balance_sheet',
  2,
  true,
  true,
  0,
  'LYD',
  'debit',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE code = '1201');

-- حساب الضرائب
INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", level, "isGroup", "isActive", balance, currency, nature, "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  '2301',
  'ضريبة القيمة المضافة',
  'VAT Payable',
  'liability',
  'current_liabilities',
  'balance_sheet',
  2,
  false,
  true,
  0,
  'LYD',
  'credit',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE code = '2301');

-- حساب الخصومات
INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", level, "isGroup", "isActive", balance, currency, nature, "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  '4102',
  'خصومات المبيعات',
  'Sales Discounts',
  'revenue',
  'revenue',
  'income_statement',
  2,
  false,
  true,
  0,
  'LYD',
  'debit',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE code = '4102');

-- Script 3: إنشاء AccountMapping
INSERT INTO account_mappings (
  id,
  "salesRevenueAccount",
  "accountsReceivableAccount",
  "salesTaxAccount",
  "discountAccount",
  "shippingRevenueAccount",
  "isActive",
  description,
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM accounts WHERE code = '4101'),
  (SELECT id FROM accounts WHERE code = '1201'),
  (SELECT id FROM accounts WHERE code = '2301'),
  (SELECT id FROM accounts WHERE code = '4102'),
  (SELECT id FROM accounts WHERE code = '4101'),
  true,
  'Account Mapping الأساسي لنظام الشحن الدولي',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Script 4: التحقق من النتيجة
SELECT 
  am.id,
  am.description,
  am."isActive",
  sr.code as sales_code,
  sr.name as sales_name,
  ar.code as ar_code,
  ar.name as ar_name,
  tax.code as tax_code,
  tax.name as tax_name
FROM account_mappings am
LEFT JOIN accounts sr ON am."salesRevenueAccount" = sr.id
LEFT JOIN accounts ar ON am."accountsReceivableAccount" = ar.id
LEFT JOIN accounts tax ON am."salesTaxAccount" = tax.id
WHERE am."isActive" = true;
```

2. **إصلاح معالجة الأخطاء في sales.js**

```javascript
// ملف: server/src/routes/sales.js
// الموقع: السطر 3333-3340 (فواتير المبيعات)
// الموقع: السطر 667-674 (الفواتير العادية)
// الموقع: السطر 2918-2925 (فواتير الشحن)

// استبدال جميع حالات try-catch للقيود المحاسبية بهذا:

// ❌ حذف هذا الكود
/*
try {
  await newInvoice.createJournalEntryAndAffectBalance(validUserId, { transaction });
  console.log('✅ تم إنشاء القيد المحاسبي تلقائياً للفاتورة');
} catch (journalError) {
  console.error('❌ خطأ في إنشاء القيد المحاسبي:', journalError.message);
  // Don't fail the invoice creation if journal entry fails
}
*/

// ✅ استبداله بهذا
await newInvoice.createJournalEntryAndAffectBalance(validUserId, { transaction });
console.log('✅ تم إنشاء القيد المحاسبي تلقائياً للفاتورة');
```

**الملفات المطلوب تعديلها**:
- `server/src/routes/sales.js` (3 مواقع)
- `server/src/routes/financial.js` (إذا وجدت حالات مشابهة)

---

#### اليوم 3-4: إضافة نظام تهيئة تلقائي

**المهمة**: إنشاء نظام تهيئة يعمل عند بدء التشغيل

1. **إنشاء ملف تهيئة المحرك المحاسبي**

```javascript
// ملف جديد: server/src/utils/accountingInitializer.js

import { Account, AccountMapping } from '../models/index.js';
import { Op } from 'sequelize';

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
      } else {
        console.warn('⚠️ النظام المحاسبي يحتاج إلى مراجعة:', healthCheck.issues);
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
    const requiredAccounts = [
      // الأصول
      { code: '1000', name: 'الأصول', nameEn: 'Assets', type: 'asset', rootType: 'assets', isGroup: true, level: 1 },
      { code: '1100', name: 'الأصول المتداولة', nameEn: 'Current Assets', type: 'asset', rootType: 'current_assets', isGroup: true, level: 2, parentCode: '1000' },
      { code: '1101', name: 'النقدية', nameEn: 'Cash', type: 'asset', rootType: 'current_assets', isGroup: false, level: 3, parentCode: '1100' },
      { code: '1102', name: 'البنك', nameEn: 'Bank', type: 'asset', rootType: 'current_assets', isGroup: false, level: 3, parentCode: '1100' },
      { code: '1201', name: 'ذمم العملاء', nameEn: 'Accounts Receivable', type: 'asset', rootType: 'current_assets', isGroup: true, level: 2, parentCode: '1000' },
      
      // الخصوم
      { code: '2000', name: 'الخصوم', nameEn: 'Liabilities', type: 'liability', rootType: 'liabilities', isGroup: true, level: 1 },
      { code: '2100', name: 'الخصوم المتداولة', nameEn: 'Current Liabilities', type: 'liability', rootType: 'current_liabilities', isGroup: true, level: 2, parentCode: '2000' },
      { code: '2201', name: 'ذمم الموردين', nameEn: 'Accounts Payable', type: 'liability', rootType: 'current_liabilities', isGroup: true, level: 2, parentCode: '2000' },
      { code: '2301', name: 'ضريبة القيمة المضافة', nameEn: 'VAT Payable', type: 'liability', rootType: 'current_liabilities', isGroup: false, level: 2, parentCode: '2000' },
      
      // حقوق الملكية
      { code: '3000', name: 'حقوق الملكية', nameEn: 'Equity', type: 'equity', rootType: 'equity', isGroup: true, level: 1 },
      { code: '3101', name: 'رأس المال', nameEn: 'Capital', type: 'equity', rootType: 'equity', isGroup: false, level: 2, parentCode: '3000' },
      { code: '3201', name: 'الأرباح المحتجزة', nameEn: 'Retained Earnings', type: 'equity', rootType: 'equity', isGroup: false, level: 2, parentCode: '3000' },
      
      // الإيرادات
      { code: '4000', name: 'الإيرادات', nameEn: 'Revenue', type: 'revenue', rootType: 'revenue', isGroup: true, level: 1 },
      { code: '4101', name: 'إيرادات خدمات الشحن البحري', nameEn: 'Sea Freight Revenue', type: 'revenue', rootType: 'revenue', isGroup: false, level: 2, parentCode: '4000' },
      { code: '4102', name: 'خصومات المبيعات', nameEn: 'Sales Discounts', type: 'revenue', rootType: 'revenue', isGroup: false, level: 2, parentCode: '4000', nature: 'debit' },
      { code: '4103', name: 'إيرادات خدمات التخليص الجمركي', nameEn: 'Customs Clearance Revenue', type: 'revenue', rootType: 'revenue', isGroup: false, level: 2, parentCode: '4000' },
      { code: '4104', name: 'إيرادات خدمات التخزين', nameEn: 'Storage Services Revenue', type: 'revenue', rootType: 'revenue', isGroup: false, level: 2, parentCode: '4000' },
      
      // المصروفات
      { code: '5000', name: 'المصروفات', nameEn: 'Expenses', type: 'expense', rootType: 'expenses', isGroup: true, level: 1 },
      { code: '5101', name: 'تكلفة الشحن', nameEn: 'Shipping Costs', type: 'expense', rootType: 'expenses', isGroup: false, level: 2, parentCode: '5000' },
      { code: '5102', name: 'رواتب الموظفين', nameEn: 'Salaries', type: 'expense', rootType: 'expenses', isGroup: false, level: 2, parentCode: '5000' },
      { code: '5103', name: 'إيجارات', nameEn: 'Rent', type: 'expense', rootType: 'expenses', isGroup: false, level: 2, parentCode: '5000' },
      { code: '5104', name: 'مصاريف إدارية', nameEn: 'Administrative Expenses', type: 'expense', rootType: 'expenses', isGroup: false, level: 2, parentCode: '5000' }
    ];

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
          reportType: accountData.type === 'revenue' || accountData.type === 'expense' ? 'income_statement' : 'balance_sheet',
          parentId: parentId,
          level: accountData.level,
          isGroup: accountData.isGroup,
          isActive: true,
          balance: 0,
          currency: 'LYD',
          nature: accountData.nature || (accountData.type === 'asset' || accountData.type === 'expense' ? 'debit' : 'credit')
        });
        
        console.log(`✅ تم إنشاء الحساب: ${accountData.code} - ${accountData.name}`);
      }
    }
  }

  /**
   * التأكد من وجود AccountMapping نشط
   */
  static async ensureAccountMapping() {
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
      
      if (salesAccount && arAccount && taxAccount) {
        await AccountMapping.create({
          salesRevenueAccount: salesAccount.id,
          accountsReceivableAccount: arAccount.id,
          salesTaxAccount: taxAccount.id,
          discountAccount: discountAccount?.id,
          shippingRevenueAccount: salesAccount.id,
          customsClearanceAccount: customsAccount?.id,
          storageAccount: storageAccount?.id,
          isActive: true,
          description: 'تم الإنشاء تلقائياً عند بدء التشغيل - نظام الشحن الدولي'
        });
        
        console.log('✅ تم إنشاء Account Mapping تلقائياً');
      } else {
        console.error('❌ لا يمكن إنشاء Account Mapping - بعض الحسابات الأساسية غير موجودة');
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
      
      const accountsCount = await Account.count({
        where: { id: { [Op.in]: requiredAccounts } }
      });
      
      if (accountsCount < 3) {
        issues.push('بعض الحسابات المطلوبة في AccountMapping غير موجودة');
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
```

2. **تعديل server.js لاستدعاء التهيئة**

```javascript
// ملف: server/src/server.js
// إضافة بعد السطر 683 (بعد تهيئة قاعدة البيانات)

import AccountingInitializer from './utils/accountingInitializer.js';

// في دالة startServer() بعد تهيئة قاعدة البيانات
async function startServer() {
  try {
    console.log('🚀 Starting Golden Horse Shipping Server...');

    // Initialize database
    const dbInit = await DatabaseInitializer.initializeDatabase();
    if (!dbInit.success) {
      console.error('❌ Failed to initialize database:', dbInit.error);
      console.warn('⚠️  Continuing without database - some features may be limited');
    }

    // ✅ إضافة هذا الكود الجديد
    // Initialize accounting system
    try {
      await AccountingInitializer.initialize();
    } catch (error) {
      console.error('❌ Failed to initialize accounting system:', error);
      // لا نوقف السيرفر، لكن نحذر
      console.warn('⚠️  Accounting system may not function correctly');
    }

    // ... باقي الكود
  }
}
```

---

#### اليوم 5-7: إضافة إنشاء حسابات تلقائي للعملاء والموردين

**المهمة**: إنشاء حسابات فرعية تلقائياً عند إضافة عميل أو مورد

1. **تعديل نموذج Customer**

```javascript
// ملف: server/src/models/Customer.js
// إضافة في نهاية الملف قبل return Customer

/**
 * إنشاء أو الحصول على حساب العميل في دليل الحسابات
 */
Customer.prototype.ensureAccount = async function(transaction) {
  const { Account } = sequelize.models;
  const t = transaction || await sequelize.transaction();
  const shouldCommit = !transaction;

  try {
    // البحث عن الحساب الموجود
    let account = await Account.findOne({
      where: { 
        code: `1201-${this.code}`,
        type: 'asset'
      },
      transaction: t
    });

    if (!account) {
      // البحث عن الحساب الأب (ذمم العملاء)
      const parentAccount = await Account.findOne({
        where: { 
          code: '1201',
          isGroup: true
        },
        transaction: t
      });

      if (!parentAccount) {
        throw new Error('حساب ذمم العملاء الرئيسي غير موجود');
      }

      // إنشاء الحساب
      account = await Account.create({
        code: `1201-${this.code}`,
        name: `ذمم العميل - ${this.name}`,
        nameEn: `Customer AR - ${this.name}`,
        type: 'asset',
        rootType: 'current_assets',
        reportType: 'balance_sheet',
        parentId: parentAccount.id,
        level: parentAccount.level + 1,
        isGroup: false,
        isActive: true,
        balance: 0,
        currency: this.currency || 'LYD',
        nature: 'debit',
        description: `حساب العميل: ${this.name} (${this.code})`
      }, { transaction: t });

      console.log(`✅ تم إنشاء حساب للعميل: ${this.name} (${account.code})`);
    }

    if (shouldCommit) await t.commit();
    return account;
  } catch (error) {
    if (shouldCommit) await t.rollback();
    throw error;
  }
};

/**
 * Hook: إنشاء حساب تلقائياً عند إنشاء عميل جديد
 */
Customer.addHook('afterCreate', async (customer, options) => {
  try {
    await customer.ensureAccount(options.transaction);
  } catch (error) {
    console.error(`❌ فشل إنشاء حساب للعميل ${customer.name}:`, error.message);
    // لا نفشل العملية، فقط نسجل الخطأ
  }
});
```

2. **تعديل نموذج Supplier**

```javascript
// ملف: server/src/models/Supplier.js
// نفس الكود أعلاه مع تغيير:
// - code: `2201-${this.code}` (حسابات الموردين)
// - parentCode: '2201'
// - type: 'liability'
// - nature: 'credit'

Supplier.prototype.ensureAccount = async function(transaction) {
  const { Account } = sequelize.models;
  const t = transaction || await sequelize.transaction();
  const shouldCommit = !transaction;

  try {
    let account = await Account.findOne({
      where: { 
        code: `2201-${this.code}`,
        type: 'liability'
      },
      transaction: t
    });

    if (!account) {
      const parentAccount = await Account.findOne({
        where: { 
          code: '2201',
          isGroup: true
        },
        transaction: t
      });

      if (!parentAccount) {
        throw new Error('حساب ذمم الموردين الرئيسي غير موجود');
      }

      account = await Account.create({
        code: `2201-${this.code}`,
        name: `ذمم المورد - ${this.name}`,
        nameEn: `Supplier AP - ${this.name}`,
        type: 'liability',
        rootType: 'current_liabilities',
        reportType: 'balance_sheet',
        parentId: parentAccount.id,
        level: parentAccount.level + 1,
        isGroup: false,
        isActive: true,
        balance: 0,
        currency: this.currency || 'LYD',
        nature: 'credit',
        description: `حساب المورد: ${this.name} (${this.code})`
      }, { transaction: t });

      console.log(`✅ تم إنشاء حساب للمورد: ${this.name} (${account.code})`);
    }

    if (shouldCommit) await t.commit();
    return account;
  } catch (error) {
    if (shouldCommit) await t.rollback();
    throw error;
  }
};

Supplier.addHook('afterCreate', async (supplier, options) => {
  try {
    await supplier.ensureAccount(options.transaction);
  } catch (error) {
    console.error(`❌ فشل إنشاء حساب للمورد ${supplier.name}:`, error.message);
  }
});
```

---

### الأسبوع الثاني: إضافة Database Triggers والتحسينات

#### اليوم 8-10: إضافة Database Triggers

**المهمة**: إنشاء Triggers لتحديث الأرصدة تلقائياً

```sql
-- ملف: server/database/triggers/account_balance_triggers.sql

-- 1. Trigger لتحديث أرصدة الحسابات عند إضافة GL Entry
CREATE OR REPLACE FUNCTION update_account_balance_on_gl_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- تحديث رصيد الحساب
  UPDATE accounts 
  SET 
    balance = balance + NEW.debit - NEW.credit,
    "updatedAt" = NOW()
  WHERE id = NEW."accountId";
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gl_entry_balance_update ON gl_entries;
CREATE TRIGGER gl_entry_balance_update
AFTER INSERT ON gl_entries
FOR EACH ROW EXECUTE FUNCTION update_account_balance_on_gl_insert();

-- 2. Trigger لتحديث الأرصدة عند تعديل GL Entry
CREATE OR REPLACE FUNCTION update_account_balance_on_gl_update()
RETURNS TRIGGER AS $$
BEGIN
  -- إلغاء القيمة القديمة
  UPDATE accounts 
  SET 
    balance = balance - (OLD.debit - OLD.credit),
    "updatedAt" = NOW()
  WHERE id = OLD."accountId";
  
  -- إضافة القيمة الجديدة
  UPDATE accounts 
  SET 
    balance = balance + (NEW.debit - NEW.credit),
    "updatedAt" = NOW()
  WHERE id = NEW."accountId";
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gl_entry_balance_update_trigger ON gl_entries;
CREATE TRIGGER gl_entry_balance_update_trigger
AFTER UPDATE ON gl_entries
FOR EACH ROW EXECUTE FUNCTION update_account_balance_on_gl_update();

-- 3. Trigger لتحديث الأرصدة عند حذف GL Entry
CREATE OR REPLACE FUNCTION update_account_balance_on_gl_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- إلغاء القيمة
  UPDATE accounts 
  SET 
    balance = balance - (OLD.debit - OLD.credit),
    "updatedAt" = NOW()
  WHERE id = OLD."accountId";
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gl_entry_balance_delete_trigger ON gl_entries;
CREATE TRIGGER gl_entry_balance_delete_trigger
AFTER DELETE ON gl_entries
FOR EACH ROW EXECUTE FUNCTION update_account_balance_on_gl_delete();

-- 4. Trigger لتحديث رصيد العميل عند إنشاء فاتورة
CREATE OR REPLACE FUNCTION update_customer_balance_on_invoice()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE customers 
    SET 
      balance = balance + NEW.total,
      "updatedAt" = NOW()
    WHERE id = NEW."customerId";
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE customers 
    SET 
      balance = balance - OLD.total + NEW.total,
      "updatedAt" = NOW()
    WHERE id = NEW."customerId";
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE customers 
    SET 
      balance = balance - OLD.total,
      "updatedAt" = NOW()
    WHERE id = OLD."customerId";
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sales_invoice_customer_balance ON sales_invoices;
CREATE TRIGGER sales_invoice_customer_balance
AFTER INSERT OR UPDATE OR DELETE ON sales_invoices
FOR EACH ROW EXECUTE FUNCTION update_customer_balance_on_invoice();

-- 5. Trigger لتحديث حالة الدفع للفاتورة
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  invoice_total DECIMAL(15,2);
  paid_amount DECIMAL(15,2);
BEGIN
  -- الحصول على إجمالي الفاتورة والمبلغ المدفوع
  SELECT total, "paidAmount" INTO invoice_total, paid_amount
  FROM sales_invoices
  WHERE id = NEW."invoiceId";
  
  -- تحديث حالة الدفع
  IF paid_amount >= invoice_total THEN
    UPDATE sales_invoices 
    SET "paymentStatus" = 'paid'
    WHERE id = NEW."invoiceId";
  ELSIF paid_amount > 0 THEN
    UPDATE sales_invoices 
    SET "paymentStatus" = 'partial'
    WHERE id = NEW."invoiceId";
  ELSE
    UPDATE sales_invoices 
    SET "paymentStatus" = 'unpaid'
    WHERE id = NEW."invoiceId";
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payment_status_update ON sales_invoice_payments;
CREATE TRIGGER payment_status_update
AFTER INSERT OR UPDATE ON sales_invoice_payments
FOR EACH ROW EXECUTE FUNCTION update_invoice_payment_status();
```

**تشغيل الـ Triggers**:
```javascript
// ملف: server/src/scripts/installTriggers.js

import { sequelize } from '../models/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function installTriggers() {
  try {
    console.log('📦 جاري تثبيت Database Triggers...');
    
    const sqlFile = path.join(__dirname, '../../database/triggers/account_balance_triggers.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // تقسيم الملف إلى statements منفصلة
    const statements = sql.split(';').filter(s => s.trim().length > 0);
    
    for (const statement of statements) {
      await sequelize.query(statement);
    }
    
    console.log('✅ تم تثبيت جميع Triggers بنجاح');
  } catch (error) {
    console.error('❌ فشل تثبيت Triggers:', error);
    throw error;
  }
}

installTriggers()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
```

---

#### اليوم 11-14: إضافة endpoint للتحقق من صحة النظام

```javascript
// ملف: server/src/routes/financial.js
// إضافة في نهاية الملف

/**
 * GET /api/financial/system-health
 * فحص صحة النظام المحاسبي
 */
router.get('/system-health', authenticateToken, async (req, res) => {
  try {
    const health = {
      timestamp: new Date().toISOString(),
      checks: {},
      issues: [],
      recommendations: []
    };

    // 1. فحص AccountMapping
    const mapping = await AccountMapping.findOne({ where: { isActive: true } });
    health.checks.accountMapping = {
      exists: !!mapping,
      isActive: mapping?.isActive || false
    };

    if (!mapping) {
      health.issues.push('لا يوجد Account Mapping نشط');
      health.recommendations.push('قم بإنشاء Account Mapping من صفحة الإعدادات');
    } else {
      // فحص الحسابات المطلوبة
      const requiredAccounts = [
        { id: mapping.salesRevenueAccount, name: 'حساب المبيعات' },
        { id: mapping.accountsReceivableAccount, name: 'حساب ذمم العملاء' },
        { id: mapping.salesTaxAccount, name: 'حساب الضرائب' }
      ];

      for (const req of requiredAccounts) {
        if (req.id) {
          const account = await Account.findByPk(req.id);
          if (!account) {
            health.issues.push(`${req.name} غير موجود في دليل الحسابات`);
          }
        } else {
          health.issues.push(`${req.name} غير محدد في AccountMapping`);
        }
      }
    }

    // 2. فحص دليل الحسابات
    const accountsCount = await Account.count();
    const activeAccountsCount = await Account.count({ where: { isActive: true } });
    
    health.checks.chartOfAccounts = {
      totalAccounts: accountsCount,
      activeAccounts: activeAccountsCount
    };

    if (accountsCount < 10) {
      health.issues.push('عدد الحسابات قليل جداً');
      health.recommendations.push('قم بإنشاء دليل حسابات كامل');
    }

    // 3. فحص القيود المحاسبية
    const glEntriesCount = await GLEntry.count();
    const journalEntriesCount = await JournalEntry.count();
    
    health.checks.accountingEntries = {
      glEntries: glEntriesCount,
      journalEntries: journalEntriesCount
    };

    // 4. فحص تطابق الأرصدة
    const balanceMismatch = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM accounts a
      LEFT JOIN (
        SELECT "accountId", SUM(debit - credit) as gl_balance
        FROM gl_entries
        GROUP BY "accountId"
      ) ge ON a.id = ge."accountId"
      WHERE ABS(a.balance - COALESCE(ge.gl_balance, 0)) > 0.01
    `, { type: sequelize.QueryTypes.SELECT });

    health.checks.balanceIntegrity = {
      accountsWithMismatch: parseInt(balanceMismatch[0].count)
    };

    if (balanceMismatch[0].count > 0) {
      health.issues.push(`${balanceMismatch[0].count} حساب لديه عدم تطابق في الرصيد`);
      health.recommendations.push('قم بتشغيل أداة إعادة حساب الأرصدة');
    }

    // 5. فحص الفواتير بدون قيود
    const invoicesWithoutJE = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM sales_invoices si
      LEFT JOIN journal_entries je ON je.description LIKE '%' || si."invoiceNumber" || '%'
      WHERE je.id IS NULL
    `, { type: sequelize.QueryTypes.SELECT });

    health.checks.invoiceIntegrity = {
      invoicesWithoutJournalEntry: parseInt(invoicesWithoutJE[0].count)
    };

    if (invoicesWithoutJE[0].count > 0) {
      health.issues.push(`${invoicesWithoutJE[0].count} فاتورة بدون قيد محاسبي`);
      health.recommendations.push('قم بمراجعة الفواتير وإنشاء القيود المفقودة');
    }

    // تحديد الحالة العامة
    health.status = health.issues.length === 0 ? 'healthy' : 'needs_attention';
    health.healthy = health.issues.length === 0;

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في فحص صحة النظام',
      error: error.message
    });
  }
});

/**
 * POST /api/financial/recalculate-balances
 * إعادة حساب جميع الأرصدة من القيود
 */
router.post('/recalculate-balances', authenticateToken, requireRole(['admin']), async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔄 بدء إعادة حساب الأرصدة...');
    
    // 1. إعادة تعيين جميع الأرصدة إلى صفر
    await Account.update(
      { balance: 0 },
      { where: {}, transaction }
    );

    // 2. حساب الأرصدة من GL Entries
    const balances = await sequelize.query(`
      SELECT 
        "accountId",
        SUM(debit - credit) as calculated_balance
      FROM gl_entries
      GROUP BY "accountId"
    `, { type: sequelize.QueryTypes.SELECT, transaction });

    // 3. تحديث الأرصدة
    for (const balance of balances) {
      await Account.update(
        { balance: balance.calculated_balance },
        { where: { id: balance.accountId }, transaction }
      );
    }

    await transaction.commit();

    console.log(`✅ تم إعادة حساب أرصدة ${balances.length} حساب`);

    res.json({
      success: true,
      message: 'تم إعادة حساب الأرصدة بنجاح',
      accountsUpdated: balances.length
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error recalculating balances:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إعادة حساب الأرصدة',
      error: error.message
    });
  }
});
```

---

## ✅ نتائج المرحلة الأولى

بعد إكمال المرحلة الأولى، سيكون لديك:

1. ✅ AccountMapping نشط وجاهز
2. ✅ دليل حسابات كامل للشحن الدولي
3. ✅ إنشاء حسابات تلقائي للعملاء والموردين
4. ✅ Database Triggers لتحديث الأرصدة تلقائياً
5. ✅ نظام تهيئة تلقائي عند بدء التشغيل
6. ✅ endpoint لفحص صحة النظام
7. ✅ أداة لإعادة حساب الأرصدة
8. ✅ معالجة صحيحة للأخطاء (لا تجاهل)

**الملفات المعدلة/المضافة**:
- ✅ `server/src/utils/accountingInitializer.js` (جديد)
- ✅ `server/src/models/Customer.js` (معدل)
- ✅ `server/src/models/Supplier.js` (معدل)
- ✅ `server/src/routes/sales.js` (معدل)
- ✅ `server/src/routes/financial.js` (معدل)
- ✅ `server/src/server.js` (معدل)
- ✅ `server/database/triggers/account_balance_triggers.sql` (جديد)
- ✅ `server/src/scripts/installTriggers.js` (جديد)

---

## 🚀 المرحلة الثانية: تطوير المحرك المحاسبي المتقدم
**المدة**: 3 أسابيع  
**الأولوية**: عالية 🟡

### الأسبوع الثالث: نظام الفترات المحاسبية والإقفالات

#### المهام الرئيسية:

1. **نظام الفترات المحاسبية (Accounting Periods)**
```javascript
// ملف: server/src/models/AccountingPeriod.js - تحسين

// إضافة دوال جديدة:
AccountingPeriod.getCurrentPeriod = async function() {
  return await this.findOne({
    where: {
      startDate: { [Op.lte]: new Date() },
      endDate: { [Op.gte]: new Date() },
      status: 'open'
    }
  });
};

AccountingPeriod.closePeriod = async function(periodId, userId) {
  const transaction = await sequelize.transaction();
  
  try {
    const period = await this.findByPk(periodId, { transaction });
    
    if (!period) throw new Error('الفترة المحاسبية غير موجودة');
    if (period.status === 'closed') throw new Error('الفترة مقفلة بالفعل');
    
    // 1. التحقق من توازن القيود
    const unbalancedEntries = await JournalEntry.count({
      where: {
        date: {
          [Op.between]: [period.startDate, period.endDate]
        },
        totalDebit: { [Op.ne]: sequelize.col('totalCredit') }
      },
      transaction
    });
    
    if (unbalancedEntries > 0) {
      throw new Error(`يوجد ${unbalancedEntries} قيد غير متوازن في هذه الفترة`);
    }
    
    // 2. إنشاء قيد الإقفال
    const closingEntry = await this.createClosingEntry(period, userId, transaction);
    
    // 3. إقفال الفترة
    await period.update({
      status: 'closed',
      closedBy: userId,
      closedAt: new Date(),
      closingEntryId: closingEntry.id
    }, { transaction });
    
    await transaction.commit();
    return period;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

AccountingPeriod.createClosingEntry = async function(period, userId, transaction) {
  // إنشاء قيد إقفال الإيرادات والمصروفات
  const { Account, JournalEntry, JournalEntryDetail, GLEntry } = sequelize.models;
  
  // حساب صافي الربح/الخسارة
  const revenueAccounts = await Account.findAll({
    where: { type: 'revenue', isActive: true },
    transaction
  });
  
  const expenseAccounts = await Account.findAll({
    where: { type: 'expense', isActive: true },
    transaction
  });
  
  let totalRevenue = 0;
  let totalExpense = 0;
  
  for (const account of revenueAccounts) {
    totalRevenue += parseFloat(account.balance || 0);
  }
  
  for (const account of expenseAccounts) {
    totalExpense += parseFloat(account.balance || 0);
  }
  
  const netIncome = totalRevenue - totalExpense;
  
  // إنشاء قيد الإقفال
  const closingEntry = await JournalEntry.create({
    entryNumber: `CLOSE-${period.name}`,
    date: period.endDate,
    description: `قيد إقفال الفترة المحاسبية: ${period.name}`,
    totalDebit: Math.abs(netIncome),
    totalCredit: Math.abs(netIncome),
    status: 'posted',
    type: 'closing',
    createdBy: userId
  }, { transaction });
  
  // تفاصيل القيد...
  // (سيتم إكمالها في الكود الكامل)
  
  return closingEntry;
};
```

2. **نظام الموازنات (Budgeting)**
3. **تقارير التدفق النقدي المتقدمة**
4. **نظام مراكز التكلفة**

### الأسبوع الرابع: التكامل مع العملات المتعددة

#### المهام:

1. **نظام أسعار الصرف التلقائي**
```javascript
// ملف جديد: server/src/services/exchangeRateService.js

class ExchangeRateService {
  /**
   * الحصول على سعر الصرف من API خارجي
   */
  static async fetchExchangeRate(fromCurrency, toCurrency, date = new Date()) {
    // التكامل مع API مثل exchangerate-api.com
    // أو استخدام أسعار ثابتة للدينار الليبي
    
    const rates = {
      'USD_LYD': 4.85,
      'EUR_LYD': 5.20,
      'CNY_LYD': 0.68,
      'LYD_USD': 0.206,
      'LYD_EUR': 0.192,
      'LYD_CNY': 1.47
    };
    
    const key = `${fromCurrency}_${toCurrency}`;
    return rates[key] || 1.0;
  }
  
  /**
   * تحويل المبلغ من عملة لأخرى
   */
  static async convertAmount(amount, fromCurrency, toCurrency, date = new Date()) {
    if (fromCurrency === toCurrency) return amount;
    
    const rate = await this.fetchExchangeRate(fromCurrency, toCurrency, date);
    return amount * rate;
  }
}
```

2. **تقارير متعددة العملات**
3. **إعادة تقييم العملات الأجنبية**

### الأسبوع الخامس: نظام الأصول الثابتة المتقدم

#### المهام:

1. **حساب الإهلاك التلقائي**
2. **جدولة الإهلاك**
3. **تقارير الأصول الثابتة**

---

## 🚢 المرحلة الثالثة: تطوير نظام المبيعات والشحن الدولي
**المدة**: 3 أسابيع  
**الأولوية**: عالية 🟡

### الأسبوع السادس: نظام الشحنات المتقدم

#### المهام:

1. **تتبع الشحنات من الصين إلى ليبيا**
```javascript
// ملف جديد: server/src/models/InternationalShipment.js

export default (sequelize) => {
  const InternationalShipment = sequelize.define('InternationalShipment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    shipmentNumber: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false
    },
    // معلومات الشحنة
    originPort: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'ميناء الشحن في الصين'
    },
    destinationPort: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'ميناء الوصول في ليبيا (طرابلس/بنغازي/مصراتة)'
    },
    containerNumber: {
      type: DataTypes.STRING(50),
      comment: 'رقم الحاوية'
    },
    containerType: {
      type: DataTypes.ENUM('20ft', '40ft', '40ft_hc', 'lcl'),
      defaultValue: '40ft'
    },
    // التواريخ
    loadingDate: {
      type: DataTypes.DATEONLY,
      comment: 'تاريخ التحميل'
    },
    etd: {
      type: DataTypes.DATEONLY,
      comment: 'تاريخ المغادرة المتوقع'
    },
    eta: {
      type: DataTypes.DATEONLY,
      comment: 'تاريخ الوصول المتوقع'
    },
    actualArrivalDate: {
      type: DataTypes.DATEONLY,
      comment: 'تاريخ الوصول الفعلي'
    },
    customsClearanceDate: {
      type: DataTypes.DATEONLY,
      comment: 'تاريخ التخليص الجمركي'
    },
    deliveryDate: {
      type: DataTypes.DATEONLY,
      comment: 'تاريخ التسليم للعميل'
    },
    // الحالة
    status: {
      type: DataTypes.ENUM(
        'pending',           // قيد الإعداد
        'loaded',            // تم التحميل
        'in_transit',        // في الطريق
        'arrived',           // وصلت
        'customs_clearance', // في الجمارك
        'cleared',           // تم التخليص
        'delivered',         // تم التسليم
        'completed'          // مكتملة
      ),
      defaultValue: 'pending'
    },
    // التكاليف
    freightCost: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      comment: 'تكلفة الشحن'
    },
    customsDuties: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      comment: 'الرسوم الجمركية'
    },
    portCharges: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      comment: 'رسوم الميناء'
    },
    insuranceCost: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      comment: 'تكلفة التأمين'
    },
    otherCosts: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      comment: 'تكاليف أخرى'
    },
    totalCost: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      comment: 'إجمالي التكلفة'
    },
    // معلومات إضافية
    shippingLine: {
      type: DataTypes.STRING(100),
      comment: 'خط الشحن'
    },
    vesselName: {
      type: DataTypes.STRING(100),
      comment: 'اسم السفينة'
    },
    billOfLadingNumber: {
      type: DataTypes.STRING(50),
      comment: 'رقم بوليصة الشحن (B/L)'
    },
    notes: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'international_shipments',
    timestamps: true
  });

  // العلاقات
  InternationalShipment.associate = (models) => {
    InternationalShipment.hasMany(models.ShipmentItem, {
      foreignKey: 'shipmentId',
      as: 'items'
    });
    InternationalShipment.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
  };

  return InternationalShipment;
};
```

2. **نظام تتبع الحاويات**
3. **حساب التكاليف التلقائي**
4. **تكامل مع شركات الشحن (APIs)**

### الأسبوع السابع: نظام التخليص الجمركي

#### المهام:

1. **إدارة المستندات الجمركية**
2. **حساب الرسوم الجمركية**
3. **تتبع حالة التخليص**
4. **تقارير الجمارك**

### الأسبوع الثامن: نظام إدارة المخازن

#### المهام:

1. **مخازن متعددة (الصين - ليبيا)**
2. **نظام الباركود**
3. **جرد المخزون**
4. **تقارير المخزون المتقدمة**

---

## 📊 المرحلة الرابعة: التقارير والتحليلات المتقدمة
**المدة**: أسبوعان  
**الأولوية**: متوسطة 🟢

### الأسبوع التاسع: لوحة تحكم تنفيذية

#### المهام:

1. **Dashboard للإدارة العليا**
```javascript
// ملف جديد: server/src/routes/executiveDashboard.js

router.get('/executive-summary', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // 1. الأداء المالي
    const financialPerformance = await getFinancialPerformance(period);
    
    // 2. أداء المبيعات
    const salesPerformance = await getSalesPerformance(period);
    
    // 3. الشحنات النشطة
    const activeShipments = await getActiveShipments();
    
    // 4. العملاء الأكثر ربحية
    const topCustomers = await getTopCustomers(period);
    
    // 5. التدفق النقدي
    const cashFlow = await getCashFlowSummary(period);
    
    // 6. مؤشرات الأداء الرئيسية (KPIs)
    const kpis = {
      revenueGrowth: calculateGrowth(financialPerformance),
      profitMargin: calculateProfitMargin(financialPerformance),
      customerRetention: await calculateRetention(period),
      averageShipmentTime: await calculateAvgShipmentTime(period),
      onTimeDelivery: await calculateOnTimeDelivery(period)
    };
    
    res.json({
      success: true,
      data: {
        financialPerformance,
        salesPerformance,
        activeShipments,
        topCustomers,
        cashFlow,
        kpis,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error generating executive summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

2. **تقارير مخصصة قابلة للتصدير**
3. **تحليلات تنبؤية**
4. **تقارير مقارنة (Year-over-Year)**

### الأسبوع العاشر: تقارير متقدمة

#### المهام:

1. **تقرير الربحية حسب العميل**
2. **تقرير الربحية حسب الخط الملاحي**
3. **تحليل التكاليف**
4. **تقارير الأداء**

---

## 🤖 المرحلة الخامسة: التكامل والأتمتة
**المدة**: أسبوعان  
**الأولوية**: متوسطة 🟢

### الأسبوع الحادي عشر: الأتمتة والإشعارات

#### المهام:

1. **إشعارات تلقائية**
```javascript
// أمثلة على الإشعارات التلقائية:
- تنبيه عند وصول شحنة
- تنبيه قبل استحقاق فاتورة
- تنبيه عند تجاوز حد ائتماني
- تنبيه عند اكتمال التخليص الجمركي
- تقرير يومي للإدارة
```

2. **مهام مجدولة (Cron Jobs)**
```javascript
// ملف: server/src/services/scheduledTasks.js

import cron from 'node-cron';

class ScheduledTasks {
  static initialize() {
    // 1. تحديث أسعار الصرف يومياً
    cron.schedule('0 9 * * *', async () => {
      await ExchangeRateService.updateRates();
    });
    
    // 2. حساب الإهلاك شهرياً
    cron.schedule('0 0 1 * *', async () => {
      await DepreciationService.calculateMonthlyDepreciation();
    });
    
    // 3. إرسال تقرير يومي للإدارة
    cron.schedule('0 8 * * *', async () => {
      await ReportService.sendDailySummary();
    });
    
    // 4. تحديث حالة الشحنات
    cron.schedule('0 */6 * * *', async () => {
      await ShipmentTrackingService.updateShipmentStatuses();
    });
  }
}
```

3. **تكامل مع البريد الإلكتروني**
4. **تكامل مع WhatsApp Business API**

### الأسبوع الثاني عشر: الاختبار والتوثيق

#### المهام:

1. **اختبارات شاملة**
2. **توثيق API**
3. **دليل المستخدم**
4. **فيديوهات تدريبية**

---

## 📈 مؤشرات النجاح (KPIs)

### بعد المرحلة الأولى:
- ✅ 100% من الفواتير لها قيود محاسبية
- ✅ 0 أخطاء في ميزان المراجعة
- ✅ إنشاء حسابات تلقائي لجميع العملاء

### بعد المرحلة الثانية:
- ✅ نظام فترات محاسبية كامل
- ✅ دعم 4 عملات (LYD, USD, EUR, CNY)
- ✅ تقارير مالية متقدمة

### بعد المرحلة الثالثة:
- ✅ تتبع 100% من الشحنات
- ✅ حساب تكاليف تلقائي
- ✅ تكامل مع شركات الشحن

### بعد المرحلة الرابعة:
- ✅ لوحة تحكم تنفيذية كاملة
- ✅ 20+ تقرير متقدم
- ✅ تحليلات تنبؤية

### بعد المرحلة الخامسة:
- ✅ أتمتة 80% من العمليات
- ✅ إشعارات فورية
- ✅ تكامل كامل مع الأنظمة الخارجية

---

## 🛠️ الأدوات والتقنيات المطلوبة

### Backend:
- ✅ Node.js 18+
- ✅ Express.js
- ✅ PostgreSQL 15+
- ✅ Sequelize ORM
- ✅ Redis (للـ caching)
- ✅ Node-cron (للمهام المجدولة)
- ✅ Winston (للـ logging)

### Frontend:
- ✅ React 18+
- ✅ TypeScript
- ✅ TailwindCSS
- ✅ Chart.js / Recharts
- ✅ React Query
- ✅ Zustand (state management)

### DevOps:
- ✅ Docker
- ✅ GitHub Actions (CI/CD)
- ✅ PM2 (process manager)

---

## 💰 التكلفة المتوقعة

### تكاليف التطوير:
- المرحلة الأولى: 2 أسابيع × مطور واحد
- المرحلة الثانية: 3 أسابيع × مطور واحد
- المرحلة الثالثة: 3 أسابيع × مطور واحد
- المرحلة الرابعة: 2 أسابيع × مطور واحد
- المرحلة الخامسة: 2 أسابيع × مطور واحد

**إجمالي**: 12 أسبوع

### تكاليف البنية التحتية (شهرياً):
- قاعدة بيانات PostgreSQL: $20-50
- Redis: $10-20
- Hosting: $30-100
- Backup Storage: $10-20
- Email Service: $10-30

**إجمالي شهري**: $80-220

---

## 📝 الخلاصة

هذه خطة عمل شاملة لتحويل نظام Golden Horse إلى منظومة مالية ومبيعات عالمية المستوى لشركة شحن دولية.

### الأولويات:
1. 🔴 **المرحلة الأولى** (أسبوعان): إصلاح المشاكل الحرجة - **ابدأ فوراً**
2. 🟡 **المرحلة الثانية** (3 أسابيع): تطوير المحرك المحاسبي
3. 🟡 **المرحلة الثالثة** (3 أسابيع): نظام الشحن الدولي
4. 🟢 **المرحلة الرابعة** (أسبوعان): التقارير المتقدمة
5. 🟢 **المرحلة الخامسة** (أسبوعان): الأتمتة والتكامل

### الخطوة التالية:
**ابدأ بتنفيذ المرحلة الأولى - اليوم 1-2** من هذه الخطة!

---

**تم إعداد هذه الخطة بواسطة**: Cascade AI  
**التاريخ**: 2025-10-01  
**الحالة**: جاهزة للتنفيذ ✅
