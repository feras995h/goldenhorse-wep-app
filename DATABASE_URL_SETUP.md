# 🗄️ إعداد قاعدة البيانات باستخدام DB_URL
# Database Setup Using DB_URL - Golden Horse Shipping System

## ✅ تم تحديث النظام لدعم DB_URL

### 🎯 **المميزات الجديدة:**
- ✅ **دعم DB_URL** للاتصال بقواعد البيانات المستضافة
- ✅ **مرونة في الإعداد** - استخدم DB_URL أو المتغيرات المنفصلة
- ✅ **تحسين الأمان** مع التحقق الذكي من متغيرات البيئة
- ✅ **دعم جميع مقدمي الخدمة** (Railway, Heroku, DigitalOcean, إلخ)

---

## 🔗 **طرق إعداد قاعدة البيانات:**

### **الطريقة الأولى: استخدام DB_URL (مُوصى بها)**

#### **1. تنسيق DB_URL:**
```bash
# PostgreSQL
DB_URL=postgresql://username:password@host:port/database_name

# MySQL
DB_URL=mysql://username:password@host:port/database_name

# أمثلة حقيقية:
DB_URL=postgresql://user:pass123@localhost:5432/golden_horse_production
DB_URL=postgresql://admin:securepass@db.example.com:5432/shipping_db
```

#### **2. مقدمي الخدمة الشائعين:**

**Railway:**
```bash
DB_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```

**Heroku:**
```bash
DB_URL=postgres://user:pass@ec2-xxx.compute-1.amazonaws.com:5432/database
```

**DigitalOcean:**
```bash
DB_URL=postgresql://doadmin:password@db-postgresql-xxx.db.ondigitalocean.com:25060/defaultdb?sslmode=require
```

**Supabase:**
```bash
DB_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

---

### **الطريقة الثانية: المتغيرات المنفصلة**

```bash
# إعدادات PostgreSQL
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=golden_horse_production
DB_USER=golden_horse_user
DB_PASSWORD=your_secure_password

# إعدادات MySQL
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=golden_horse_production
DB_USER=golden_horse_user
DB_PASSWORD=your_secure_password
```

---

## ⚙️ **إعداد ملف .env للإنتاج:**

### **1. نسخ ملف الإعداد:**
```bash
cd server
cp .env.production.example .env
```

### **2. تحديث متغيرات البيئة:**
```bash
# تحرير ملف .env
nano .env

# أو
vim .env
```

### **3. إعداد DB_URL:**
```bash
# في ملف .env
NODE_ENV=production
DB_URL=postgresql://your_username:your_password@your_host:5432/your_database
JWT_SECRET=your_very_secure_jwt_secret_key_minimum_32_characters
JWT_REFRESH_SECRET=your_very_secure_jwt_refresh_secret_key_minimum_32_characters
```

---

## 🧪 **اختبار الاتصال:**

### **1. اختبار اتصال قاعدة البيانات:**
```bash
cd server
npm run db:test-connection
```

### **2. تشغيل النظام:**
```bash
# تطوير
npm run dev

# إنتاج
npm start
```

### **3. فحص السجلات:**
```bash
# البحث عن رسائل الاتصال
tail -f logs/app.log | grep -i database

# أو مراقبة مباشرة
npm start 2>&1 | grep -i database
```

---

## 🔧 **استكشاف الأخطاء:**

### **مشاكل شائعة وحلولها:**

#### **1. خطأ: "Missing required environment variables"**
```bash
# التحقق من وجود DB_URL
echo $DB_URL

# أو التحقق من ملف .env
cat server/.env | grep DB_URL
```

#### **2. خطأ: "Connection refused"**
```bash
# التحقق من صحة DB_URL
# تأكد من:
# - صحة اسم المستخدم وكلمة المرور
# - صحة عنوان الخادم والمنفذ
# - وجود قاعدة البيانات
```

#### **3. خطأ: "SSL connection required"**
```bash
# إضافة SSL إلى DB_URL
DB_URL=postgresql://user:pass@host:5432/db?sslmode=require

# أو تعطيل SSL للاختبار المحلي
DB_URL=postgresql://user:pass@localhost:5432/db?sslmode=disable
```

#### **4. خطأ: "Database does not exist"**
```bash
# إنشاء قاعدة البيانات يدوياً
createdb golden_horse_production

# أو باستخدام psql
psql -h host -U username -c "CREATE DATABASE golden_horse_production;"
```

---

## 🚀 **النشر على مقدمي الخدمة:**

### **Railway:**
```bash
# 1. إنشاء مشروع جديد
railway new

# 2. إضافة قاعدة بيانات PostgreSQL
railway add postgresql

# 3. الحصول على DB_URL
railway variables

# 4. تعيين متغيرات البيئة
railway variables set JWT_SECRET=your_secret
railway variables set NODE_ENV=production

# 5. النشر
railway up
```

### **Heroku:**
```bash
# 1. إنشاء تطبيق
heroku create golden-horse-shipping

# 2. إضافة قاعدة بيانات
heroku addons:create heroku-postgresql:hobby-dev

# 3. تعيين متغيرات البيئة
heroku config:set JWT_SECRET=your_secret
heroku config:set NODE_ENV=production

# 4. النشر
git push heroku main
```

### **DigitalOcean App Platform:**
```yaml
# app.yaml
name: golden-horse-shipping
services:
- name: api
  source_dir: /
  github:
    repo: your-username/golden-horse-shipping
    branch: main
  run_command: cd server && npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: DB_URL
    value: ${db.DATABASE_URL}
  - key: JWT_SECRET
    value: your_secret_here

databases:
- name: db
  engine: PG
  version: "13"
  size: db-s-1vcpu-1gb
```

---

## 📊 **مراقبة قاعدة البيانات:**

### **1. فحص حالة الاتصال:**
```bash
curl http://localhost:5001/api/health
```

### **2. مراقبة الأداء:**
```bash
# عرض معلومات قاعدة البيانات
curl http://localhost:5001/api/admin/system-stats
```

### **3. النسخ الاحتياطية:**
```bash
# نسخة احتياطية يدوية
pg_dump $DB_URL > backup_$(date +%Y%m%d).sql

# استعادة من نسخة احتياطية
psql $DB_URL < backup_20241211.sql
```

---

## ✅ **قائمة التحقق للنشر:**

- [ ] **تم تعيين DB_URL** بشكل صحيح
- [ ] **تم تعيين JWT_SECRET** و JWT_REFRESH_SECRET
- [ ] **تم تعيين NODE_ENV=production**
- [ ] **تم اختبار الاتصال** بقاعدة البيانات
- [ ] **تم تشغيل النظام** بنجاح
- [ ] **تم اختبار APIs** الأساسية
- [ ] **تم إعداد النسخ الاحتياطية** (اختياري)
- [ ] **تم إعداد المراقبة** (اختياري)

---

## 🎉 **النظام جاهز مع DB_URL!**

الآن يمكن للنظام الاتصال بأي قاعدة بيانات مستضافة باستخدام DB_URL، مما يجعل النشر أسهل وأكثر مرونة على جميع مقدمي الخدمة السحابية.

**🚀 استمتع بنشر سهل ومرن لنظام الحصان الذهبي!**
