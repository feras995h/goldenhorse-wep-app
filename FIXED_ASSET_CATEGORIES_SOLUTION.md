# إصلاح مشكلة اختيار الفئة في الأصول الثابتة

## المشكلة
عند إضافة أصل ثابت في النسخة المرفوعة على السحابة، يواجه المستخدم مشكلة في اختيار الفئة - لا تظهر الفئات في القائمة المنسدلة.

## السبب
المشكلة تكمن في أن حسابات الفئات للأصول الثابتة غير موجودة في قاعدة البيانات، أو أن API الخاص بجلب الفئات لا يعمل بشكل صحيح.

## الحلول

### الحل الأول: إصلاح قاعدة البيانات مباشرة

1. **اتصل بقاعدة البيانات**:
   ```sql
   -- استخدم هذا السكريبت SQL لإصلاح المشكلة
   -- قم بتشغيل محتوى ملف fix-fixed-asset-categories.sql
   ```

2. **تحقق من النتيجة**:
   ```sql
   SELECT code, name, "nameEn" FROM accounts 
   WHERE "parentId" = (SELECT id FROM accounts WHERE code = '1.2' AND type = 'asset' LIMIT 1)
   AND type = 'asset' AND "isActive" = true
   ORDER BY code;
   ```

### الحل الثاني: إصلاح من خلال API

1. **تأكد من أن الخادم يعمل**:
   ```bash
   # تحقق من حالة الخادم
   curl -X GET https://your-production-url.com/api/health
   ```

2. **اختبر API الخاص بالفئات**:
   ```bash
   # احصل على token أولاً
   curl -X POST https://your-production-url.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "123456"}'
   
   # ثم اختبر الفئات
   curl -X GET https://your-production-url.com/api/financial/fixed-assets/categories \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### الحل الثالث: إصلاح من خلال الكود

1. **تحديث الواجهة الأمامية**:
   - تم تحديث `FixedAssetForm.tsx` لاستخدام `categoryAccountId` بدلاً من `category`
   - تم إضافة معالجة أفضل للأخطاء عند عدم وجود فئات

2. **تحديث صفحة الإدارة**:
   - تم إضافة رسائل خطأ واضحة
   - تم تحسين تحميل الفئات

## التحقق من الإصلاح

### 1. تحقق من قاعدة البيانات
```sql
-- تأكد من وجود الحساب الرئيسي للأصول
SELECT * FROM accounts WHERE code = '1' AND type = 'asset';

-- تأكد من وجود مجموعة الأصول الثابتة
SELECT * FROM accounts WHERE code = '1.2' AND type = 'asset';

-- تأكد من وجود الفئات
SELECT code, name, "nameEn" FROM accounts 
WHERE "parentId" = (SELECT id FROM accounts WHERE code = '1.2' AND type = 'asset' LIMIT 1)
AND type = 'asset' AND "isActive" = true
ORDER BY code;
```

### 2. تحقق من API
```bash
# اختبر endpoint الفئات
curl -X GET https://your-production-url.com/api/financial/fixed-assets/categories \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. تحقق من الواجهة الأمامية
1. افتح صفحة إدارة الأصول الثابتة
2. اضغط على "أصل جديد"
3. تأكد من ظهور الفئات في القائمة المنسدلة

## الفئات المتوقعة
بعد الإصلاح، يجب أن تظهر الفئات التالية:
- 1.2.1 - سيارات
- 1.2.2 - معدات وآلات  
- 1.2.3 - أثاث
- 1.2.4 - مباني
- 1.2.5 - أجهزة حاسوب

## استكشاف الأخطاء

### إذا لم تظهر الفئات بعد الإصلاح:

1. **تحقق من console المتصفح**:
   - افتح Developer Tools (F12)
   - اذهب إلى Console
   - ابحث عن رسائل خطأ متعلقة بـ API

2. **تحقق من Network tab**:
   - اذهب إلى Network tab في Developer Tools
   - حاول إضافة أصل جديد
   - ابحث عن طلب `/api/financial/fixed-assets/categories`
   - تحقق من الاستجابة

3. **تحقق من الخادم**:
   ```bash
   # تحقق من logs الخادم
   docker logs your-container-name
   ```

## ملاحظات إضافية

- تأكد من أن المستخدم لديه صلاحيات الوصول إلى الوحدة المالية
- تأكد من أن قاعدة البيانات متصلة بشكل صحيح
- تأكد من أن جميع الجداول المطلوبة موجودة

## الدعم

إذا استمرت المشكلة بعد تطبيق هذه الحلول، يرجى:
1. جمع logs من الخادم
2. جمع screenshots من console المتصفح
3. توفير تفاصيل قاعدة البيانات (بدون كلمات مرور)
