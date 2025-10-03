# 📋 خطة المرحلة الثانية - تطوير المحرك المحاسبي المتقدم

**تاريخ البدء:** 2025-10-02  
**المدة المتوقعة:** 3 أسابيع  
**الحالة:** 🚀 قيد التنفيذ

---

## 🎯 الأهداف الرئيسية

1. ✅ **إصلاح مشكلة UUID في `createdBy`** (أولوية قصوى)
2. **تحسين نظام الفترات المحاسبية**
3. **إضافة خدمة أسعار الصرف المتعددة**
4. **تحسين واجهة النظام المحاسبي**
5. **إضافة Dashboard للصحة المالية**

---

## 📊 المهام التفصيلية

### 🔴 **المهمة 1: إصلاح UUID (الأولوية القصوى)**

#### المشكلة:
```
Error: invalid input syntax for type uuid: "1"
```

#### السبب:
- `req.user.id` في بعض الأحيان يكون UUID صحيح
- في routes مختلفة يتم محاولة "إصلاحه" بشكل متكرر
- هذا يخلق تعقيد غير ضروري

#### الحل:
**الخطوة 1:** تبسيط `server/src/middleware/auth.js`
- `req.user.id` يجب أن يكون دائماً UUID (تم بالفعل ✅)
- إزالة كل المحاولات الزائدة لتحويل ID في routes

**الخطوة 2:** تنظيف `server/src/routes/sales.js`
- إزالة كل كتل الكود التي تحاول تحويل `req.user.id`
- استخدام `req.user.id` مباشرة في كل مكان

**الخطوة 3:** اختبار
- إنشاء فاتورة جديدة
- إنشاء إيصال قبض
- التحقق من أن جميع العمليات تعمل

#### الملفات المتأثرة:
```
✅ server/src/middleware/auth.js (جاهز)
⏳ server/src/routes/sales.js (يحتاج تنظيف)
⏳ server/src/routes/financial.js (فحص)
⏳ server/src/routes/purchases.js (فحص)
```

---

### 🟡 **المهمة 2: نظام الفترات المحاسبية المتقدم**

#### الهدف:
نظام متكامل لإدارة الفترات المحاسبية مع إقفال آلي

#### المكونات:

**1. تحسين Model:**
```javascript
// server/src/models/AccountingPeriod.js

// Static Methods:
- getCurrentPeriod()
- closePeriod(periodId, userId)
- createClosingEntry(period, userId, transaction)
- reopenPeriod(periodId, userId)

// Instance Methods:
- canClose()
- getFinancialSummary()
```

**2. API Endpoints:**
```
GET    /api/financial/periods              - قائمة الفترات
POST   /api/financial/periods              - إنشاء فترة جديدة
GET    /api/financial/periods/:id          - تفاصيل فترة
PUT    /api/financial/periods/:id          - تحديث فترة
POST   /api/financial/periods/:id/close    - إقفال فترة
POST   /api/financial/periods/:id/reopen   - إعادة فتح فترة
GET    /api/financial/periods/current      - الفترة الحالية
```

**3. Business Logic:**
- التحقق من توازن جميع القيود قبل الإقفال
- إنشاء قيد إقفال تلقائي
- نقل الأرباح المحتجزة
- منع التعديل على فترات مقفلة

---

### 🟡 **المهمة 3: خدمة أسعار الصرف**

#### الهدف:
دعم 4 عملات: LYD, USD, EUR, CNY

#### المكونات:

**1. Service Class:**
```javascript
// server/src/services/ExchangeRateService.js

class ExchangeRateService {
  // الحصول على سعر الصرف
  static async getRate(fromCurrency, toCurrency, date)
  
  // تحويل مبلغ
  static async convertAmount(amount, fromCurrency, toCurrency, date)
  
  // تحديث الأسعار من API خارجي
  static async updateRates()
  
  // حفظ سعر يدوياً
  static async saveRate(fromCurrency, toCurrency, rate, date)
}
```

**2. Database Table:**
```sql
CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(12, 6) NOT NULL,
  effective_date DATE NOT NULL,
  source VARCHAR(50), -- 'manual', 'api', 'system'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(from_currency, to_currency, effective_date)
);
```

**3. Default Rates (ليبيا):**
```javascript
const DEFAULT_RATES = {
  'USD_LYD': 4.85,
  'EUR_LYD': 5.20,
  'CNY_LYD': 0.68,
  'LYD_USD': 0.206,
  'LYD_EUR': 0.192,
  'LYD_CNY': 1.47
};
```

**4. API Endpoints:**
```
GET    /api/financial/exchange-rates              - قائمة الأسعار
POST   /api/financial/exchange-rates              - إضافة سعر
GET    /api/financial/exchange-rates/convert      - تحويل مبلغ
POST   /api/financial/exchange-rates/update-all   - تحديث من API
```

---

### 🟡 **المهمة 4: جدول المدفوعات للفواتير**

#### الهدف:
إنشاء `sales_invoice_payments` وتفعيل trigger

#### الخطوات:

**1. Migration:**
```javascript
// server/src/migrations/024-create-sales-invoice-payments.cjs

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sales_invoice_payments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      invoice_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'sales_invoices',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      payment_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      payment_method: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      payment_reference: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // إضافة indexes
    await queryInterface.addIndex('sales_invoice_payments', ['invoice_id']);
    await queryInterface.addIndex('sales_invoice_payments', ['payment_date']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('sales_invoice_payments');
  }
};
```

**2. تفعيل Trigger:**
```sql
-- في server/database/triggers/account_balance_triggers.sql
-- إزالة التعليق من trigger: payment_status_update
```

**3. تحديث Model:**
```javascript
// server/src/models/SalesInvoicePayment.js
// تحديث tableName إلى 'sales_invoice_payments'
```

---

### 🟢 **المهمة 5: System Health Dashboard (UI)**

#### الهدف:
واجهة مرئية لفحص صحة النظام

#### المكونات:

**1. صفحة جديدة:**
```
client/src/pages/SystemHealth.tsx
```

**2. المميزات:**
- 📊 عرض نتائج `/api/financial/system-health`
- 🔴🟡🟢 مؤشرات ملونة للحالة
- 📈 رسوم بيانية للمشاكل
- 🔧 زر لتشغيل `/recalculate-balances`
- 🔄 تحديث تلقائي كل 30 ثانية

**3. التصميم:**
```tsx
<SystemHealthDashboard>
  <StatusOverview />      {/* healthy/warning/unhealthy */}
  <ChecksGrid />          {/* 6 فحوصات */}
  <IssuesList />          {/* قائمة المشاكل */}
  <RecommendationsList /> {/* التوصيات */}
  <ActionButtons />       {/* Recalculate, Refresh */}
</SystemHealthDashboard>
```

---

## 📅 الجدول الزمني المقترح

### **الأسبوع 1: الإصلاحات الحرجة**
- ✅ اليوم 1-2: إصلاح UUID
- ✅ اليوم 3: تحسين نظام الفترات المحاسبية
- ⏳ اليوم 4-5: خدمة أسعار الصرف

### **الأسبوع 2: التحسينات**
- ⏳ اليوم 1-2: جدول المدفوعات + Trigger
- ⏳ اليوم 3-4: System Health Dashboard
- ⏳ اليوم 5: اختبارات شاملة

### **الأسبوع 3: التكامل والصقل**
- ⏳ اليوم 1-2: تقارير متعددة العملات
- ⏳ اليوم 3-4: تحسينات UX
- ⏳ اليوم 5: توثيق + مراجعة نهائية

---

## ✅ معايير النجاح

### بعد إتمام المرحلة الثانية:

1. ✅ **0 أخطاء UUID** في جميع العمليات
2. ✅ **نظام فترات محاسبية كامل** مع إقفال آلي
3. ✅ **دعم 4 عملات** (LYD, USD, EUR, CNY)
4. ✅ **Trigger نشط** لحالة الدفع التلقائية
5. ✅ **Dashboard صحة النظام** بواجهة مرئية
6. ✅ **تقارير مالية متعددة العملات**

---

## 🚀 الخطوة التالية

**ابدأ الآن:**
```bash
# 1. إصلاح UUID في sales.js
# 2. اختبار إنشاء فاتورة
# 3. الانتقال للمهمة التالية
```

---

**تم إعداد هذه الخطة:** 2025-10-02  
**الحالة:** 🟢 جاهزة للتنفيذ


