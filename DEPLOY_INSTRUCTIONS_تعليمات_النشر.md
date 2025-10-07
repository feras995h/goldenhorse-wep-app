# 🚀 تعليمات نشر الإصلاحات للسيرفر المنشور

**التاريخ**: 7 أكتوبر 2025  
**السيرفر المستهدف**: `web.goldenhorse-ly.com`

---

## ✅ الإصلاحات التي تمت محلياً

### 1. تحديث Model الفترة المحاسبية ✅
**الملف**: `server/src/models/AccountingPeriod.js`

**التغييرات**:
```javascript
// قبل:
year: DataTypes.INTEGER
month: DataTypes.INTEGER

// بعد:
name: DataTypes.STRING
fiscalYear: DataTypes.INTEGER
isCurrent: DataTypes.BOOLEAN
startDate: DataTypes.DATE
endDate: DataTypes.DATE
```

**Method محدّث**:
```javascript
AccountingPeriod.getCurrentPeriod = async function() {
  // الآن يبحث بـ isCurrent: true
  const current = await this.findOne({
    where: { isCurrent: true }
  });
  
  if (current) return current;
  
  // fallback: البحث حسب التاريخ الحالي
  const now = new Date();
  return await this.findOne({
    where: {
      startDate: { [sequelize.Op.lte]: now },
      endDate: { [sequelize.Op.gte]: now },
      status: 'open'
    }
  });
}
```

### 2. إنشاء الفترات المحاسبية ✅
- ✅ 12 فترة لسنة 2025 في قاعدة البيانات السحابية
- ✅ الفترة الحالية: أكتوبر 2025 (`isCurrent: true`)

### 3. إنشاء البيانات الأساسية ✅
- ✅ 15 حساب محاسبي
- ✅ مستخدم admin
- ✅ 5 إعدادات
- ✅ خريطة حسابات

---

## 🔧 خطوات النشر للسيرفر المنشور

### الطريقة 1: Git Push (الأفضل)

إذا كان السيرفر المنشور يستخدم Git:

```bash
# 1. تأكد من أنك في المجلد الصحيح
cd "C:\Users\dell\Desktop\منضوماتي\مجلد جديد (2)"

# 2. Add الملفات المعدلة
git add server/src/models/AccountingPeriod.js

# 3. Commit
git commit -m "Fix AccountingPeriod model to match database schema"

# 4. Push
git push origin main
# أو
git push origin master
```

**ثم على السيرفر المنشور**:
```bash
# SSH إلى السيرفر
ssh user@web.goldenhorse-ly.com

# الانتقال إلى مجلد المشروع
cd /path/to/project

# Pull آخر التعديلات
git pull origin main

# إعادة تشغيل السيرفر
pm2 restart all
# أو
systemctl restart your-app-name
# أو
npm restart
```

---

### الطريقة 2: FTP/SFTP Upload

إذا كان الوصول عبر FTP/SFTP:

1. **افتح برنامج FTP** (مثل FileZilla، WinSCP)
2. **اتصل بـ**: `web.goldenhorse-ly.com`
3. **ارفع الملف المعدل**:
   - من: `C:\Users\dell\Desktop\منضوماتي\مجلد جديد (2)\server\src\models\AccountingPeriod.js`
   - إلى: `/path/to/project/server/src/models/AccountingPeriod.js`
4. **أعد تشغيل السيرفر** (عبر لوحة التحكم أو SSH)

---

### الطريقة 3: cPanel أو لوحة تحكم الاستضافة

1. **سجّل دخول** إلى لوحة تحكم الاستضافة
2. **اذهب إلى File Manager**
3. **ابحث عن**: `server/src/models/AccountingPeriod.js`
4. **حرر الملف** مباشرة أو ارفع النسخة الجديدة
5. **أعد تشغيل التطبيق**

---

## ⚠️ مهم جداً: إعادة تشغيل السيرفر

بعد رفع الملفات، **يجب إعادة تشغيل Node.js** على السيرفر المنشور:

```bash
# إذا كنت تستخدم PM2
pm2 restart all
pm2 logs  # للتحقق من عدم وجود أخطاء

# إذا كنت تستخدم systemd
sudo systemctl restart your-app-name

# إذا كنت تستخدم forever
forever restartall

# إذا كنت تستخدم npm
npm restart
```

---

## 🧪 التحقق من نجاح النشر

بعد إعادة التشغيل، اختبر:

### 1. API الفترة المحاسبية
```bash
curl https://web.goldenhorse-ly.com/api/accounting-periods/current
```

**يجب أن يعود**:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "الفترة المحاسبية 2025-10",
    "fiscalYear": 2025,
    "status": "open",
    "isCurrent": true
  }
}
```

### 2. في المتصفح
افتح: `https://web.goldenhorse-ly.com` وتحقق من عدم وجود أخطاء 500

---

## 📋 قائمة التحقق

- [ ] نسخ الملف المعدل `AccountingPeriod.js` إلى السيرفر
- [ ] إعادة تشغيل Node.js على السيرفر
- [ ] اختبار `/api/accounting-periods/current`
- [ ] اختبار Dashboard في المتصفح
- [ ] التحقق من عدم وجود أخطاء 500

---

## 🆘 إذا لم تنجح

### الخيار 1: أرسل لي معلومات الوصول
إذا كان لديك SSH access:
```
Host: web.goldenhorse-ly.com
User: ؟
Password: ؟
Port: ؟
Project Path: ؟
```

### الخيار 2: احصل على logs من السيرفر
```bash
# على السيرفر المنشور
pm2 logs
# أو
tail -100 /path/to/logs/error.log
```

أرسل لي الـ logs لأساعدك في معرفة المشكلة.

---

## 📝 ملاحظات

### الملف المعدل فقط
الملف الوحيد الذي تم تعديله:
```
server/src/models/AccountingPeriod.js
```

### قاعدة البيانات
قاعدة البيانات السحابية (`72.60.92.146:5432`) **جاهزة ولا تحتاج تعديل**:
- ✅ الفترات موجودة
- ✅ الحسابات موجودة
- ✅ جميع البيانات جاهزة

المشكلة **فقط** في كود السيرفر المنشور الذي لا يزال يستخدم Model قديم.

---

## 🚀 بعد النشر

بمجرد نشر الملف المعدل وإعادة تشغيل السيرفر:
- ✅ `/api/accounting-periods/current` سيعمل
- ✅ جميع endpoints المالية ستعمل
- ✅ Dashboard سيظهر بدون أخطاء
- ✅ النظام جاهز 100%

---

**هل تحتاج مساعدة في أي من هذه الخطوات؟** 🤝

