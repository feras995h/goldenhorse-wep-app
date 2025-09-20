# دليل الإصلاح السريع لأخطاء VPS

## 🚨 الأخطاء المكتشفة

### 1. **أخطاء الشعار (Logo)**
```
api/settings/logo: Failed to load resource: net::ERR_INTERNET_DISCONNECTED
```

### 2. **خطأ الأرصدة الافتتاحية**
```
api/financial/opening-balances: 500 Internal Server Error
```

### 3. **خطأ إنشاء العملاء**
```
api/sales/customers: 400 Bad Request
```

---

## ⚡ الحل السريع (5 دقائق)

### الخطوة 1: تطبيق إصلاح قاعدة البيانات
```bash
# SSH إلى VPS
ssh user@your-vps-ip

# تطبيق سكريپت الإصلاح
psql $DATABASE_URL -f fix-vps-database.sql
```

### الخطوة 2: رفع الكود المحدث
```bash
# في المجلد المحلي
git add .
git commit -m "Fix VPS errors - database schema and API updates"
git push origin main

# في VPS
cd /path/to/your/app
git pull origin main
npm install
```

### الخطوة 3: إعادة تشغيل الخدمات
```bash
# إذا كان يستخدم PM2
pm2 restart all

# إذا كان يستخدم Docker
docker-compose restart

# إذا كان يستخدم Coolify
# إعادة deploy من لوحة التحكم
```

### الخطوة 4: اختبار النظام
```bash
# تشغيل سكريپت الاختبار
node test-vps-apis.js
```

---

## 🔧 إصلاحات محددة

### إصلاح مشكلة الشعار
```bash
# إنشاء مجلد uploads
mkdir -p /app/data/uploads
chmod 755 /app/data/uploads

# حذف إعدادات الشعار المكسورة
psql $DATABASE_URL -c "DELETE FROM settings WHERE key LIKE 'logo%';"
```

### إصلاح مشكلة الأرصدة الافتتاحية
```sql
-- إضافة العمود المفقود
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS isMonitored BOOLEAN DEFAULT false;
```

### إصلاح مشكلة العملاء
```sql
-- إنشاء جدول العملاء
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) DEFAULT 'individual',
    email VARCHAR(100),
    phone VARCHAR(50),
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📋 قائمة التحقق السريعة

### ✅ قبل الإصلاح:
- [ ] أخذ نسخة احتياطية من قاعدة البيانات
- [ ] التأكد من صلاحيات الوصول للخادم
- [ ] التأكد من رابط VPS الصحيح

### ✅ أثناء الإصلاح:
- [ ] تطبيق سكريپت إصلاح قاعدة البيانات
- [ ] رفع الكود المحدث
- [ ] إعادة تشغيل الخدمات
- [ ] اختبار APIs الأساسية

### ✅ بعد الإصلاح:
- [ ] تسجيل الدخول يعمل
- [ ] إنشاء حساب جديد يعمل
- [ ] إنشاء عميل جديد يعمل
- [ ] الأرصدة الافتتاحية تعمل
- [ ] الشعار لا يظهر أخطاء

---

## 🎯 النتيجة المتوقعة

بعد تطبيق هذه الإصلاحات، يجب أن:

✅ **تختفي جميع الأخطاء التالية:**
- `api/settings/logo: Failed to load resource`
- `api/financial/opening-balances: 500 Internal Server Error`
- `api/sales/customers: 400 Bad Request`

✅ **تعمل جميع الوظائف التالية:**
- تسجيل الدخول والخروج
- عرض قائمة الحسابات
- إنشاء حسابات جديدة
- عرض وإنشاء العملاء
- الأرصدة الافتتاحية
- الملخص المالي

---

## 🆘 إذا لم تنجح الإصلاحات

### تشخيص إضافي:
```bash
# فحص logs الخادم
pm2 logs
# أو
docker logs container-name

# فحص حالة قاعدة البيانات
psql $DATABASE_URL -c "\dt"

# اختبار الاتصال بقاعدة البيانات
psql $DATABASE_URL -c "SELECT COUNT(*) FROM accounts;"
```

### إصلاحات متقدمة:
```bash
# إعادة إنشاء قاعدة البيانات (خطر!)
# فقط إذا كانت البيانات غير مهمة
dropdb database_name
createdb database_name
psql database_name -f fix-vps-database.sql
```

### طلب المساعدة:
إذا استمرت المشاكل، أرسل:
1. **Logs الخادم** (آخر 50 سطر)
2. **رسائل الخطأ** من المتصفح
3. **نتائج سكريپت الاختبار**
4. **معلومات البيئة** (Node.js version, Database version)

---

## 📞 معلومات الدعم

- **الملفات المطلوبة**: `fix-vps-database.sql`, `test-vps-apis.js`
- **الوقت المتوقع**: 5-10 دقائق
- **مستوى الصعوبة**: متوسط
- **المخاطر**: منخفضة (مع أخذ نسخة احتياطية)

**الهدف: جعل النسخة على VPS تعمل مثل النسخة المحلية تماماً** 🎯
