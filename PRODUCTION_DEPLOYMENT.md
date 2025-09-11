# دليل نشر النظام على السيرفر
# Golden Horse Shipping System - Production Deployment Guide

## 📋 متطلبات النشر

### متطلبات السيرفر:
- **Node.js**: الإصدار 18 أو أحدث
- **قاعدة البيانات**: PostgreSQL 13+ (مُوصى به) أو MySQL 8+ أو SQLite
- **الذاكرة**: 2GB RAM كحد أدنى، 4GB مُوصى به
- **التخزين**: 10GB مساحة فارغة كحد أدنى
- **نظام التشغيل**: Ubuntu 20.04+ أو CentOS 8+ أو Windows Server

### متطلبات الشبكة:
- **المنافذ**: 3000 (Frontend), 5001 (Backend)
- **HTTPS**: شهادة SSL (مُوصى به للإنتاج)
- **Firewall**: السماح للمنافذ المطلوبة

## 🚀 خطوات النشر

### 1. تحضير قاعدة البيانات للإنتاج

```bash
# الانتقال إلى مجلد الخادم
cd server

# تنظيف قاعدة البيانات من البيانات الوهمية
npm run clean-database

# إعداد البيانات الأساسية للإنتاج
npm run setup-production

# أو تشغيل الأمرين معاً
npm run prepare-production
```

### 2. تكوين متغيرات البيئة

إنشاء ملف `.env` في مجلد `server`:

```env
# Database Configuration
NODE_ENV=production
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=golden_horse_production
DB_USER=your_db_user
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5001
CORS_ORIGIN=https://yourdomain.com

# Email Configuration (اختياري)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_PATH=/var/backups/golden-horse
BACKUP_RETENTION_DAYS=30

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. تكوين قاعدة البيانات

#### PostgreSQL (مُوصى به):
```sql
-- إنشاء قاعدة البيانات
CREATE DATABASE golden_horse_production;

-- إنشاء مستخدم مخصص
CREATE USER golden_horse_user WITH PASSWORD 'secure_password';

-- منح الصلاحيات
GRANT ALL PRIVILEGES ON DATABASE golden_horse_production TO golden_horse_user;
```

#### MySQL:
```sql
-- إنشاء قاعدة البيانات
CREATE DATABASE golden_horse_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- إنشاء مستخدم مخصص
CREATE USER 'golden_horse_user'@'localhost' IDENTIFIED BY 'secure_password';

-- منح الصلاحيات
GRANT ALL PRIVILEGES ON golden_horse_production.* TO 'golden_horse_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. بناء التطبيق للإنتاج

```bash
# بناء الواجهة الأمامية
cd client
npm install
npm run build

# تثبيت اعتماديات الخادم
cd ../server
npm install --production
```

### 5. تشغيل النظام

#### باستخدام PM2 (مُوصى به):
```bash
# تثبيت PM2
npm install -g pm2

# تشغيل الخادم
pm2 start src/server.js --name "golden-horse-api"

# حفظ التكوين
pm2 save
pm2 startup
```

#### باستخدام systemd:
إنشاء ملف `/etc/systemd/system/golden-horse.service`:

```ini
[Unit]
Description=Golden Horse Shipping API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/your/app/server
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# تفعيل وتشغيل الخدمة
sudo systemctl enable golden-horse
sudo systemctl start golden-horse
```

### 6. إعداد Nginx (Reverse Proxy)

إنشاء ملف `/etc/nginx/sites-available/golden-horse`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # Frontend (React App)
    location / {
        root /path/to/your/app/client/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/golden-horse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔐 الأمان

### 1. تغيير كلمة مرور المدير
```
اسم المستخدم: admin
كلمة المرور الافتراضية: admin123
```

**⚠️ مهم جداً: قم بتغيير كلمة المرور فور تسجيل الدخول الأول!**

### 2. إعدادات الأمان الإضافية
- استخدم HTTPS دائماً في الإنتاج
- قم بتحديث النظام والاعتماديات بانتظام
- فعّل النسخ الاحتياطي التلقائي
- راقب سجلات النظام
- استخدم جدار حماية قوي

## 📊 المراقبة والصيانة

### مراقبة النظام:
```bash
# حالة الخدمة
pm2 status
pm2 logs golden-horse-api

# أو باستخدام systemd
sudo systemctl status golden-horse
sudo journalctl -u golden-horse -f
```

### النسخ الاحتياطي:
```bash
# نسخ احتياطي يدوي لقاعدة البيانات
pg_dump golden_horse_production > backup_$(date +%Y%m%d_%H%M%S).sql

# أو للـ MySQL
mysqldump -u golden_horse_user -p golden_horse_production > backup_$(date +%Y%m%d_%H%M%S).sql
```

### التحديثات:
```bash
# تحديث الكود
git pull origin main

# إعادة بناء الواجهة الأمامية
cd client && npm run build

# إعادة تشغيل الخادم
pm2 restart golden-horse-api
```

## 🆘 استكشاف الأخطاء

### مشاكل شائعة:
1. **خطأ في الاتصال بقاعدة البيانات**: تحقق من إعدادات `.env`
2. **خطأ 502 Bad Gateway**: تأكد من تشغيل الخادم على المنفذ الصحيح
3. **مشاكل الصلاحيات**: تأكد من صلاحيات المجلدات والملفات

### سجلات مفيدة:
```bash
# سجلات التطبيق
pm2 logs golden-horse-api

# سجلات Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# سجلات النظام
sudo journalctl -u golden-horse -f
```

## 📞 الدعم

للحصول على الدعم الفني، يرجى التواصل مع فريق التطوير مع تقديم:
- وصف المشكلة
- رسائل الخطأ
- سجلات النظام
- معلومات البيئة (نظام التشغيل، إصدار Node.js، إلخ)

---

**تم إعداد هذا الدليل لضمان نشر آمن وموثوق لنظام الحصان الذهبي للشحن**
