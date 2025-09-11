# دليل النشر باستخدام GitHub
# GitHub Deployment Guide - Golden Horse Shipping System

## 📋 متطلبات النشر عبر GitHub

### 1. إعداد Repository على GitHub
```bash
# إنشاء repository جديد على GitHub
# ثم ربطه بالمشروع المحلي

git init
git add .
git commit -m "Initial commit: Golden Horse Shipping System"
git branch -M main
git remote add origin https://github.com/your-username/golden-horse-shipping.git
git push -u origin main
```

### 2. إعداد GitHub Secrets
في إعدادات Repository على GitHub، أضف المتغيرات التالية في `Settings > Secrets and variables > Actions`:

#### **متغيرات الخادم (VPS Secrets):**
```
VPS_HOST=your-server-ip-address
VPS_USERNAME=your-server-username
VPS_SSH_KEY=your-private-ssh-key
VPS_PORT=22
```

#### **متغيرات التطبيق:**
```
JWT_SECRET=your-very-secure-jwt-secret-key-minimum-32-characters
JWT_REFRESH_SECRET=your-very-secure-jwt-refresh-secret-key-minimum-32-characters
DB_URL=postgresql://username:password@host:port/database_name
APP_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

#### **متغيرات قاعدة البيانات (اختر إحدى الطريقتين):**

**الطريقة الأولى: استخدام DB_URL (مُوصى بها):**
```
DB_URL=postgresql://username:password@host:port/database_name
```

**الطريقة الثانية: متغيرات منفصلة:**
```
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=your-database-name
DB_USERNAME=your-database-username
DB_PASSWORD=your-database-password
```

#### **متغيرات اختيارية:**
```
USE_DOCKER=true  # إذا كنت تريد استخدام Docker
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## 🔧 إعداد الخادم (VPS)

### 1. تثبيت المتطلبات الأساسية
```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# تثبيت PM2
sudo npm install -g pm2

# تثبيت PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# تثبيت Nginx
sudo apt install nginx -y

# تثبيت Git
sudo apt install git -y
```

### 2. إعداد قاعدة البيانات
```bash
# الدخول إلى PostgreSQL
sudo -u postgres psql

# إنشاء قاعدة البيانات والمستخدم
CREATE DATABASE golden_horse_production;
CREATE USER golden_horse_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE golden_horse_production TO golden_horse_user;
\q
```

### 3. إعداد مجلدات المشروع
```bash
# إنشاء مجلد المشروع
sudo mkdir -p /var/www/golden-horse-shipping
sudo chown -R $USER:$USER /var/www/golden-horse-shipping

# إنشاء مجلدات السجلات والنسخ الاحتياطي
sudo mkdir -p /var/log/golden-horse
sudo mkdir -p /var/backups/golden-horse
sudo chown -R $USER:$USER /var/log/golden-horse
sudo chown -R $USER:$USER /var/backups/golden-horse
```

### 4. استنساخ المشروع
```bash
cd /var/www/golden-horse-shipping
git clone https://github.com/your-username/golden-horse-shipping.git .
```

### 5. إعداد متغيرات البيئة
```bash
cd server
cp .env.production.example .env

# تحرير ملف .env بالقيم الصحيحة
nano .env
```

### 6. تثبيت الاعتماديات والإعداد الأولي
```bash
# تثبيت اعتماديات الخادم
cd server
npm ci --only=production

# تثبيت اعتماديات العميل وبناؤه
cd ../client
npm ci --only=production
npm run build

# إعداد قاعدة البيانات
cd ../server
npm run setup-production
```

### 7. إعداد PM2
```bash
# تشغيل التطبيق مع PM2
pm2 start ecosystem.config.js --env production

# حفظ التكوين
pm2 save

# إعداد بدء تلقائي
pm2 startup
# اتبع التعليمات التي تظهر
```

## 🌐 إعداد Nginx

### 1. إنشاء ملف التكوين
```bash
sudo nano /etc/nginx/sites-available/golden-horse
```

### 2. إضافة التكوين
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
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Frontend (React App)
    location / {
        root /var/www/golden-horse-shipping/client/build;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
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
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # File uploads
    location /uploads {
        alias /var/www/golden-horse-shipping/server/uploads;
        expires 1y;
        add_header Cache-Control "public";
    }
}
```

### 3. تفعيل الموقع
```bash
# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/golden-horse /etc/nginx/sites-enabled/

# اختبار التكوين
sudo nginx -t

# إعادة تحميل Nginx
sudo systemctl reload nginx
```

## 🔒 إعداد SSL مع Let's Encrypt

```bash
# تثبيت Certbot
sudo apt install certbot python3-certbot-nginx -y

# الحصول على شهادة SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# اختبار التجديد التلقائي
sudo certbot renew --dry-run
```

## 🚀 عملية النشر التلقائي

### كيف يعمل النشر التلقائي:

1. **Push إلى GitHub**: عند رفع الكود إلى branch `main`
2. **GitHub Actions**: يتم تشغيل workflow تلقائياً
3. **الاختبارات**: تشغيل الاختبارات للتأكد من سلامة الكود
4. **البناء**: بناء التطبيق للإنتاج
5. **النشر**: رفع الكود إلى الخادم وإعادة تشغيل التطبيق

### مراحل النشر:

#### 1. **مرحلة الاختبار (Test Job)**
- تثبيت الاعتماديات
- تشغيل اختبارات الخادم
- تشغيل اختبارات العميل
- بناء التطبيق

#### 2. **مرحلة النشر (Deploy Job)**
- الاتصال بالخادم عبر SSH
- سحب آخر التحديثات من GitHub
- تثبيت الاعتماديات
- بناء التطبيق
- إعادة تشغيل الخدمات
- فحص صحة التطبيق

## 📊 مراقبة النشر

### عرض حالة التطبيق:
```bash
# حالة PM2
pm2 status

# سجلات التطبيق
pm2 logs golden-horse-api

# مراقبة الموارد
pm2 monit
```

### فحص صحة النظام:
```bash
# فحص حالة Nginx
sudo systemctl status nginx

# فحص حالة PostgreSQL
sudo systemctl status postgresql

# فحص الاتصال بقاعدة البيانات
cd /var/www/golden-horse-shipping/server
npm run db:test-connection
```

## 🔄 التحديثات اليدوية

إذا كنت تريد تحديث التطبيق يدوياً:

```bash
cd /var/www/golden-horse-shipping

# سحب آخر التحديثات
git pull origin main

# تحديث الاعتماديات
cd server && npm ci --only=production
cd ../client && npm ci --only=production && npm run build

# إعادة تشغيل التطبيق
pm2 restart golden-horse-api
```

## 🆘 استكشاف الأخطاء

### مشاكل شائعة:

1. **فشل النشر**: تحقق من GitHub Actions logs
2. **خطأ 502**: تأكد من تشغيل PM2
3. **مشاكل قاعدة البيانات**: تحقق من إعدادات .env
4. **مشاكل SSL**: تحقق من شهادة Let's Encrypt

### سجلات مفيدة:
```bash
# سجلات GitHub Actions: في واجهة GitHub
# سجلات PM2
pm2 logs

# سجلات Nginx
sudo tail -f /var/log/nginx/error.log

# سجلات النظام
journalctl -u nginx -f
```

## 📞 الدعم

للحصول على المساعدة:
1. تحقق من GitHub Issues
2. راجع سجلات الأخطاء
3. تأكد من إعدادات GitHub Secrets
4. تحقق من حالة الخادم والخدمات

---

**🚀 نظام النشر التلقائي جاهز! كل push إلى main سيؤدي إلى نشر تلقائي آمن ومراقب.**
