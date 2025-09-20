# تشخيص وإصلاح أخطاء VPS - النسخة المرفوعة

## 🚨 الأخطاء المكتشفة في VPS

### 1. **أخطاء الشعار (Logo Errors)**
```
api/settings/logo?t=1757878515163:1  Failed to load resource: net::ERR_NETWORK_CHANGED
api/settings/logo?t=1757878575157:1  Failed to load resource: net::ERR_INTERNET_DISCONNECTED
```

### 2. **خطأ الأرصدة الافتتاحية (Opening Balances)**
```
api/financial/opening-balances:1  Failed to load resource: the server responded with a status of 500 ()
OpeningBalanceEntry-JGtUjyGn.js:1 Error loading opening balances: F
```

### 3. **أخطاء إنشاء العملاء (Customer Creation)**
```
api/sales/customers:1  Failed to load resource: the server responded with a status of 400 ()
SalesDashboard-DG_YzkOK.js:6 Error creating customer: F
```

### 4. **مشاكل الاتصال بالإنترنت**
```
net::ERR_INTERNET_DISCONNECTED
net::ERR_NETWORK_CHANGED
```

---

## 🔍 تحليل الأسباب

### السبب الرئيسي: **عدم تطبيق التحديثات على VPS**
- الكود المحلي محدث ويعمل بشكل صحيح
- النسخة على VPS لا تحتوي على الإصلاحات الأخيرة
- قاعدة البيانات على VPS قد تكون مفقودة بعض الجداول/الأعمدة

### الأسباب الفرعية:
1. **API endpoints مفقودة** أو غير محدثة
2. **قاعدة البيانات غير متزامنة** مع التحديثات الأخيرة
3. **متغيرات البيئة** قد تكون غير صحيحة
4. **ملفات الشعار** مفقودة من مجلد uploads

---

## 🛠️ خطة الإصلاح الشاملة

### المرحلة الأولى: التحقق من حالة VPS

#### 1. **فحص حالة الخادم**
```bash
# SSH إلى VPS
ssh user@your-vps-ip

# فحص حالة التطبيق
pm2 status
# أو
docker ps

# فحص logs
pm2 logs
# أو
docker logs container-name
```

#### 2. **فحص قاعدة البيانات**
```bash
# الاتصال بقاعدة البيانات
psql $DATABASE_URL

# فحص الجداول الموجودة
\dt

# فحص جدول الحسابات
\d accounts

# فحص جدول العملاء
\d customers

# فحص جدول الإعدادات
\d settings
```

### المرحلة الثانية: تطبيق الإصلاحات

#### 3. **رفع الكود المحدث**
```bash
# في المجلد المحلي
git add .
git commit -m "Fix VPS errors - Updated APIs and database schema"
git push origin main

# في VPS (إذا كان يستخدم Git)
git pull origin main
npm install
```

#### 4. **تحديث قاعدة البيانات**
```sql
-- إضافة العمود المفقود isMonitored
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS isMonitored BOOLEAN DEFAULT false;

-- إضافة فهرس للأداء
CREATE INDEX IF NOT EXISTS idx_accounts_isMonitored ON accounts(isMonitored);

-- التأكد من وجود جدول العملاء
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE,
    name VARCHAR(200) NOT NULL,
    nameEn VARCHAR(200),
    type VARCHAR(20) DEFAULT 'individual',
    email VARCHAR(100),
    phone VARCHAR(50),
    address TEXT,
    taxNumber VARCHAR(50),
    creditLimit DECIMAL(15,2) DEFAULT 0,
    paymentTerms INTEGER DEFAULT 30,
    currency VARCHAR(3) DEFAULT 'LYD',
    contactPerson VARCHAR(100),
    isActive BOOLEAN DEFAULT true,
    accountId UUID REFERENCES accounts(id),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- التأكد من وجود جدول الإعدادات
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    type VARCHAR(20) DEFAULT 'string',
    description TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. **إصلاح مشكلة الشعار**
```bash
# إنشاء مجلد uploads إذا لم يكن موجود
mkdir -p /app/data/uploads
chmod 755 /app/data/uploads

# حذف إعدادات الشعار المكسورة من قاعدة البيانات
psql $DATABASE_URL -c "DELETE FROM settings WHERE key LIKE 'logo%';"
```

### المرحلة الثالثة: إعادة التشغيل والاختبار

#### 6. **إعادة تشغيل الخدمات**
```bash
# إذا كان يستخدم PM2
pm2 restart all

# إذا كان يستخدم Docker
docker-compose down
docker-compose up -d

# إذا كان يستخدم Coolify
# إعادة deploy من لوحة التحكم
```

#### 7. **اختبار APIs**
```bash
# اختبار صحة الخادم
curl https://your-domain.com/api/health

# اختبار API الحسابات
curl https://your-domain.com/api/financial/accounts

# اختبار API العملاء
curl https://your-domain.com/api/sales/customers

# اختبار API الإعدادات
curl https://your-domain.com/api/settings
```

---

## 🔧 سكريپتات الإصلاح السريع

### سكريپت إصلاح قاعدة البيانات
```sql
-- fix-vps-database.sql
-- إصلاح قاعدة البيانات على VPS

-- 1. إضافة الأعمدة المفقودة
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS isMonitored BOOLEAN DEFAULT false;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS freezeAccount BOOLEAN DEFAULT false;

-- 2. إنشاء الجداول المفقودة
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE,
    name VARCHAR(200) NOT NULL,
    nameEn VARCHAR(200),
    type VARCHAR(20) DEFAULT 'individual',
    email VARCHAR(100),
    phone VARCHAR(50),
    address TEXT,
    taxNumber VARCHAR(50),
    creditLimit DECIMAL(15,2) DEFAULT 0,
    paymentTerms INTEGER DEFAULT 30,
    currency VARCHAR(3) DEFAULT 'LYD',
    contactPerson VARCHAR(100),
    isActive BOOLEAN DEFAULT true,
    accountId UUID REFERENCES accounts(id),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    type VARCHAR(20) DEFAULT 'string',
    description TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_accounts_isMonitored ON accounts(isMonitored);
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(code);
CREATE INDEX IF NOT EXISTS idx_customers_isActive ON customers(isActive);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- 4. حذف إعدادات الشعار المكسورة
DELETE FROM settings WHERE key LIKE 'logo%';

-- 5. إضافة إعدادات افتراضية
INSERT INTO settings (key, value, type, description) VALUES 
('companyName', 'Golden Horse', 'string', 'Company name'),
('currency', 'LYD', 'string', 'Default currency'),
('lastUpdated', CURRENT_TIMESTAMP::text, 'string', 'Last system update')
ON CONFLICT (key) DO NOTHING;

COMMIT;
```

### سكريپت اختبار VPS
```javascript
// test-vps-apis.js
// اختبار APIs على VPS

const axios = require('axios');

const VPS_URL = 'https://your-domain.com'; // استبدل بالرابط الفعلي

async function testVPSAPIs() {
  console.log('🧪 اختبار APIs على VPS...\n');

  const tests = [
    { name: 'Health Check', url: '/api/health' },
    { name: 'Settings', url: '/api/settings' },
    { name: 'Accounts', url: '/api/financial/accounts' },
    { name: 'Customers', url: '/api/sales/customers' },
    { name: 'Opening Balances', url: '/api/financial/opening-balances' }
  ];

  for (const test of tests) {
    try {
      console.log(`🔍 اختبار ${test.name}...`);
      const response = await axios.get(`${VPS_URL}${test.url}`, {
        timeout: 10000,
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN_HERE' // إضافة token إذا مطلوب
        }
      });
      
      console.log(`✅ ${test.name}: نجح (${response.status})`);
    } catch (error) {
      console.log(`❌ ${test.name}: فشل (${error.response?.status || error.code})`);
      if (error.response?.data) {
        console.log(`   الخطأ: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
}

testVPSAPIs().catch(console.error);
```

---

## 📋 قائمة التحقق النهائية

### ✅ قبل الإصلاح:
- [ ] أخذ نسخة احتياطية من قاعدة البيانات
- [ ] التأكد من وجود صلاحيات SSH/Database
- [ ] التأكد من رابط VPS الصحيح

### ✅ أثناء الإصلاح:
- [ ] تطبيق تحديثات قاعدة البيانات
- [ ] رفع الكود المحدث
- [ ] إعادة تشغيل الخدمات
- [ ] اختبار APIs الأساسية

### ✅ بعد الإصلاح:
- [ ] اختبار تسجيل الدخول
- [ ] اختبار إنشاء حساب جديد
- [ ] اختبار إنشاء عميل جديد
- [ ] اختبار الأرصدة الافتتاحية
- [ ] اختبار رفع الشعار

---

## 🚀 الخطوات التالية

1. **تطبيق سكريپت إصلاح قاعدة البيانات**
2. **رفع الكود المحدث إلى VPS**
3. **إعادة تشغيل الخدمات**
4. **اختبار جميع الوظائف**
5. **مراقبة الأخطاء في logs**

**الهدف: حل جميع الأخطاء وجعل النسخة على VPS تعمل مثل النسخة المحلية تماماً** 🎯
