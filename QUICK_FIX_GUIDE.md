# دليل الإصلاح السريع - مشكلة اختيار الفئة في الأصول الثابتة

## المشكلة
لا تظهر الفئات في القائمة المنسدلة عند إضافة أصل ثابت جديد.

## الحل السريع

### الخطوة 1: تحقق من قاعدة البيانات
قم بتشغيل هذا الاستعلام على قاعدة البيانات المرفوعة:

```sql
-- تحقق من وجود الفئات
SELECT id, code, name, "nameEn", "isActive", "isGroup"
FROM accounts 
WHERE "parentId" = (SELECT id FROM accounts WHERE code = '1.2' AND type = 'asset' LIMIT 1)
AND type = 'asset'
AND "isActive" = true
ORDER BY code;
```

### الخطوة 2: إذا لم توجد فئات، أنشئها
قم بتشغيل محتوى ملف `fix-fixed-asset-categories.sql` على قاعدة البيانات.

### الخطوة 3: تحقق من API
اختبر API الخاص بالفئات:

```bash
# احصل على token أولاً
curl -X POST https://your-production-url.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "123456"}'

# ثم اختبر الفئات
curl -X GET https://your-production-url.com/api/financial/fixed-assets/categories \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### الخطوة 4: إذا كان API لا يعمل
تحقق من ملف `server/src/routes/financial.js` في السطر 5465:

```javascript
// تأكد من أن هذا الكود موجود ويعمل
router.get('/fixed-assets/categories', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const { fixedAssetsParent } = await ensureFixedAssetsStructure();
    const categories = await Account.findAll({
      where: {
        parentId: fixedAssetsParent.id,
        type: 'asset',
        isActive: true
      },
      attributes: ['id', 'code', 'name', 'nameEn', 'type', 'level', 'parentId'],
      order: [['code', 'ASC']]
    });
    
    res.json({
      success: true,
      data: categories,
      total: categories.length
    });
  } catch (error) {
    // معالجة الخطأ
  }
});
```

### الخطوة 5: تحقق من الواجهة الأمامية
تأكد من أن الكود المحدث موجود في `client/src/pages/FixedAssetsManagement.tsx`:

```javascript
const loadCategories = async () => {
  try {
    console.log('🔄 Loading fixed asset categories...');
    const resp = await financialAPI.getFixedAssetCategories();
    const cats = resp?.data || resp || [];
    setCategories(Array.isArray(cats) ? cats : []);
  } catch (error) {
    console.error('Error loading fixed asset categories:', error);
    setCategories([]);
  }
};
```

## التحقق من الإصلاح

1. افتح صفحة إدارة الأصول الثابتة
2. اضغط على "أصل جديد"
3. تأكد من ظهور الفئات في القائمة المنسدلة

## الفئات المتوقعة
- سيارات (1.2.1)
- معدات وآلات (1.2.2)
- أثاث (1.2.3)
- مباني (1.2.4)
- أجهزة حاسوب (1.2.5)

## إذا استمرت المشكلة

1. افتح Developer Tools (F12)
2. اذهب إلى Console
3. ابحث عن رسائل خطأ
4. اذهب إلى Network tab
5. ابحث عن طلب `/api/financial/fixed-assets/categories`
6. تحقق من الاستجابة

## ملاحظة مهمة
تأكد من أن المستخدم لديه صلاحيات الوصول إلى الوحدة المالية.
