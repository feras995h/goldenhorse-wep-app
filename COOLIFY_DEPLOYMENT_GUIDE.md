# 🚀 دليل نشر نظام الحصان الذهبي على Coolify
# Golden Horse Shipping System - Coolify Deployment Guide

## 📋 **نظرة عامة على Coolify**

### **ما هو Coolify؟**
Coolify هو بديل مفتوح المصدر وقابل للاستضافة الذاتية لـ Heroku/Netlify/Vercel. يوفر لوحة تحكم حديثة لنشر وإدارة التطبيقات وقواعد البيانات بسهولة.

### **المميزات الرئيسية:**
- ✅ **مفتوح المصدر** ومجاني تماماً
- ✅ **دعم أي لغة برمجة** (Node.js, Python, PHP, إلخ)
- ✅ **نشر تلقائي** من Git (GitHub, GitLab, Bitbucket)
- ✅ **شهادات SSL مجانية** تلقائياً
- ✅ **قواعد بيانات متعددة** (PostgreSQL, MySQL, Redis)
- ✅ **نسخ احتياطية تلقائية** لقواعد البيانات
- ✅ **مراقبة وإشعارات** متقدمة
- ✅ **واجهة ويب سهلة** الاستخدام

---

## 🏗️ **إعداد Coolify على Hostinger VPS**

### **الخطوة 1: إنشاء VPS مع Coolify**

#### **1. اختيار القالب:**
```
1. سجل دخول إلى Hostinger
2. اذهب إلى VPS → إنشاء VPS جديد
3. اختر "Ubuntu 24.04 with Coolify" من القوالب
4. اختر المواصفات المناسبة (2GB RAM على الأقل)
5. اختر الموقع الجغرافي
6. أكمل الطلب
```

#### **2. الوصول إلى Coolify:**
```bash
# بعد إنشاء VPS، اذهب إلى:
http://YOUR_VPS_IP:3000

# مثال:
http://123.456.789.012:3000
```

### **الخطوة 2: الإعداد الأولي**

#### **1. إنشاء حساب المدير:**
```
- اسم المستخدم: admin
- البريد الإلكتروني: your-email@domain.com
- كلمة المرور: كلمة مرور قوية
```

#### **2. إعداد الخادم:**
```
- اختر "localhost" إذا كان هذا خادمك الوحيد
- سيتم نشر التطبيقات على نفس VPS
```

---

## 🗄️ **إعداد قاعدة البيانات PostgreSQL**

### **الخطوة 1: إنشاء قاعدة بيانات**

#### **1. في لوحة تحكم Coolify:**
```
1. اذهب إلى Projects → + Add
2. أنشئ مشروع جديد: "Golden Horse Shipping"
3. اذهب إلى Production Environment
4. اضغط + Add New Resource
5. اختر "Database" → "PostgreSQL"
```

#### **2. إعدادات قاعدة البيانات:**
```
Database Name: golden_horse_production
Username: golden_horse_user
Password: [كلمة مرور قوية]
Port: 5432 (افتراضي)
```

### **الخطوة 2: الحصول على DB_URL**

#### **بعد إنشاء قاعدة البيانات:**
```bash
# ستحصل على DB_URL بهذا التنسيق:
postgresql://golden_horse_user:password@localhost:5432/golden_horse_production

# أو يمكنك العثور عليه في:
Database → Environment Variables → DATABASE_URL
```

---

## 🚀 **نشر تطبيق الحصان الذهبي**

### **الخطوة 1: إعداد التطبيق**

#### **1. إضافة تطبيق جديد:**
```
1. في نفس المشروع، اضغط + Add New Resource
2. اختر "Application"
3. اختر "Public Repository"
4. أدخل رابط GitHub: https://github.com/feras995h/goldenhorse-wep-app.git
5. اختر Branch: main
```

#### **2. إعدادات التطبيق:**
```
Application Name: golden-horse-shipping
Build Pack: Node.js
Port: 5001
Root Directory: /
```

### **الخطوة 2: متغيرات البيئة**

#### **إضافة متغيرات البيئة المطلوبة:**
```bash
# في Application → Environment Variables:

NODE_ENV=production
PORT=5001

# قاعدة البيانات (يدعم النظام كلا المتغيرين)
DATABASE_URL=postgresql://golden_horse_user:your_password@localhost:5432/golden_horse_production
# أو
DB_URL=postgresql://golden_horse_user:your_password@localhost:5432/golden_horse_production

# JWT Security
JWT_SECRET=your_very_secure_jwt_secret_minimum_32_characters_here
JWT_REFRESH_SECRET=your_very_secure_jwt_refresh_secret_minimum_32_characters_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS والأمان
CORS_ORIGIN=https://your-domain.com
TRUST_PROXY=1

# اختياري - إعدادات إضافية
COMPANY_NAME=شركة الحصان الذهبي للشحن
COMPANY_NAME_EN=Golden Horse Shipping
DEFAULT_CURRENCY=LYD
```

### **⚠️ حل مشاكل البيئة والقاعدة:**

#### **1. مشكلة "Database configuration not found for environment: =production":**
```bash
# السبب: NODE_ENV يحتوي على علامة = إضافية
# الحل: تأكد من تعيين NODE_ENV بدون علامات إضافية

# في Coolify → Application → Environment Variables:
NODE_ENV=production  # ✅ صحيح
# وليس:
NODE_ENV==production  # ❌ خطأ - علامة = إضافية
```

#### **2. مشكلة "Cannot read properties of null (reading 'replace')":**
```bash
# السبب: DB_URL فارغ أو بصيغة خاطئة
# الحل:

1. تحقق من DB_URL في Coolify:
   - اذهب إلى Database → PostgreSQL
   - انسخ "Database URL" الكامل
   - تأكد من أنه يبدأ بـ postgresql://

2. في Application → Environment Variables:
   # يمكنك استخدام أي من هذين المتغيرين:
   DATABASE_URL=postgresql://username:password@host:port/database
   # أو
   DB_URL=postgresql://username:password@host:port/database

   # مثال صحيح:
   DATABASE_URL=postgresql://golden_horse:mypassword@localhost:5432/golden_horse_db

   # تجنب هذه الأخطاء:
   DB_URL=                          # ❌ فارغ
   DB_URL=localhost:5432/database   # ❌ بدون بروتوكول
   DB_URL=postgres://...            # ❌ يجب أن يكون postgresql://

3. أو استخدم المتغيرات المنفصلة:
   DB_DIALECT=postgres
   DB_HOST=your-postgres-host
   DB_PORT=5432
   DB_NAME=your-database-name
   DB_USERNAME=your-username
   DB_PASSWORD=your-password
   DB_SSL=true
```

#### **التحقق من الإعدادات:**
```bash
# في Application → Logs، يجب أن ترى:
🔍 Environment: "production" (original: "production")  # ✅ صحيح
🔗 Using database URL connection
🚀 Server running on port 5001

# إذا رأيت:
� Environment: "=production" (original: "=production")  # ❌ خطأ
❌ Database configuration not found for environment: =production

# الحل:
1. تحقق من NODE_ENV في Environment Variables
2. تأكد من عدم وجود علامات = إضافية
3. أعد النشر بعد التصحيح
```

#### **3. مشكلة "Cannot read properties of null (reading 'replace')" في Sequelize:**
```bash
# السبب: DB_URL بصيغة خاطئة أو فارغ
# الأعراض: الخطأ يحدث في sequelize.js:58

# التشخيص في Logs:
🔍 Database Configuration Debug:
  - DB_URL present: false          # ❌ DB_URL غير موجود
  - DB_URL length: 0               # ❌ DB_URL فارغ
  - DB_URL starts with: N/A       # ❌ لا يوجد بروتوكول

# الحل:
1. في Coolify → Database → PostgreSQL
2. انسخ "Database URL" الكامل
3. تأكد من الصيغة: postgresql://username:password@host:port/database
4. ألصقه في Application → Environment Variables → DB_URL
```

#### **متغيرات البيئة الصحيحة:**
```bash
# تأكد من هذه القيم في Coolify:
NODE_ENV=production                    # بدون علامات إضافية
DATABASE_URL=postgresql://...          # URL كامل صحيح (مُوصى به)
# أو
DB_URL=postgresql://...                # بديل مدعوم
JWT_SECRET=your-secret                 # مفتاح قوي
JWT_REFRESH_SECRET=your-refresh-secret
PORT=5001
```

### **الخطوة 3: إعداد النطاق**

#### **1. إضافة نطاق مخصص:**
```
1. في Application → Domains
2. اضغط + Add Domain
3. أدخل النطاق: your-domain.com
4. سيتم إنشاء شهادة SSL تلقائياً
```

#### **2. إعداد DNS:**
```
# في إعدادات النطاق، أضف:
Type: A Record
Name: @ (أو www)
Value: YOUR_VPS_IP
TTL: 300
```

---

## ⚙️ **إعدادات متقدمة**

### **Build Commands:**
```bash
# في Application → Build Settings:

Build Command: npm run build
Start Command: cd server && npm start
Install Command: npm install
```

### **إصلاح مشاكل البناء:**
إذا واجهت خطأ في البناء مثل "Command:: command not found"، اتبع هذه الخطوات:

#### **1. إعداد Build Pack يدوياً:**
```bash
# في Application → General → Build Pack:
اختر "Node.js" بدلاً من "Auto-detect"
```

#### **2. إعداد متغيرات البناء:**
```bash
# في Application → Environment Variables → Build:
NODE_VERSION=18
NPM_CONFIG_PRODUCTION=false
```

#### **3. إعداد Commands بشكل صحيح:**
```bash
# Install Command:
npm install

# Build Command:
npm run build

# Start Command:
cd server && npm start
```

#### **4. إعداد Root Directory:**
```bash
# في Application → General:
Root Directory: /
```

#### **5. استخدام الملفات المحسنة:**
النظام يتضمن ملفات محسنة للعمل مع Coolify:
```bash
# ملفات التحسين المتوفرة:
- nixpacks.toml: إعدادات Nixpacks للبناء
- .coolify.yml: إعدادات Coolify المخصصة
- Dockerfile: ملف Docker محسن
- package.json: مع postinstall script
```

#### **6. إعادة النشر:**
```bash
# بعد تطبيق الإعدادات:
1. اذهب إلى Application → Deployments
2. اضغط "Deploy"
3. راقب Build Logs للتأكد من نجاح البناء
```

### **Health Check:**
```bash
# في Application → Health Check:
Path: /api/health
Port: 5001
Interval: 30s
Timeout: 10s
Retries: 3
```

### **Resource Limits:**
```bash
# في Application → Resources:
CPU: 1 core
Memory: 1GB
Disk: 10GB
```

---

## 🔧 **استكشاف الأخطاء**

### **مشاكل شائعة وحلولها:**

#### **1. خطأ "Command:: command not found":**
```bash
# السبب: Coolify يولد Dockerfile خاطئ أحياناً
# الحل:
1. اذهب إلى Application → General
2. غيّر Build Pack من "Auto-detect" إلى "Node.js"
3. أعد النشر (Deploy)

# أو في Application → Build Settings:
Install Command: npm ci --only=production
Build Command: npm run build
Start Command: cd server && npm start
```

#### **2. خطأ في بناء التطبيق:**
```bash
# تحقق من Build Logs في Coolify
# تأكد من وجود package.json في الجذر
# تأكد من صحة Build Commands
# تأكد من Node.js version (18 أو أحدث)
```

#### **2. خطأ في الاتصال بقاعدة البيانات:**
```bash
# تحقق من DB_URL في Environment Variables
# تأكد من تشغيل PostgreSQL database
# تحقق من صحة بيانات الاتصال
```

#### **3. خطأ في متغيرات البيئة:**
```bash
# تأكد من إضافة جميع المتغيرات المطلوبة
# تحقق من عدم وجود مسافات إضافية
# أعد تشغيل التطبيق بعد تغيير المتغيرات
```

#### **4. مشاكل SSL/Domain:**
```bash
# تأكد من صحة إعدادات DNS
# انتظر انتشار DNS (قد يستغرق 24 ساعة)
# تحقق من Domain Settings في Coolify
```

---

## 📊 **مراقبة النظام**

### **1. مراقبة التطبيق:**
```
- Application → Logs: عرض سجلات التطبيق
- Application → Metrics: إحصائيات الأداء
- Application → Terminal: الوصول المباشر للخادم
```

### **2. مراقبة قاعدة البيانات:**
```
- Database → Logs: سجلات قاعدة البيانات
- Database → Backups: النسخ الاحتياطية
- Database → Metrics: استخدام الموارد
```

### **3. إعداد الإشعارات:**
```
1. اذهب إلى Settings → Notifications
2. أضف Discord/Telegram/Email
3. اختر أنواع الإشعارات المطلوبة
```

---

## 🔄 **النسخ الاحتياطية والاستعادة**

### **النسخ الاحتياطية التلقائية:**
```bash
# في Database → Backups:
1. اضغط + Add Backup
2. اختر التكرار: يومي/أسبوعي/شهري
3. اختر مكان التخزين: S3/Local
4. احفظ الإعدادات
```

### **استعادة النسخة الاحتياطية:**
```bash
# في Database → Backups:
1. اختر النسخة المطلوبة
2. اضغط "Restore"
3. أكد العملية
```

---

## 🎯 **خطوات النشر النهائية**

### **قائمة التحقق:**
- [ ] **VPS جاهز** مع Coolify مثبت
- [ ] **قاعدة بيانات PostgreSQL** تم إنشاؤها
- [ ] **DB_URL** تم الحصول عليه
- [ ] **التطبيق** تم ربطه بـ GitHub
- [ ] **متغيرات البيئة** تم إضافتها
- [ ] **النطاق** تم إعداده (اختياري)
- [ ] **SSL** يعمل بشكل صحيح
- [ ] **النسخ الاحتياطية** تم إعدادها
- [ ] **المراقبة** تم تفعيلها

### **اختبار النظام:**
```bash
# 1. تحقق من تشغيل التطبيق
https://your-domain.com

# 2. اختبر تسجيل الدخول
Username: admin
Password: admin123

# 3. تحقق من قاعدة البيانات
# تأكد من وجود البيانات الأساسية

# 4. اختبر APIs
https://your-domain.com/api/health
```

---

## 🎉 **مميزات Coolify للحصان الذهبي**

### **المميزات المتاحة:**
- ✅ **نشر تلقائي** عند كل push إلى GitHub
- ✅ **شهادات SSL مجانية** ومتجددة تلقائياً
- ✅ **نسخ احتياطية تلقائية** لقاعدة البيانات
- ✅ **مراقبة متقدمة** للأداء والموارد
- ✅ **إشعارات فورية** عند حدوث مشاكل
- ✅ **واجهة سهلة** لإدارة كل شيء
- ✅ **تكلفة منخفضة** مقارنة بالبدائل
- ✅ **تحكم كامل** في البيانات والخادم

### **مميزات إضافية لنظام الحصان الذهبي:**
```
✅ دعم كامل للغة العربية وRTL
✅ تكامل مثالي مع PostgreSQL
✅ نشر تلقائي من GitHub
✅ إدارة متقدمة للمستخدمين والأدوار
✅ نظام محاسبي متكامل
✅ تقارير مالية شاملة
✅ واجهة حديثة ومتجاوبة
✅ أمان متقدم مع JWT
```

---

## 🚀 **النظام جاهز مع Coolify!**

بهذا الدليل، يمكنك نشر نظام الحصان الذهبي للشحن على Coolify بسهولة تامة. Coolify يوفر بيئة مثالية للمشاريع الصغيرة والمتوسطة مع تحكم كامل وتكلفة منخفضة.

**🎯 الخطوات التالية:**
1. **أنشئ VPS** مع قالب Coolify من Hostinger
2. **اتبع هذا الدليل** خطوة بخطوة
3. **استمتع بنظام متكامل** وحديث للشحن

**💡 نصائح للنجاح:**
- استخدم كلمات مرور قوية
- فعّل النسخ الاحتياطية التلقائية
- راقب الأداء بانتظام
- حدّث النظام دورياً

**🚀 مبروك! نظام الحصان الذهبي جاهز للعمل مع Coolify!**

---

## 🎯 **لماذا Coolify مثالي لنظام الحصان الذهبي؟**

### **المميزات الرئيسية:**
- ✅ **تكلفة منخفضة جداً** - فقط تكلفة VPS (~$5-10/شهر)
- ✅ **تحكم كامل** في النظام والبيانات
- ✅ **مرونة في التخصيص** والإعداد
- ✅ **نسخ احتياطية مجانية** تلقائية
- ✅ **SSL مجاني** ومتجدد تلقائياً
- ✅ **مناسب للمشاريع طويلة المدى**
- ✅ **دعم ممتاز** لـ Node.js و PostgreSQL
- ✅ **واجهة عربية** مدعومة بالكامل

### **مقارنة التكلفة:**
- **Coolify**: $5-10/شهر (VPS فقط)
- **البدائل الأخرى**: $20-50+/شهر
- **الوفر السنوي**: $180-480+ سنوياً
