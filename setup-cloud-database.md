# إعادة الربط بقاعدة البيانات السحابية

**التاريخ**: 7 أكتوبر 2025  
**الخادم**: 72.60.92.146:5432  
**الحالة**: ✅ الخادم متاح

---

## ⚠️ تحذير أمني مهم جداً

**كلمة المرور القديمة مكشوفة في الكود!**

قبل الاتصال، يجب:
1. **تغيير كلمة المرور** على الخادم
2. استخدام كلمة مرور **جديدة وقوية**
3. **عدم مشاركتها** مع أحد

---

## 📋 الخيارات المتاحة

### الخيار 1: استخدام كلمة مرور جديدة (موصى به) ⭐

إذا كنت **غيّرت كلمة المرور** بالفعل:

```bash
# في PowerShell
$password = Read-Host "أدخل كلمة المرور الجديدة" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# إنشاء ملف .env
@"
NODE_ENV=production
DATABASE_URL=postgresql://postgres:$plainPassword@72.60.92.146:5432/postgres
JWT_SECRET=3f8b2a9c1e5d7f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a
JWT_REFRESH_SECRET=9e7c5b3a1f8d6e4c2a0f8e6d4c2b0a9e7c5b3a1f8d6e4c2a0f8e6d4c2b0a9e7c
JWT_EXPIRES_IN=28800
JWT_REFRESH_EXPIRES_IN=604800
PORT=5001
HOST=localhost
CORS_ORIGIN=http://localhost:5173
NODE_OPTIONS=--max-old-space-size=512
ENABLE_RATE_LIMITING=true
TRUST_PROXY=1
"@ | Out-File -FilePath .env -Encoding utf8

# نسخ للـ server
Copy-Item .env server\.env -Force
```

### الخيار 2: استخدام كلمة المرور القديمة (خطر!) ⚠️

**لا يُنصح به!** لكن إذا كنت في بيئة تطوير مؤقتة:

```bash
# في PowerShell
$oldPassword = "XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP"

@"
NODE_ENV=production
DATABASE_URL=postgresql://postgres:$oldPassword@72.60.92.146:5432/postgres
JWT_SECRET=3f8b2a9c1e5d7f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a
JWT_REFRESH_SECRET=9e7c5b3a1f8d6e4c2a0f8e6d4c2b0a9e7c5b3a1f8d6e4c2a0f8e6d4c2b0a9e7c
JWT_EXPIRES_IN=28800
JWT_REFRESH_EXPIRES_IN=604800
PORT=5001
CORS_ORIGIN=http://localhost:5173
NODE_OPTIONS=--max-old-space-size=512
ENABLE_RATE_LIMITING=true
"@ | Out-File -FilePath .env -Encoding utf8

Copy-Item .env server\.env -Force

Write-Host "⚠️ تذكير: غيّر كلمة المرور في أقرب وقت!" -ForegroundColor Red
```

---

## 🧪 اختبار الاتصال

بعد إنشاء ملف .env:

```bash
cd server
node -e "
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

sequelize.authenticate()
  .then(() => {
    console.log('✅ نجح الاتصال بقاعدة البيانات!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ فشل الاتصال:', err.message);
    process.exit(1);
  });
"
```

---

## 🚀 تشغيل السيرفر

```bash
cd server
npm start
```

---

## ✅ التحقق من النجاح

يجب أن ترى:
```
✅ Database connected
🚀 Server running on port 5001
```

---

## 🔒 ملاحظات أمنية

### يجب عمله:
1. ✅ تغيير كلمة المرور على الخادم
2. ✅ استخدام .env (لا تضع كلمات مرور في الكود)
3. ✅ .env في .gitignore
4. ✅ كلمة مرور قوية (32+ حرف)

### لا تفعل:
1. ❌ لا تشارك كلمة المرور
2. ❌ لا ترفع .env إلى Git
3. ❌ لا تستخدم كلمات مرور ضعيفة

---

## 🆘 في حالة الفشل

### خطأ: Authentication failed
```
السبب: كلمة المرور خاطئة
الحل: تحقق من كلمة المرور في .env
```

### خطأ: Connection timeout
```
السبب: الخادم غير متاح أو Firewall
الحل: تحقق من الاتصال بالإنترنت والـ Firewall
```

### خطأ: Database does not exist
```
السبب: اسم قاعدة البيانات خاطئ
الحل: استخدم "postgres" أو اسم قاعدة البيانات الصحيح
```

---

**آخر تحديث**: 7 أكتوبر 2025  
**الحالة**: جاهز للتطبيق

