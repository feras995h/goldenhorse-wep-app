# 🚨 دليل إعادة تشغيل الخادم الطارئ

## المشكلة: الكود محدث ولكن الخلل لا زال موجود

**السبب الأكثر احتمالاً:** الخادم لم يتم إعادة تشغيله بعد التحديث

---

## 🔧 خطوات إعادة التشغيل الفورية

### **الطريقة 1: PM2 (الأكثر شيوعاً)**
```bash
# إعادة تشغيل التطبيق
pm2 restart golden-horse-api

# أو إعادة تشغيل جميع التطبيقات
pm2 restart all

# للتحقق من الحالة
pm2 status
pm2 logs golden-horse-api
```

### **الطريقة 2: Systemctl (إذا كان يعمل كخدمة)**
```bash
# إعادة تشغيل الخدمة
sudo systemctl restart golden-horse-api

# للتحقق من الحالة
sudo systemctl status golden-horse-api
sudo journalctl -u golden-horse-api -f
```

### **الطريقة 3: Docker (إذا كان في حاوية)**
```bash
# إعادة تشغيل الحاوية
docker restart golden-horse-container

# أو إعادة بناء وتشغيل
docker-compose down
docker-compose up -d

# للتحقق من logs
docker logs golden-horse-container -f
```

### **الطريقة 4: إعادة تشغيل يدوي**
```bash
# إيقاف العملية
pkill -f "node.*golden-horse"

# تشغيل التطبيق مرة أخرى
cd /path/to/golden-horse-app
npm start
# أو
node server.js
```

---

## 🔍 التحقق من نجاح إعادة التشغيل

### **1. فحص العمليات الجارية:**
```bash
# البحث عن عملية التطبيق
ps aux | grep golden-horse
ps aux | grep node

# فحص المنافذ المستخدمة
netstat -tlnp | grep :3000
# أو المنفذ المستخدم للتطبيق
```

### **2. فحص logs الخادم:**
```bash
# PM2 logs
pm2 logs golden-horse-api --lines 50

# System logs
tail -f /var/log/golden-horse/app.log

# Docker logs
docker logs golden-horse-container --tail 50
```

### **3. اختبار API:**
```bash
# اختبار بسيط للـ API
curl -I https://web.goldenhorse-ly.com/api/health
curl -I https://web.goldenhorse-ly.com/api/financial/fixed-assets/categories
```

---

## 🎯 علامات نجاح إعادة التشغيل

### **✅ علامات إيجابية:**
- `Server started on port XXXX`
- `Database connected successfully`
- `✅ Fixed assets structure ensured`
- `API endpoints registered`

### **❌ علامات مشاكل:**
- `Error: Cannot find module`
- `Database connection failed`
- `Port XXXX is already in use`
- `Syntax error in code`

---

## 🚨 إذا فشلت إعادة التشغيل

### **1. فحص الأخطاء:**
```bash
# فحص syntax errors
node --check server.js

# فحص dependencies
npm install
npm audit fix

# فحص environment variables
printenv | grep NODE
```

### **2. إعادة نشر الكود:**
```bash
# سحب آخر تحديثات من Git
git pull origin main

# تثبيت dependencies
npm install

# إعادة تشغيل
pm2 restart golden-horse-api
```

### **3. فحص قاعدة البيانات:**
```bash
# اختبار الاتصال
psql -h 72.60.92.146 -U postgres -d postgres -c "SELECT 1;"

# فحص الجداول المطلوبة
psql -h 72.60.92.146 -U postgres -d postgres -c "SELECT COUNT(*) FROM accounts WHERE code LIKE '1.2.%';"
```

---

## 📞 خطوات الطوارئ

### **إذا لم تنجح جميع الطرق:**

1. **إعادة تشغيل الخادم كاملاً:**
   ```bash
   sudo reboot
   ```

2. **التحقق من مساحة القرص:**
   ```bash
   df -h
   du -sh /path/to/app
   ```

3. **فحص الذاكرة:**
   ```bash
   free -h
   top
   ```

4. **إعادة تثبيت التطبيق:**
   ```bash
   # نسخ احتياطي
   cp -r /path/to/app /path/to/app-backup
   
   # إعادة استنساخ من Git
   git clone https://github.com/feras995h/goldenhorse-wep-app.git
   cd goldenhorse-wep-app
   npm install
   npm start
   ```

---

## 🎉 بعد نجاح إعادة التشغيل

### **اختبار فوري:**
1. فتح https://web.goldenhorse-ly.com
2. تسجيل الدخول
3. الذهاب إلى إدارة الأصول الثابتة
4. النقر على "أصل جديد"
5. التحقق من ظهور 14 فئة في القائمة

### **مراقبة مستمرة:**
```bash
# مراقبة logs
pm2 logs golden-horse-api -f

# مراقبة الأداء
pm2 monit
```

---

## 💡 نصائح لتجنب المشكلة مستقبلاً

1. **إعادة التشغيل التلقائي بعد التحديث:**
   ```bash
   # إضافة في deployment script
   git pull origin main
   npm install
   pm2 restart golden-horse-api
   ```

2. **مراقبة الخادم:**
   ```bash
   # إعداد monitoring
   pm2 install pm2-server-monit
   ```

3. **نسخ احتياطية منتظمة:**
   ```bash
   # backup script
   tar -czf backup-$(date +%Y%m%d).tar.gz /path/to/app
   ```

---

**🎯 الخلاصة:** في 90% من الحالات، إعادة تشغيل الخادم تحل المشكلة بعد تحديث الكود!
