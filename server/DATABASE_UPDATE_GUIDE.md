# دليل تحديث قاعدة البيانات
## Golden Horse Shipping System

---

## 📋 نظرة عامة على المراجعة

تمت مراجعة شاملة لقاعدة البيانات والـ Models، وتم اكتشاف:

### ✅ الإصلاحات المطبقة:
1. ✅ User Model - تغيير `lastLoginAt` إلى `lastLogin`
2. ✅ User Model - حذف `passwordChangedAt`
3. ✅ SalesInvoice Model - تغيير `underscored` إلى `false`
4. ✅ Receipt/Payment Vouchers - إزالة `isActive` من الاستعلامات

### ❌ الجداول المفقودة (14 جدول):
1. employees
2. employee_advances
3. payroll_entries
4. purchase_invoices
5. purchase_invoice_payments
6. sales_returns
7. receipts
8. payments
9. gl_entries
10. settings
11. roles
12. audit_logs
13. accounting_periods
14. company_logo

---

## 🚀 السكريبتات المتاحة

### 1. السكريبت الأساسي (موجود)
```bash
# ينشئ 22 جدول أساسي
node create-all-tables.js
```

### 2. إضافة الجداول المفقودة
```bash
# يضيف 14 جدول جديد
node add-missing-tables.js
```

### 3. تحديث sales_invoices
```bash
# يضيف أعمدة salesPerson, discountPercent, taxPercent
node update-sales-invoices.js
```

### 4. التنظيف الكامل
```bash
# يحذف جميع الجداول
node clean-database.js
```

### 5. إنشاء مستخدم admin
```bash
# ينشئ مستخدم admin
node create-admin-user.js
```

---

## 📊 السيناريوهات المختلفة

### السيناريو 1: إعداد قاعدة بيانات جديدة
```bash
# 1. تنظيف (إذا كانت موجودة)
node clean-database.js

# 2. إنشاء الجداول الأساسية
node create-all-tables.js

# 3. إضافة الجداول المفقودة
node add-missing-tables.js

# 4. تحديث sales_invoices
node update-sales-invoices.js

# 5. إنشاء مستخدم admin
node create-admin-user.js

# 6. تشغيل السيرفر
npm start
```

### السيناريو 2: تحديث قاعدة بيانات موجودة
```bash
# 1. إضافة الجداول المفقودة فقط
node add-missing-tables.js

# 2. تحديث sales_invoices
node update-sales-invoices.js

# 3. تشغيل السيرفر
npm start
```

### السيناريو 3: إعادة البناء الكامل
```bash
# 1. نسخة احتياطية
pg_dump -U username -d database > backup.sql

# 2. تنظيف كامل
node clean-database.js

# 3. البناء من الصفر
node create-all-tables.js
node add-missing-tables.js
node update-sales-invoices.js
node create-admin-user.js

# 4. تشغيل السيرفر
npm start
```

---

## 📋 قائمة الجداول الكاملة (36 جدول)

### الجداول الأساسية (22 جدول) - create-all-tables.js
1. ✅ users
2. ✅ customers
3. ✅ suppliers
4. ✅ accounts
5. ✅ account_mappings
6. ✅ sales_invoices
7. ✅ sales_invoice_items
8. ✅ shipments
9. ✅ shipping_invoices
10. ✅ receipt_vouchers
11. ✅ payment_vouchers
12. ✅ gl_journals
13. ✅ posting_journal_entries
14. ✅ journal_entries
15. ✅ journal_entry_details
16. ✅ notifications
17. ✅ fixed_assets
18. ✅ depreciation_entries
19. ✅ invoice_payments
20. ✅ invoice_receipts
21. ✅ account_provisions
22. ✅ shipment_movements

### الجداول الإضافية (14 جدول) - add-missing-tables.js
23. ✅ employees
24. ✅ employee_advances
25. ✅ payroll_entries
26. ✅ purchase_invoices
27. ✅ purchase_invoice_payments
28. ✅ sales_returns
29. ✅ receipts
30. ✅ payments
31. ✅ gl_entries
32. ✅ settings
33. ✅ roles
34. ✅ audit_logs
35. ✅ accounting_periods
36. ✅ company_logo

---

## ⚙️ الأعمدة المضافة لجداول موجودة

### sales_invoices (update-sales-invoices.js)
- ✅ salesPerson VARCHAR(255)
- ✅ discountPercent DECIMAL(5,2)
- ✅ taxPercent DECIMAL(5,2)

---

## 🔍 التحقق من النتائج

### التحقق من عدد الجداول:
```sql
SELECT COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public';
-- المتوقع: 36 جدول
```

### التحقق من جداول محددة:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

### التحقق من أعمدة sales_invoices:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sales_invoices'
ORDER BY column_name;
```

---

## ⚠️ ملاحظات مهمة

### 1. النسخ الاحتياطي
**دائماً** قم بعمل نسخة احتياطية قبل أي تحديث:
```bash
pg_dump -U username -d database > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. البيئة الإنتاجية
- لا تستخدم `clean-database.js` في Production
- استخدم فقط `add-missing-tables.js` و `update-sales-invoices.js`

### 3. ترتيب التنفيذ
يجب تنفيذ السكريبتات بالترتيب:
1. create-all-tables.js (الأساسي)
2. add-missing-tables.js (الإضافات)
3. update-sales-invoices.js (التحديثات)
4. create-admin-user.js (المستخدم)

### 4. Foreign Keys
جميع Foreign Keys تم إضافتها مع:
- `ON DELETE CASCADE` للعلاقات التابعة
- `REFERENCES` للعلاقات الأساسية

---

## 🐛 استكشاف الأخطاء

### خطأ: "relation already exists"
```bash
# الجدول موجود بالفعل - لا مشكلة
# السكريبتات تستخدم IF NOT EXISTS
```

### خطأ: "column already exists"
```bash
# العمود موجود بالفعل - لا مشكلة
# update-sales-invoices.js يستخدم IF NOT EXISTS
```

### خطأ: "foreign key violation"
```bash
# تأكد من أن الجداول المرجعية موجودة أولاً
# مثال: employees يجب أن يكون موجوداً قبل employee_advances
```

---

## ✅ قائمة التحقق النهائية

- [ ] عمل نسخة احتياطية
- [ ] تشغيل create-all-tables.js
- [ ] تشغيل add-missing-tables.js
- [ ] تشغيل update-sales-invoices.js
- [ ] تشغيل create-admin-user.js
- [ ] التحقق من عدد الجداول (36 جدول)
- [ ] التحقق من مستخدم admin
- [ ] تشغيل السيرفر
- [ ] اختبار تسجيل الدخول

---

## 🎉 النتيجة المتوقعة

بعد تنفيذ جميع السكريبتات:

✅ **36 جدول** جاهز للاستخدام  
✅ **جميع الأعمدة** المطلوبة موجودة  
✅ **Foreign Keys** محمية  
✅ **Indexes** للأداء  
✅ **مستخدم admin** جاهز  

**النظام جاهز 100% للعمل! 🚀**

---

*آخر تحديث: 2025-10-05*
