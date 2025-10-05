# دليل إعداد قاعدة البيانات
## Golden Horse Shipping System

---

## 📋 نظرة عامة

تم إنشاء سكريبتين رئيسيين لإدارة قاعدة البيانات:

1. **`clean-database.js`** - تنظيف قاعدة البيانات بالكامل
2. **`create-all-tables.js`** - إنشاء جميع الجداول دفعة واحدة

---

## 🗑️ تنظيف قاعدة البيانات

### الاستخدام:
```bash
node clean-database.js
```

### ماذا يفعل؟
- ✅ يحذف **جميع** الجداول الموجودة
- ✅ يحذف جدول الترحيلات (SequelizeMeta)
- ✅ ينظف قاعدة البيانات بالكامل
- ✅ يعطيك 5 ثواني للإلغاء (Ctrl+C)

### ⚠️ تحذير:
**هذا السكريبت سيحذف جميع البيانات بشكل نهائي!**

---

## 🏗️ إنشاء جميع الجداول

### الاستخدام:
```bash
node create-all-tables.js
```

### ماذا يفعل؟
ينشئ **22 جدول** رئيسي:

#### 1. الجداول الأساسية:
- ✅ `users` - المستخدمين
- ✅ `customers` - العملاء
- ✅ `suppliers` - الموردين

#### 2. النظام المحاسبي:
- ✅ `accounts` - دليل الحسابات
- ✅ `account_mappings` - ربط الحسابات
- ✅ `gl_journals` - اليوميات العامة
- ✅ `posting_journal_entries` - قيود اليومية
- ✅ `journal_entries` - القيود المحاسبية
- ✅ `journal_entry_details` - تفاصيل القيود
- ✅ `account_provisions` - المخصصات

#### 3. المبيعات والفواتير:
- ✅ `sales_invoices` - فواتير المبيعات
- ✅ `sales_invoice_items` - بنود الفواتير
- ✅ `shipping_invoices` - فواتير الشحن
- ✅ `invoice_payments` - دفعات الفواتير
- ✅ `invoice_receipts` - إيصالات الفواتير

#### 4. السندات المالية:
- ✅ `receipt_vouchers` - سندات القبض
- ✅ `payment_vouchers` - سندات الصرف

#### 5. الشحنات:
- ✅ `shipments` - الشحنات
- ✅ `shipment_movements` - حركات الشحنات

#### 6. الأصول الثابتة:
- ✅ `fixed_assets` - الأصول الثابتة
- ✅ `depreciation_entries` - قيود الإهلاك

#### 7. أخرى:
- ✅ `notifications` - الإشعارات

### المميزات:
- ✅ ينشئ UUID extension تلقائياً
- ✅ ينشئ Foreign Keys بين الجداول
- ✅ ينشئ Indexes للأداء (13 index)
- ✅ يستخدم أسماء الأعمدة الصحيحة (camelCase/snake_case)

---

## 🚀 الاستخدام الكامل (من الصفر)

### الخطوة 1: تنظيف قاعدة البيانات
```bash
cd server
node clean-database.js
```

انتظر 5 ثواني، سيبدأ الحذف تلقائياً.

### الخطوة 2: إنشاء جميع الجداول
```bash
node create-all-tables.js
```

سيتم إنشاء جميع الجداول في أقل من دقيقة.

### الخطوة 3: تشغيل السيرفر
```bash
npm start
```

---

## 📊 بنية الجداول

### الجداول الرئيسية وعلاقاتها:

```
users (1)
  └─ يستخدم في: createdBy في معظم الجداول

customers (UUID)
  ├─ sales_invoices.customerId
  ├─ shipments.customerId
  ├─ shipping_invoices.customer_id
  └─ receipt_vouchers.customerId

suppliers (UUID)
  ├─ shipments.supplierId
  └─ payment_vouchers.supplierId

accounts (UUID)
  ├─ account_mappings (جميع الحسابات)
  ├─ journal_entry_details.accountId
  ├─ posting_journal_entries.account_id
  ├─ receipt_vouchers.accountId
  ├─ payment_vouchers.accountId
  └─ fixed_assets (3 حسابات)

sales_invoices (UUID)
  ├─ sales_invoice_items.invoiceId
  ├─ invoice_payments.invoiceId
  └─ invoice_receipts.invoiceId

shipments (UUID)
  ├─ shipping_invoices.shipment_id
  └─ shipment_movements.shipmentId

journal_entries (UUID)
  ├─ journal_entry_details.journalEntryId
  └─ account_provisions.journalEntryId

gl_journals (UUID)
  └─ posting_journal_entries.journal_id

fixed_assets (UUID)
  └─ depreciation_entries.assetId
```

---

## 🔧 الفروقات المهمة

### تنسيق الأعمدة:

#### camelCase (معظم الجداول الجديدة):
```sql
sales_invoices:
  - customerId (UUID)
  - invoiceNumber (VARCHAR)
  - createdAt (TIMESTAMP)
```

#### snake_case (جداول قديمة):
```sql
shipping_invoices:
  - customer_id (UUID)
  - invoice_number (VARCHAR)
  - created_at (TIMESTAMP)

gl_journals:
  - journal_no (VARCHAR)
  - journal_date (DATE)
  - created_at (TIMESTAMP)
```

---

## ⚙️ الإعدادات المطلوبة

### ملف `.env`:
```env
DB_URL=postgresql://username:password@host:port/database
# أو
DATABASE_URL=postgresql://username:password@host:port/database
```

---

## 🎯 الميزات الإضافية

### 1. UUID Extension
تم تفعيل `uuid-ossp` تلقائياً لإنشاء UUIDs.

### 2. Foreign Keys
جميع العلاقات محمية بـ Foreign Keys مع:
- `ON DELETE CASCADE` للبنود التابعة
- `REFERENCES` للعلاقات الأساسية

### 3. Indexes للأداء
تم إنشاء 13 index على:
- الأعمدة المستخدمة في البحث
- Foreign Keys
- أعمدة التاريخ
- أعمدة الحالة (status)

### 4. Default Values
جميع الجداول تحتوي على:
- `createdAt` و `updatedAt` تلقائياً
- قيم افتراضية مناسبة (isActive = true, balance = 0, etc.)

---

## 🐛 استكشاف الأخطاء

### خطأ: "relation already exists"
```bash
# نظف قاعدة البيانات أولاً
node clean-database.js
# ثم أعد الإنشاء
node create-all-tables.js
```

### خطأ: "database connection failed"
تحقق من:
1. ملف `.env` يحتوي على `DB_URL` أو `DATABASE_URL`
2. قاعدة البيانات PostgreSQL تعمل
3. بيانات الاتصال صحيحة

### خطأ: "permission denied"
تأكد من أن المستخدم لديه صلاحيات:
- CREATE TABLE
- DROP TABLE
- CREATE EXTENSION

---

## 📝 ملاحظات مهمة

### 1. لا حاجة للترحيلات (Migrations)
السكريبت `create-all-tables.js` يستبدل جميع ملفات الترحيلات.

### 2. البيانات الأولية
السكريبت **لا** ينشئ:
- ❌ حسابات دليل الحسابات (تم حذف accountingInitializer.js)
- ❌ مستخدمين افتراضيين
- ❌ بيانات تجريبية

يجب إنشاء هذه البيانات يدوياً أو عبر API.

### 3. النسخ الاحتياطي
**دائماً** قم بعمل نسخة احتياطية قبل تشغيل `clean-database.js`:
```bash
pg_dump -U username -d database > backup.sql
```

---

## ✅ قائمة التحقق

قبل التشغيل في Production:

- [ ] عمل نسخة احتياطية من قاعدة البيانات
- [ ] التأكد من ملف `.env` صحيح
- [ ] اختبار السكريبتات على قاعدة بيانات تجريبية
- [ ] التأكد من صلاحيات المستخدم
- [ ] مراجعة بنية الجداول

---

## 🎉 النتيجة النهائية

بعد تشغيل السكريبتات بنجاح:

✅ **22 جدول** جاهز للاستخدام  
✅ **13 index** للأداء  
✅ **Foreign Keys** محمية  
✅ **UUID Extension** مفعل  
✅ **قاعدة بيانات** نظيفة ومنظمة  

**النظام جاهز للعمل! 🚀**

---

*آخر تحديث: 2025-10-05*
