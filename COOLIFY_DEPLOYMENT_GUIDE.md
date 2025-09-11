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

# قاعدة البيانات
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

#### **1. خطأ في بناء التطبيق:**
```bash
# تحقق من Build Logs في Coolify
# تأكد من وجود package.json في الجذر
# تأكد من صحة Build Commands
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

### **مقارنة مع البدائل:**
```
Coolify vs Heroku:
✅ مجاني تماماً (Heroku مدفوع)
✅ تحكم كامل في الخادم
✅ لا توجد قيود على الموارد

Coolify vs Vercel:
✅ دعم قواعد البيانات
✅ تطبيقات full-stack
✅ لا توجد قيود على الوقت

Coolify vs Railway:
✅ مجاني تماماً
✅ استضافة ذاتية
✅ مرونة أكبر في الإعداد
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

## 📋 **مقارنة خيارات النشر**

| الميزة | Coolify | Railway | Heroku | DigitalOcean |
|--------|---------|---------|--------|--------------|
| **التكلفة** | مجاني + VPS | مجاني محدود | مدفوع | مدفوع |
| **سهولة الإعداد** | متوسط | سهل جداً | سهل | متقدم |
| **التحكم** | كامل | محدود | محدود | كامل |
| **قواعد البيانات** | مجانية | مدفوعة | مدفوعة | مدفوعة |
| **SSL** | مجاني | مجاني | مجاني | يدوي |
| **النسخ الاحتياطية** | تلقائية | مدفوعة | مدفوعة | يدوية |
| **المراقبة** | مدمجة | مدفوعة | مدفوعة | منفصلة |

### **التوصية:**
- **للمبتدئين**: Railway (الأسهل)
- **للميزانية المحدودة**: Coolify (الأوفر)
- **للمشاريع الكبيرة**: DigitalOcean (الأقوى)
- **للسرعة**: Heroku (الأسرع في البداية)

**🎯 Coolify هو الخيار الأمثل لنظام الحصان الذهبي** لأنه يوفر:
- تكلفة منخفضة جداً
- تحكم كامل في النظام
- مرونة في الإعداد والتخصيص
- دعم ممتاز لـ Node.js و PostgreSQL
