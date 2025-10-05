# دليل تنظيف ملفات الهجرة (Migrations)

## 📋 نظرة عامة

تحتوي مجلد `src/migrations` على **28 ملف هجرة** تراكمت خلال تطوير النظام.  
بعد إنشاء سكريبتات SQL المباشرة (`create-all-tables.js` وغيرها)، أصبحت معظم هذه الملفات **غير ضرورية**.

---

## 🔍 خطوات التحليل

### 1. تشغيل سكريبت التحليل

```bash
cd server
node analyze-migrations.js
```

هذا السكريبت سيقوم بـ:
- ✅ قراءة جميع ملفات الهجرة
- ✅ مقارنتها مع قاعدة البيانات الحالية
- ✅ تصنيفها إلى فئات (قديمة، مكررة، آمنة للحذف، يجب الاحتفاظ بها)
- ✅ إنشاء سكريبتات حذف تلقائية

### 2. فحص النتائج

السكريبت سيعرض:

#### ❌ ملفات قديمة (Obsolete)
ملفات تم استبدالها بسكريبتات SQL مباشرة:
- `001-initial-schema.js`
- `001-updated-complete-schema.js`
- `002-additional-tables.js`
- `018-create-new-tables-only.js`

#### ⚠️ ملفات مكررة (Duplicates)
ملفات بنفس الوظيفة:
- `002-add-performance-indexes.js`
- `008-add-performance-indexes.js`

#### 🟡 ملفات قد تكون آمنة للحذف
ملفات إضافة أعمدة (تم تطبيقها):
- `002-add-missing-columns.js`
- `003-add-user-columns.js`
- `004-add-account-columns.js`
- `009-add-customer-missing-fields.js`
- إلخ...

#### ✅ ملفات يجب الاحتفاظ بها
الملفات الحديثة أو المهمة:
- `20250115000001-create-invoice-payment.js`
- `20250115000002-create-invoice-receipt.js`
- `20250115000003-create-account-provision.js`
- إلخ...

---

## 🗑️ خطوات الحذف

### الطريقة 1: حذف تلقائي (Windows)

```powershell
# سيتم إنشاء هذا السكريبت تلقائياً
.\delete-old-migrations.ps1
```

### الطريقة 2: حذف تلقائي (Linux/Mac)

```bash
# سيتم إنشاء هذا السكريبت تلقائياً
chmod +x delete-old-migrations.sh
./delete-old-migrations.sh
```

### الطريقة 3: حذف يدوي

```bash
cd src/migrations

# حذف الملفات القديمة
rm 001-initial-schema.js
rm 001-updated-complete-schema.js
rm 002-additional-tables.js
rm 002-add-performance-indexes.js
rm 002-create-notifications.js
rm 008-add-performance-indexes.js
rm 018-create-new-tables-only.js

# حذف ملفات إضافة الأعمدة (إذا تم تطبيقها)
rm 002-add-missing-columns.js
rm 003-add-user-columns.js
rm 004-add-account-columns.js
rm 005-add-account-balance-columns.js
rm 006-add-account-description.js
rm 009-add-customer-missing-fields.js
rm 010-add-employee-missing-fields.js
rm 015-add-category-to-fixed-assets.js
rm 016-add-outstanding-amount-to-sales-invoices.js
rm 019-add-sales-tax-account-to-account-mappings.js

# حذف الملف SQL
rm add-fixed-asset-accounts.sql
```

---

## ⚠️ ملاحظات مهمة

### 1. النسخ الاحتياطي
**قبل الحذف**، قم بعمل نسخة احتياطية:

```bash
# نسخ مجلد migrations
cp -r src/migrations src/migrations_backup_$(date +%Y%m%d)

# أو على Windows
xcopy src\migrations src\migrations_backup /E /I
```

### 2. جدول SequelizeMeta
بعد الحذف، قد تحتاج لتنظيف جدول `SequelizeMeta`:

```sql
-- عرض السجلات
SELECT * FROM "SequelizeMeta";

-- حذف السجلات القديمة (اختياري)
DELETE FROM "SequelizeMeta" 
WHERE name LIKE '001-%' 
   OR name LIKE '002-%' 
   OR name LIKE '003-%';
```

### 3. استراتيجية جديدة
بعد التنظيف، استخدم:
- ✅ `create-all-tables.js` - للإعداد الأولي
- ✅ `add-missing-tables.js` - لإضافة جداول جديدة
- ✅ سكريبتات migrations فقط للتحديثات الجديدة

---

## 📊 التوقعات

### قبل التنظيف:
- 📁 28 ملف هجرة
- ⚠️ تعقيد في الصيانة
- 🐌 بطء في الاختبار

### بعد التنظيف:
- 📁 ~10-12 ملف هجرة
- ✅ سهولة في الصيانة
- ⚡ سرعة في الاختبار

---

## ✅ قائمة التحقق

- [ ] تشغيل `node analyze-migrations.js`
- [ ] فحص النتائج والتأكد
- [ ] عمل نسخة احتياطية من مجلد migrations
- [ ] تشغيل سكريبت الحذف
- [ ] التحقق من أن النظام يعمل
- [ ] تنظيف جدول SequelizeMeta (اختياري)

---

## 🎯 التوصية النهائية

**يمكنك حذف 15-20 ملف بأمان**، مع الاحتفاظ بـ:
1. الملفات التي تبدأ بـ `20250115` (حديثة)
2. ملفات إنشاء جداول مهمة
3. ملفات تحسينات الأداء الحديثة

---

*آخر تحديث: 2025-10-05*
