# 🚀 دليل البدء السريع - قاعدة البيانات

## ✅ ما تم إنجازه

1. ✅ **حذف** `accountingInitializer.js` (السكريبت التلقائي للحسابات)
2. ✅ **إنشاء** `clean-database.js` (تنظيف قاعدة البيانات)
3. ✅ **إنشاء** `create-all-tables.js` (إنشاء جميع الجداول دفعة واحدة)
4. ✅ **توثيق** كامل في `DATABASE_SETUP.md`

---

## 🎯 الاستخدام السريع

### إعداد قاعدة بيانات جديدة من الصفر:

```bash
# 1. الانتقال لمجلد السيرفر
cd server

# 2. تنظيف قاعدة البيانات (اختياري)
node clean-database.js

# 3. إنشاء جميع الجداول
node create-all-tables.js

# 4. تشغيل السيرفر
npm start
```

---

## 📋 الملفات الجديدة

| الملف | الوظيفة |
|------|---------|
| `server/clean-database.js` | حذف جميع الجداول |
| `server/create-all-tables.js` | إنشاء 22 جدول + 13 index |
| `server/DATABASE_SETUP.md` | دليل الاستخدام الكامل |
| `DATABASE_MIGRATION_SUMMARY.md` | ملخص التغييرات |

---

## ⚠️ تحذير مهم

**السكريبت `clean-database.js` سيحذف جميع البيانات!**

دائماً قم بعمل نسخة احتياطية أولاً:
```bash
pg_dump -U username -d database > backup.sql
```

---

## 🎉 النتيجة

- ✅ 22 جدول جاهز
- ✅ 13 index للأداء
- ✅ Foreign Keys محمية
- ✅ UUID Extension مفعل

**النظام جاهز للاستخدام! 🚀** - Golden Horse
## تنفيذ الإصلاحات الحرجة

**التاريخ**: 2025-10-01  
**المدة المتوقعة**: 30-60 دقيقة  
**الحالة**: جاهز للتنفيذ ✅

---

## ✅ ما تم إنجازه

تم تنفيذ الإصلاحات التالية على الكود:

1. ✅ **إنشاء نظام تهيئة تلقائي** (`server/src/utils/accountingInitializer.js`)
   - يعمل عند بدء تشغيل السيرفر
   - ينشئ دليل الحسابات الأساسي تلقائياً
   - ينشئ AccountMapping تلقائياً

2. ✅ **تعديل server.js**
   - إضافة استدعاء نظام التهيئة عند بدء التشغيل
   - التحقق من صحة النظام المحاسبي

3. ✅ **إصلاح معالجة الأخطاء في sales.js**
   - إزالة try-catch الذي يتجاهل أخطاء القيود المحاسبية
   - الآن إذا فشل القيد المحاسبي، تفشل الفاتورة بالكامل (Rollback)

4. ✅ **إضافة إنشاء حسابات تلقائي للعملاء**
   - تعديل نموذج Customer
   - عند إنشاء عميل جديد، يتم إنشاء حساب له تلقائياً في دليل الحسابات

---

## 🎯 الخطوات المطلوبة الآن

### الخطوة 1: تشغيل SQL على قاعدة البيانات السحابية ⚡

**مهم جداً**: يجب تنفيذ هذه الخطوة أولاً!

1. **افتح أداة إدارة قاعدة البيانات** (pgAdmin أو DBeaver أو أي أداة PostgreSQL)

2. **اتصل بقاعدة البيانات السحابية**:
   ```
   Host: 72.60.92.146
   Port: 5432
   Database: postgres
   Username: postgres
   Password: XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP
   ```

3. **افتح ملف `database_setup.sql`** ونفذه بالكامل

4. **تحقق من النتيجة**:
   ```sql
   -- يجب أن ترى AccountMapping نشط
   SELECT * FROM account_mappings WHERE "isActive" = true;
   
   -- يجب أن ترى الحسابات الأساسية
   SELECT code, name FROM accounts WHERE code IN ('4101', '1201', '2301', '4102');
   ```

---

### الخطوة 2: إعادة تشغيل السيرفر 🔄

```bash
# في terminal
cd server
npm run dev
```

**ما سيحدث**:
```
🚀 Starting Golden Horse Shipping Server...
✅ Database initialized
🔧 بدء تهيئة النظام المحاسبي...
📊 التحقق من دليل الحسابات...
   ✅ تم إنشاء: 4101 - إيرادات خدمات الشحن البحري
   ✅ تم إنشاء: 1201 - ذمم العملاء
   ... (أو: الحسابات موجودة بالفعل)
🔗 التحقق من Account Mapping...
✅ Account Mapping موجود ونشط
✅ النظام المحاسبي جاهز للعمل
   - عدد الحسابات: 25
   - AccountMapping: نشط
```

---

### الخطوة 3: اختبار النظام 🧪

#### أ. فحص صحة النظام عبر API

```bash
# في terminal آخر أو Postman
curl http://localhost:5001/api/financial/system-health
```

**النتيجة المتوقعة**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "healthy": true,
    "checks": {
      "accountMapping": {
        "exists": true,
        "isActive": true
      },
      "chartOfAccounts": {
        "totalAccounts": 25,
        "activeAccounts": 25
      },
      "accountingEntries": {
        "glEntries": 0,
        "journalEntries": 0
      }
    },
    "issues": [],
    "recommendations": []
  }
}
```

#### ب. اختبار إنشاء فاتورة مبيعات

```bash
# تسجيل الدخول أولاً
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_password"
  }'

# احفظ الـ token من الرد

# إنشاء فاتورة مبيعات
curl -X POST http://localhost:5001/api/sales/sales-invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "customerId": "CUSTOMER_ID_HERE",
    "date": "2025-10-01",
    "dueDate": "2025-10-31",
    "discountPercent": 0,
    "taxPercent": 0,
    "items": [
      {
        "description": "شحن بحري من الصين",
        "quantity": 1,
        "unitPrice": 1000,
        "unit": "حاوية"
      }
    ]
  }'
```

**النتيجة المتوقعة**:
- ✅ الفاتورة تُنشأ بنجاح
- ✅ يظهر في console: "تم إنشاء القيد المحاسبي تلقائياً للفاتورة"
- ✅ القيد المحاسبي يُنشأ في `journal_entries` و `gl_entries`

#### ج. التحقق من القيود المحاسبية

```sql
-- في قاعدة البيانات
SELECT 
  je.id,
  je."entryNumber",
  je.date,
  je.description,
  je."totalDebit",
  je."totalCredit",
  je.status
FROM journal_entries je
ORDER BY je."createdAt" DESC
LIMIT 5;

-- تفاصيل القيد
SELECT 
  jed.id,
  a.code,
  a.name,
  jed.debit,
  jed.credit,
  jed.description
FROM journal_entry_details jed
JOIN accounts a ON jed."accountId" = a.id
WHERE jed."journalEntryId" = 'JOURNAL_ENTRY_ID_HERE';
```

---

## 🐛 استكشاف الأخطاء

### المشكلة 1: "No active account mapping configured"

**السبب**: لم يتم تشغيل SQL script على قاعدة البيانات

**الحل**:
1. تأكد من تشغيل `database_setup.sql` بالكامل
2. تحقق من وجود AccountMapping:
   ```sql
   SELECT * FROM account_mappings WHERE "isActive" = true;
   ```

### المشكلة 2: "Missing required accounts"

**السبب**: الحسابات الأساسية غير موجودة

**الحل**:
1. تشغيل الجزء الثاني من `database_setup.sql` (إنشاء الحسابات)
2. إعادة تشغيل السيرفر

### المشكلة 3: الفاتورة تُنشأ لكن بدون قيد محاسبي

**السبب**: هذه المشكلة تم إصلاحها! إذا حدثت:
1. تأكد من تعديل `sales.js` بشكل صحيح
2. تأكد من عدم وجود try-catch حول `createJournalEntryAndAffectBalance`

---

## 📊 مؤشرات النجاح

بعد إكمال جميع الخطوات، يجب أن ترى:

- ✅ السيرفر يبدأ بدون أخطاء
- ✅ رسالة "النظام المحاسبي جاهز للعمل"
- ✅ `/api/financial/system-health` يعيد `"healthy": true`
- ✅ إنشاء فاتورة جديدة يُنشئ قيد محاسبي تلقائياً
- ✅ ميزان المراجعة يعرض البيانات بشكل صحيح

---

## 📝 الملفات المعدلة

تم تعديل/إنشاء الملفات التالية:

### ملفات جديدة:
1. ✅ `server/src/utils/accountingInitializer.js` - نظام التهيئة التلقائي
2. ✅ `database_setup.sql` - سكريبت قاعدة البيانات
3. ✅ `QUICK_START.md` - هذا الملف
4. ✅ `ACCOUNTING_ENGINE_AUDIT.md` - تقرير الفحص الشامل
5. ✅ `IMPLEMENTATION_ROADMAP.md` - خطة العمل الكاملة

### ملفات معدلة:
1. ✅ `server/src/server.js` - إضافة استدعاء التهيئة
2. ✅ `server/src/routes/sales.js` - إصلاح معالجة الأخطاء (3 مواقع)
3. ✅ `server/src/models/Customer.js` - إضافة إنشاء حسابات تلقائي

---

## 🎯 الخطوات التالية

بعد إكمال هذه الإصلاحات الحرجة، يمكنك:

1. **الأسبوع القادم**: تنفيذ باقي المرحلة الأولى
   - إضافة Database Triggers
   - إضافة endpoints فحص صحة النظام المتقدمة
   - تعديل نموذج Supplier

2. **الأسابيع 3-5**: المرحلة الثانية - المحرك المحاسبي المتقدم
   - نظام الفترات المحاسبية
   - دعم العملات المتعددة
   - نظام الأصول الثابتة

3. **الأسابيع 6-8**: المرحلة الثالثة - نظام الشحن الدولي
   - تتبع الشحنات من الصين إلى ليبيا
   - نظام التخليص الجمركي
   - إدارة المخازن

راجع `IMPLEMENTATION_ROADMAP.md` للخطة الكاملة.

---

## 💬 الدعم

إذا واجهت أي مشاكل:

1. **تحقق من console logs** في السيرفر
2. **راجع ملف** `ACCOUNTING_ENGINE_AUDIT.md` للتفاصيل التقنية
3. **تحقق من قاعدة البيانات** باستخدام الاستعلامات في `database_setup.sql`

---

## ✅ Checklist

قبل الانتقال للمرحلة التالية، تأكد من:

- [ ] تم تشغيل `database_setup.sql` بنجاح
- [ ] السيرفر يبدأ بدون أخطاء
- [ ] `/api/financial/system-health` يعيد `healthy: true`
- [ ] تم اختبار إنشاء فاتورة مبيعات
- [ ] القيد المحاسبي يُنشأ تلقائياً مع الفاتورة
- [ ] ميزان المراجعة يعرض البيانات

---

**تم إعداد هذا الدليل بواسطة**: Cascade AI  
**التاريخ**: 2025-10-01  
**الحالة**: جاهز للتنفيذ ✅

**ابدأ الآن!** 🚀
