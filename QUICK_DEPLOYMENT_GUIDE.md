# 🚀 دليل النشر السريع - نظام الحصان الذهبي
# Quick Deployment Guide - Golden Horse Shipping System

## ✅ تم إكمال تحضير النظام للنشر بنجاح!

### 📊 **ملخص ما تم إنجازه:**

#### 1. **تنظيف قاعدة البيانات** ✅
- ✅ إزالة جميع البيانات الوهمية والتجريبية
- ✅ الاحتفاظ بالهيكل الأساسي (دليل الحسابات، المستخدم الإداري)
- ✅ إعداد بيانات الإنتاج الأساسية

#### 2. **إعداد GitHub للنشر التلقائي** ✅
- ✅ إنشاء GitHub Actions workflow
- ✅ إعداد PM2 ecosystem للإنتاج
- ✅ إنشاء Docker configuration
- ✅ رفع المشروع إلى GitHub بنجاح

#### 3. **تحسين النظام** ✅
- ✅ توحيد لوحة مدير النظام
- ✅ إصلاح مشاكل CORS والمصادقة
- ✅ تحسين الأداء والاستقرار

---

## 🔗 **روابط المشروع:**

### **GitHub Repository:**
```
https://github.com/feras995h/goldenhorse-wep-app.git
```

### **بيانات تسجيل الدخول الحالية:**
```
اسم المستخدم: admin
كلمة المرور: admin123
```

---

## 🚀 **خطوات النشر على الخادم:**

### **الطريقة الأولى: النشر التلقائي عبر GitHub Actions**

#### 1. إعداد GitHub Secrets:
في إعدادات Repository على GitHub، أضف المتغيرات التالية:

```
VPS_HOST=your-server-ip
VPS_USERNAME=your-username
VPS_SSH_KEY=your-private-ssh-key
VPS_PORT=22
JWT_SECRET=your-secure-jwt-secret-32-chars-minimum
JWT_REFRESH_SECRET=your-secure-jwt-refresh-secret-32-chars-minimum
DB_URL=postgresql://username:password@host:port/database_name
APP_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

#### 2. إعداد الخادم:
```bash
# تثبيت Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# تثبيت PM2
sudo npm install -g pm2

# تثبيت PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# إنشاء قاعدة البيانات
sudo -u postgres createdb golden_horse_production
sudo -u postgres createuser golden_horse_user
```

#### 3. النشر التلقائي:
```bash
# كل push إلى main سيؤدي إلى نشر تلقائي
git push origin main
```

---

### **الطريقة الثانية: النشر اليدوي**

#### 1. استنساخ المشروع:
```bash
git clone https://github.com/feras995h/goldenhorse-wep-app.git
cd goldenhorse-wep-app
```

#### 2. إعداد البيئة:
```bash
cd server
cp .env.production.example .env
# تحرير ملف .env بالقيم الصحيحة
```

#### 3. تثبيت وتشغيل:
```bash
# تثبيت اعتماديات الخادم
cd server && npm ci --only=production

# تثبيت وبناء العميل
cd ../client && npm ci --only=production && npm run build

# إعداد قاعدة البيانات
cd ../server && npm run setup-production

# تشغيل مع PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

---

### **الطريقة الثالثة: النشر باستخدام Docker**

```bash
# استنساخ المشروع
git clone https://github.com/feras995h/goldenhorse-wep-app.git
cd goldenhorse-wep-app

# إعداد متغيرات البيئة
cp server/.env.production.example server/.env
# تحرير ملف .env

# تشغيل مع Docker
docker-compose -f docker-compose.production.yml up -d
```

---

## 🔧 **إعداد Nginx (اختياري)**

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        root /var/www/goldenhorse-wep-app/client/build;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📊 **مراقبة النظام:**

```bash
# حالة PM2
pm2 status

# سجلات التطبيق
pm2 logs golden-horse-api

# مراقبة الموارد
pm2 monit

# فحص صحة التطبيق
curl http://localhost:5001/api/health
```

---

## 🆘 **استكشاف الأخطاء:**

### **مشاكل شائعة:**

1. **خطأ 502 Bad Gateway:**
   ```bash
   pm2 restart golden-horse-api
   ```

2. **مشاكل قاعدة البيانات:**
   ```bash
   cd server
   npm run db:test-connection
   ```

3. **مشاكل الصلاحيات:**
   ```bash
   sudo chown -R $USER:$USER /var/www/goldenhorse-wep-app
   ```

---

## 📞 **الدعم والمساعدة:**

### **الملفات المرجعية:**
- `GITHUB_DEPLOYMENT.md` - دليل النشر الشامل
- `PRODUCTION_DEPLOYMENT.md` - دليل نشر الإنتاج
- `README.md` - معلومات المشروع

### **GitHub Issues:**
```
https://github.com/feras995h/goldenhorse-wep-app/issues
```

---

## 🎉 **النظام جاهز للنشر!**

### **المميزات المتاحة:**
- ✅ نظام محاسبي متكامل
- ✅ إدارة المستخدمين والأدوار
- ✅ لوحات تحكم متخصصة
- ✅ واجهة عربية حديثة
- ✅ أمان متقدم
- ✅ نشر تلقائي عبر GitHub

### **الخطوة التالية:**
1. اختر طريقة النشر المناسبة
2. اتبع التعليمات المناسبة
3. تأكد من تشغيل النظام
4. غيّر كلمة مرور المدير الافتراضية

**🚀 نظام الحصان الذهبي جاهز للانطلاق!**
