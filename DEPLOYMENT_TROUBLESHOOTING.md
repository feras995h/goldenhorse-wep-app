# 🔧 دليل حل مشاكل النشر - نظام الحصان الذهبي
# Deployment Troubleshooting Guide - Golden Horse Shipping System

## ✅ تم إصلاح مشكلة Docker Build

### 🐛 **المشكلة التي تم حلها:**
```
sh: 1: vite: not found
ERROR: failed to build: process "/bin/bash -ol pipefail -c npm run build" did not complete successfully: exit code:127
```

### 🔧 **الحل المطبق:**
1. ✅ **تحديث Dockerfile**: تثبيت جميع الاعتماديات (بما في ذلك dev dependencies) في مرحلة البناء
2. ✅ **إصلاح مسار البناء**: تغيير من `client/dist` إلى `client/build`
3. ✅ **تحديث package.json**: إضافة سكريبتات جديدة للبناء والتثبيت
4. ✅ **تحسين عملية البناء**: فصل مراحل التثبيت والبناء والإنتاج

---

## 🚀 **حالة النشر الحالية:**

### ✅ **ما تم إنجازه:**
- ✅ **تنظيف قاعدة البيانات** من جميع البيانات الوهمية
- ✅ **إعداد GitHub Actions** للنشر التلقائي
- ✅ **إصلاح Dockerfile** لحل مشاكل البناء
- ✅ **تحديث التوثيق** مع أدلة شاملة
- ✅ **رفع المشروع** إلى GitHub بنجاح

### 🔗 **GitHub Repository:**
```
https://github.com/feras995h/goldenhorse-wep-app.git
```

---

## 🛠️ **مشاكل شائعة وحلولها:**

### 1. **مشكلة: `vite: not found`**
**الحل:** ✅ تم إصلاحها في آخر تحديث
```dockerfile
# تثبيت جميع الاعتماديات في مرحلة البناء
RUN npm install
RUN cd client && npm install
```

### 2. **مشكلة: `client/dist not found`**
**الحل:** ✅ تم تحديث المسار إلى `client/build`
```dockerfile
COPY --from=builder --chown=nodejs:nodejs /app/client/build ./client/build
```

### 3. **مشكلة: Database Connection****
**الحل:**
```bash
# تحقق من متغيرات البيئة
cd server
cat .env

# اختبار الاتصال
npm run db:test-connection
```

### 4. **مشكلة: Port Already in Use**
**الحل:**
```bash
# إيقاف العمليات على المنفذ
sudo lsof -ti:5001 | xargs kill -9

# أو تغيير المنفذ في .env
PORT=5002
```

### 5. **مشكلة: PM2 Not Starting**
**الحل:**
```bash
# إعادة تشغيل PM2
pm2 kill
pm2 start ecosystem.config.js --env production

# أو استخدام Node.js مباشرة
cd server
npm start
```

---

## 🐳 **نشر Docker محدث:**

### **Dockerfile الجديد يدعم:**
- ✅ **Multi-stage build** محسن
- ✅ **تثبيت اعتماديات صحيح** للبناء والإنتاج
- ✅ **Health checks** متقدمة
- ✅ **Non-root user** للأمان
- ✅ **Cache optimization** لسرعة البناء

### **أوامر النشر:**
```bash
# بناء وتشغيل
docker-compose -f docker-compose.production.yml up -d

# مراقبة السجلات
docker-compose -f docker-compose.production.yml logs -f

# إعادة البناء عند التحديث
docker-compose -f docker-compose.production.yml up -d --build
```

---

## 📊 **مراقبة النظام:**

### **فحص حالة التطبيق:**
```bash
# حالة Docker
docker ps

# سجلات التطبيق
docker logs golden-horse-app

# فحص صحة التطبيق
curl http://localhost:5001/api/health
```

### **مراقبة الموارد:**
```bash
# استخدام الذاكرة والمعالج
docker stats

# مساحة القرص
df -h

# حالة قاعدة البيانات
docker exec -it golden-horse-db psql -U golden_horse_user -d golden_horse_production -c "SELECT version();"
```

---

## 🔐 **الأمان والصيانة:**

### **النسخ الاحتياطية:**
```bash
# نسخة احتياطية من قاعدة البيانات
docker exec golden-horse-db pg_dump -U golden_horse_user golden_horse_production > backup_$(date +%Y%m%d).sql

# نسخة احتياطية من الملفات
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz server/uploads/
```

### **تحديث النظام:**
```bash
# سحب آخر التحديثات
git pull origin main

# إعادة بناء ونشر
docker-compose -f docker-compose.production.yml up -d --build

# تنظيف الصور القديمة
docker image prune -f
```

---

## 📞 **الحصول على المساعدة:**

### **سجلات مفيدة:**
```bash
# سجلات التطبيق
docker logs golden-horse-app --tail=100

# سجلات قاعدة البيانات
docker logs golden-horse-db --tail=50

# سجلات Nginx
docker logs golden-horse-nginx --tail=50
```

### **أوامر التشخيص:**
```bash
# فحص الشبكة
docker network ls
docker network inspect golden-horse-network

# فحص الأحجام
docker volume ls
docker volume inspect golden-horse_postgres_data
```

---

## 🎯 **الخطوات التالية:**

1. **مراقبة النشر** الجديد للتأكد من عمله بشكل صحيح
2. **اختبار جميع الوظائف** بعد النشر
3. **إعداد النسخ الاحتياطية** التلقائية
4. **تكوين مراقبة الأداء** والتنبيهات
5. **تحديث DNS** للإشارة إلى الخادم الجديد

---

## ✅ **ملخص الحالة:**

- 🟢 **قاعدة البيانات**: نظيفة وجاهزة للإنتاج
- 🟢 **Docker Build**: تم إصلاح جميع المشاكل
- 🟢 **GitHub Repository**: محدث مع آخر التحسينات
- 🟢 **التوثيق**: شامل ومحدث
- 🟢 **النشر**: جاهز للتطبيق

**🚀 النظام جاهز للنشر على الخادم بدون مشاكل!**
