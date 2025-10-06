# خطة عمل لمزامنة قاعدة البيانات مع النماذج

**تاريخ الإنشاء:** 5 أكتوبر 2025  
**الحالة:** جاهز للتنفيذ

---

## 📊 ملخص تنفيذي

تم إجراء فحص شامل للتوافق بين ملفات النماذج (Models) وقاعدة البيانات PostgreSQL. النتائج كالتالي:

### الإحصائيات الرئيسية
- **إجمالي النماذج:** 38
- **إجمالي الجداول:** 33
- **الجداول المتطابقة:** 29
- **الجداول المفقودة:** 9
- **الجداول الإضافية:** 4

### المشاكل المكتشفة
- **🔴 حرجة:** 9 مشاكل (جداول مفقودة تماماً)
- **🟠 عالية:** 83 مشكلة (حقول مفقودة في قاعدة البيانات)
- **🟡 متوسطة:** 89 مشكلة (حقول مفقودة في النماذج - timestamps)

---

## 🔴 المشاكل الحرجة (أولوية عالية جداً)

### 1. الجداول المفقودة تماماً من قاعدة البيانات

هذه الجداول موجودة في النماذج ولكن غير موجودة في قاعدة البيانات:

1. **`accounting_periods`** - فترات محاسبية
2. **`audit_logs`** - سجلات التدقيق
3. **`company_logo`** - شعار الشركة
4. **`purchase_invoice_payments`** - دفعات فواتير الشراء
5. **`sales_invoice_items`** - بنود فواتير المبيعات
6. **`sales_invoice_payments`** - دفعات فواتير المبيعات
7. **`sales_returns`** - مرتجعات المبيعات
8. **`stock_movements`** - حركات المخزون
9. **`warehouse_release_orders`** - أوامر الإفراج من المخزن

**التأثير:** هذه الجداول ضرورية لعمل النظام بشكل صحيح. عدم وجودها سيؤدي إلى أخطاء في التطبيق.

**الحل:** إنشاء ملفات هجرة (migrations) لإنشاء هذه الجداول.

---

## 🟠 المشاكل العالية (أولوية عالية)

### 2. حقول مفقودة من قاعدة البيانات

هذه الحقول موجودة في النماذج ولكن مفقودة من الجداول في قاعدة البيانات:

#### **جدول `account_mappings`** (10 حقول مفقودة)
- `localCustomersAccount`
- `foreignCustomersAccount`
- `discountAccount`
- `shippingRevenueAccount`
- `handlingFeeAccount`
- `customsClearanceAccount`
- `insuranceAccount`
- `storageAccount`
- `createdBy`
- `updatedBy`

#### **جدول `customers`** (5 حقول مفقودة)
- `accountId`
- `customerType`
- `nationality`
- `passportNumber`
- `residencyStatus`

#### **جدول `employees`** (9 حقول مفقودة)
- `code`
- `terminationDate`
- `accountId`
- `bankAccount`
- `bankName`
- `taxNumber`
- `emergencyContact`
- `emergencyPhone`
- `notes`

#### **جدول `gl_entries`** (14 حقل مفقود)
- `postingDate`, `accountId`, `debit`, `credit`
- `voucherType`, `voucherNo`, `journalEntryId`
- `remarks`, `isCancelled`, `cancelledAt`, `cancelledBy`
- `createdBy`, `currency`, `exchangeRate`

#### **جدول `sales_invoices`** (17 حقل مفقود)
- `subtotal`, `discountAmount`, `taxAmount`, `total`
- `currency`, `exchangeRate`, `paymentStatus`, `paymentMethod`
- `invoiceDate`, `postedStatus`, `postedAt`, `postedBy`
- `documentNo`, `fiscalYear`, `canEdit`, `voidReason`, `createdBy`

#### **جدول `receipts`** (11 حقل مفقود)
- `receiptNo`, `receiptDate`, `referenceNo`
- `bankAccount`, `checkNumber`, `currency`, `exchangeRate`
- `remarks`, `createdBy`, `completedAt`, `completedBy`

#### **جدول `suppliers`** (6 حقول مفقودة)
- `city`, `country`, `paymentTerms`
- `currency`, `notes`, `createdBy`

#### **جدول `shipping_invoices`** (6 حقول مفقودة)
- `invoiceNumber`, `customerId`, `totalAmount`
- `isActive`, `shipmentId`, `outstandingAmount`

**التأثير:** هذه الحقول ضرورية لوظائف معينة في النظام. عدم وجودها قد يسبب أخطاء عند محاولة حفظ أو قراءة البيانات.

**الحل:** إنشاء ملفات هجرة لإضافة هذه الحقول إلى الجداول المعنية.

---

## 🟡 المشاكل المتوسطة (أولوية متوسطة)

### 3. حقول `createdAt` و `updatedAt` مفقودة من النماذج

معظم النماذج تفتقد إلى تعريف حقول `createdAt` و `updatedAt` رغم أنها موجودة في قاعدة البيانات.

**السبب:** Sequelize يضيف هذه الحقول تلقائياً عند تفعيل `timestamps: true`.

**التأثير:** منخفض - النظام يعمل بشكل صحيح لأن Sequelize يتعامل معها تلقائياً.

**الحل:** 
- **الخيار 1:** إضافة تعريف صريح لهذه الحقول في النماذج (موصى به للوضوح)
- **الخيار 2:** ترك الأمر كما هو (Sequelize يتعامل معها تلقائياً)

### 4. الجداول الإضافية في قاعدة البيانات

هذه الجداول موجودة في قاعدة البيانات ولكن لا يوجد لها نماذج:

1. **`invoice_items`** - بنود الفواتير
2. **`gl_entry_details`** - تفاصيل القيود
3. **`vouchers`** - السندات
4. **`migrations_log`** - سجل الهجرات

**التحليل:**
- `migrations_log` - جدول نظامي، لا يحتاج نموذج
- `invoice_items`, `gl_entry_details`, `vouchers` - قد تكون جداول قديمة أو بديلة

**الحل:** مراجعة هذه الجداول وتحديد ما إذا كانت:
- تحتاج إلى نماذج جديدة
- يجب دمجها مع جداول أخرى
- يمكن حذفها (بعد التأكد من عدم استخدامها)

### 5. تعارضات في أسماء الحقول

#### **جدول `shipping_invoices`**
- النموذج يستخدم: `invoiceNumber`, `customerId`, `totalAmount` (camelCase)
- قاعدة البيانات تستخدم: `invoice_number`, `customer_id`, `total_amount` (snake_case)

**الحل:** توحيد نمط التسمية (يفضل snake_case لـ PostgreSQL)

#### **جدول `purchase_invoices`**
- النموذج يستخدم: `outstandingAmount` (camelCase)
- قاعدة البيانات تستخدم: `outstandingamount` (lowercase)

**الحل:** تصحيح اسم العمود في قاعدة البيانات

---

## 📋 خطة العمل المقترحة

### المرحلة 1: إصلاح المشاكل الحرجة (أولوية عالية جداً)

#### الخطوة 1.1: إنشاء الجداول المفقودة

```bash
# إنشاء ملفات الهجرة للجداول المفقودة
node scripts/create-migration.js create-accounting-periods
node scripts/create-migration.js create-audit-logs
node scripts/create-migration.js create-company-logo
node scripts/create-migration.js create-purchase-invoice-payments
node scripts/create-migration.js create-sales-invoice-items
node scripts/create-migration.js create-sales-invoice-payments
node scripts/create-migration.js create-sales-returns
node scripts/create-migration.js create-stock-movements
node scripts/create-migration.js create-warehouse-release-orders
```

**الوقت المقدر:** 4-6 ساعات

---

### المرحلة 2: إصلاح المشاكل العالية (أولوية عالية)

#### الخطوة 2.1: إضافة الحقول المفقودة إلى الجداول الموجودة

إنشاء ملف هجرة واحد شامل لإضافة جميع الحقول المفقودة:

```bash
node scripts/create-migration.js add-missing-fields-to-existing-tables
```

**الجداول المتأثرة:**
- `account_mappings` (10 حقول)
- `customers` (5 حقول)
- `employees` (9 حقول)
- `gl_entries` (14 حقل)
- `sales_invoices` (17 حقل)
- `receipts` (11 حقل)
- `suppliers` (6 حقول)
- `shipping_invoices` (6 حقول)
- `fixed_assets` (1 حقل)
- `invoices` (3 حقول)
- `purchase_invoices` (1 حقل)

**الوقت المقدر:** 3-4 ساعات

---

### المرحلة 3: إصلاح المشاكل المتوسطة (أولوية متوسطة)

#### الخطوة 3.1: تحديث النماذج لإضافة timestamps

تحديث جميع النماذج لإضافة تعريف صريح لـ `createdAt` و `updatedAt`:

```javascript
createdAt: {
  type: DataTypes.DATE,
  allowNull: false,
  defaultValue: DataTypes.NOW
},
updatedAt: {
  type: DataTypes.DATE,
  allowNull: false,
  defaultValue: DataTypes.NOW
}
```

**الوقت المقدر:** 2-3 ساعات

#### الخطوة 3.2: حل تعارضات أسماء الحقول

1. **`shipping_invoices`**: إنشاء هجرة لإعادة تسمية الأعمدة
2. **`purchase_invoices`**: تصحيح `outstandingamount` إلى `outstanding_amount`
3. **`gl_entries`**: مراجعة البنية الكاملة للجدول

**الوقت المقدر:** 2-3 ساعات

#### الخطوة 3.3: مراجعة الجداول الإضافية

- فحص استخدام `invoice_items`, `gl_entry_details`, `vouchers`
- تحديد ما إذا كانت تحتاج نماذج أو يمكن حذفها
- توثيق القرار

**الوقت المقدر:** 1-2 ساعة

---

## 🛠️ الأدوات والسكريبتات المطلوبة

### 1. سكريبت إنشاء الجداول المفقودة

```bash
# سيتم إنشاء ملف migration شامل
node scripts/create-missing-tables-migration.js
```

### 2. سكريبت إضافة الحقول المفقودة

```bash
# سيتم إنشاء ملف migration لإضافة جميع الحقول المفقودة
node scripts/create-missing-fields-migration.js
```

### 3. سكريبت التحقق من المزامنة

```bash
# تشغيل الفحص مرة أخرى بعد التطبيق
node comprehensive-database-check.js
```

---

## ⚠️ تحذيرات وملاحظات مهمة

### قبل تنفيذ أي هجرة:

1. **عمل نسخة احتياطية كاملة من قاعدة البيانات**
   ```bash
   pg_dump -U postgres -d golden_horse > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **اختبار الهجرات على بيئة تطوير أولاً**
   - لا تطبق الهجرات مباشرة على الإنتاج
   - اختبر كل هجرة على حدة

3. **مراجعة البيانات الموجودة**
   - بعض الحقول الجديدة قد تحتاج قيم افتراضية
   - تأكد من أن الحقول `NOT NULL` لها قيم افتراضية مناسبة

4. **التنسيق مع الفريق**
   - أبلغ الفريق قبل تطبيق الهجرات
   - خطط لوقت توقف (downtime) إذا لزم الأمر

---

## 📈 مؤشرات النجاح

بعد تنفيذ جميع الإصلاحات، يجب أن تكون النتائج:

- ✅ **0 جداول مفقودة**
- ✅ **0 مشاكل حرجة**
- ✅ **أقل من 10 مشاكل عالية** (فقط timestamps)
- ✅ **جميع الوظائف تعمل بدون أخطاء**

---

## 📞 الخطوات التالية

1. **مراجعة هذه الخطة** مع الفريق
2. **الموافقة على الخطة** وتحديد موعد التنفيذ
3. **إنشاء ملفات الهجرة** المطلوبة
4. **اختبار الهجرات** على بيئة التطوير
5. **تطبيق الهجرات** على الإنتاج
6. **التحقق من النتائج** باستخدام سكريبت الفحص

---

## 📝 ملاحظات إضافية

### الأولويات الموصى بها:

1. **فوري (خلال 24 ساعة):**
   - إنشاء الجداول المفقودة الحرجة: `accounting_periods`, `audit_logs`
   - إضافة الحقول المفقودة في `sales_invoices` و `gl_entries`

2. **عاجل (خلال أسبوع):**
   - إنشاء باقي الجداول المفقودة
   - إضافة الحقول المفقودة في باقي الجداول

3. **مهم (خلال أسبوعين):**
   - تحديث النماذج لإضافة timestamps
   - حل تعارضات أسماء الحقول

4. **اختياري (عند الحاجة):**
   - مراجعة الجداول الإضافية
   - تحسين وتوثيق البنية

---

**تم إنشاء هذا التقرير بواسطة:** سكريبت الفحص الشامل `comprehensive-database-check.js`  
**التقرير التفصيلي:** `DATABASE_COMPATIBILITY_REPORT.md`  
**التقرير JSON:** `DATABASE_COMPATIBILITY_REPORT.json`
