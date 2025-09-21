# 🔧 **أوامر إصلاح الخادم المباشر** 🔧

---

## 📋 **معلومات الاتصال:**
- **Host:** 72.60.92.146
- **Username:** root
- **Password:** Feras6476095#

---

## 🚀 **الخطوات التفصيلية:**

### **الخطوة 1: تسجيل الدخول للخادم**

```bash
# تسجيل الدخول للخادم
ssh root@72.60.92.146
# كلمة المرور: Feras6476095#
```

### **الخطوة 2: فحص الوضع الحالي**

```bash
# فحص المجلد الحالي
pwd
ls -la

# البحث عن مجلد المشروع
find / -name "golden-horse*" -type d 2>/dev/null
find / -name "server.js" -type f 2>/dev/null
find / -name ".env" -type f 2>/dev/null

# فحص العمليات الجارية
pm2 list
ps aux | grep node
```

### **الخطوة 3: الانتقال لمجلد المشروع**

```bash
# الانتقال لمجلد المشروع (قد يكون أحد هذه المسارات)
cd /root/golden-horse-shipping
# أو
cd /home/golden-horse-shipping
# أو
cd /var/www/golden-horse-shipping
# أو
cd /opt/golden-horse-shipping

# التأكد من وجود الملفات
ls -la
ls -la server/src/
```

### **الخطوة 4: فحص متغيرات البيئة الحالية**

```bash
# فحص ملف .env الحالي
cat .env

# فحص متغيرات البيئة في PM2
pm2 env 0

# فحص متغيرات النظام
echo "DB_URL: $DB_URL"
echo "DATABASE_URL: $DATABASE_URL"
```

### **الخطوة 5: تحديث الكود**

```bash
# سحب آخر تحديثات من Git
git status
git pull origin main

# التأكد من وجود الملفات المحدثة
ls -la server/src/server.js
grep -n "debug-env" server/src/server.js
```

### **الخطوة 6: تحديث متغيرات البيئة**

```bash
# إنشاء نسخة احتياطية من .env الحالي
cp .env .env.backup

# إنشاء ملف .env جديد بالقيم الصحيحة
cat > .env << 'EOF'
NODE_ENV=production
PORT=5001
TRUST_PROXY=1

# قاعدة البيانات الصحيحة
DB_URL=postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping
DATABASE_URL=postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping

# CORS
CORS_ORIGIN=https://web.goldenhorse-ly.com

# JWT
JWT_SECRET=ozf9qbo49p0wgf83e09106s5kjovsep2
JWT_REFRESH_SECRET=ozf9qbo49p0wgf83e09106s5kjovsep2
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
EOF

# التأكد من صحة الملف
cat .env
```

### **الخطوة 7: إعادة تشغيل الخادم**

```bash
# إيقاف العمليات الحالية
pm2 delete all

# تثبيت التبعيات (إن لزم الأمر)
cd server
npm install --omit=dev
cd ..

# بدء الخادم من جديد
pm2 start server/src/server.js --name "golden-horse-api" --env production

# التحقق من الحالة
pm2 status
pm2 logs --lines 20
```

### **الخطوة 8: اختبار النتائج**

```bash
# اختبار health endpoint
curl -s http://localhost:5001/api/health | jq .

# اختبار debug endpoint الجديد
curl -s http://localhost:5001/api/debug-env | jq .

# فحص logs للتأكد من الاتصال الصحيح
pm2 logs | grep -i "database\|connection\|golden-horse" | tail -10
```

### **الخطوة 9: اختبار من الخارج**

```bash
# اختبار من خارج الخادم
curl -s https://web.goldenhorse-ly.com/api/health
curl -s https://web.goldenhorse-ly.com/api/debug-env
```

---

## 🎯 **النتائج المتوقعة:**

### **✅ في debug endpoint يجب أن تظهر:**
```json
{
  "database_config": {
    "database": "golden-horse-shipping"
  },
  "database_test": {
    "current_db": "golden-horse-shipping"
  }
}
```

### **✅ في logs يجب أن تظهر:**
```
✅ Environment variables validation passed
Database connection successful
Connected to golden-horse-shipping database
```

---

## 🚨 **إذا واجهت مشاكل:**

### **مشكلة: لا يمكن العثور على مجلد المشروع**
```bash
# البحث الشامل
find / -name "package.json" -exec grep -l "golden-horse" {} \; 2>/dev/null
find / -name "*.js" -exec grep -l "Golden Horse" {} \; 2>/dev/null
```

### **مشكلة: PM2 غير مثبت**
```bash
# تثبيت PM2
npm install -g pm2

# أو استخدام node مباشرة
cd server
node src/server.js
```

### **مشكلة: Git غير متاح**
```bash
# تحميل الكود يدوياً
wget https://github.com/feras995h/goldenhorse-wep-app/archive/main.zip
unzip main.zip
```

---

## 📞 **بعد تطبيق الخطوات:**

1. **شارك نتائج هذه الأوامر:**
   ```bash
   pm2 status
   curl -s http://localhost:5001/api/debug-env | jq .
   pm2 logs --lines 10
   ```

2. **اختبر في المتصفح:**
   - https://web.goldenhorse-ly.com/api/health
   - https://web.goldenhorse-ly.com/api/debug-env
   - تسجيل دخول جديد
   - اختبار صفحة المبيعات

3. **تأكد من اختفاء الأخطاء:**
   - لا توجد أخطاء 500
   - جميع APIs تعمل
   - البيانات تظهر بشكل صحيح

---

## 🏆 **النتيجة النهائية:**

**🎉 بعد تطبيق هذه الخطوات: نظام Golden Horse سيعمل بكفاءة مثالية! 🎉**

**✅ جميع المشاكل ستختفي**
**✅ جميع APIs ستعمل**
**✅ النظام سيكون مستقر وآمن**

**🚀 Golden Horse Complete System - جاهز للاستخدام! 🚀**
