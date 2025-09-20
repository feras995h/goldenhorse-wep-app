# 🚀 نشر نظام الحصان الذهبي على Coolify
# Golden Horse Shipping System - Coolify Deployment

## 🎯 **نظرة سريعة**

نظام الحصان الذهبي للشحن جاهز للنشر على **Coolify** - أفضل بديل مفتوح المصدر لـ Heroku.

### **معلومات المشروع:**
- **GitHub Repository**: https://github.com/feras995h/goldenhorse-wep-app.git
- **بيانات الدخول**: admin / admin123
- **التقنيات**: Node.js + React + PostgreSQL

---

## ✅ **لماذا Coolify؟**

### **المميزات الرئيسية:**
- 🆓 **مجاني تماماً** (فقط تكلفة VPS)
- 🔧 **تحكم كامل** في الخادم والبيانات
- 🔒 **SSL مجاني** ومتجدد تلقائياً
- 💾 **نسخ احتياطية تلقائية** لقواعد البيانات
- 🖥️ **واجهة سهلة** وحديثة
- 🔄 **نشر تلقائي** من GitHub
- 📊 **مراقبة متقدمة** مدمجة

### **التكلفة:**
- **Coolify**: $5-10/شهر (VPS فقط)
- **البدائل**: $20-50+/شهر
- **الوفر السنوي**: $180-480+

---

## 🏗️ **خطوات النشر السريع**

### **1. إنشاء VPS مع Coolify:**
```
1. سجل دخول إلى Hostinger
2. اذهب إلى VPS → إنشاء VPS جديد
3. اختر "Ubuntu 24.04 with Coolify"
4. اختر المواصفات (2GB RAM على الأقل)
5. أكمل الطلب
```

### **2. الوصول إلى Coolify:**
```
http://YOUR_VPS_IP:3000
```

### **3. إعداد قاعدة البيانات:**
```
1. أنشئ مشروع جديد: "Golden Horse Shipping"
2. أضف PostgreSQL database
3. احصل على DB_URL
```

### **4. نشر التطبيق:**
```
1. أضف Application من GitHub
2. Repository: https://github.com/feras995h/goldenhorse-wep-app.git
3. أضف متغيرات البيئة المطلوبة
4. انشر!
```

---

## ⚙️ **متغيرات البيئة المطلوبة**

```bash
NODE_ENV=production
PORT=5001
DB_URL=postgresql://username:password@localhost:5432/database_name
JWT_SECRET=your_very_secure_jwt_secret_minimum_32_characters
JWT_REFRESH_SECRET=your_very_secure_jwt_refresh_secret_minimum_32_characters
CORS_ORIGIN=https://your-domain.com
```

---

## 📚 **الدليل الشامل**

للحصول على تعليمات مفصلة خطوة بخطوة:

### 📖 **[دليل Coolify الشامل](COOLIFY_DEPLOYMENT_GUIDE.md)**

يتضمن:
- ✅ إعداد VPS مع Coolify
- ✅ إنشاء قاعدة البيانات
- ✅ نشر التطبيق
- ✅ إعداد النطاق والSSL
- ✅ المراقبة والنسخ الاحتياطية
- ✅ استكشاف الأخطاء وحلها

---

## 🔧 **الدعم والمساعدة**

### **مشاكل شائعة:**
- **خطأ في البناء**: تحقق من Build Logs
- **مشكلة قاعدة البيانات**: تأكد من DB_URL
- **خطأ متغيرات البيئة**: تحقق من Environment Variables

### **موارد مفيدة:**
- [Coolify Documentation](https://coolify.io/docs)
- [Hostinger VPS Guide](https://support.hostinger.com/en/articles/9615197)
- [GitHub Repository](https://github.com/feras995h/goldenhorse-wep-app)

---

## 🎉 **النظام جاهز!**

بعد اتباع هذه الخطوات، ستحصل على:

- ✅ **نظام شحن متكامل** يعمل على الإنترنت
- ✅ **قاعدة بيانات آمنة** مع نسخ احتياطية
- ✅ **شهادة SSL مجانية** ومتجددة
- ✅ **نشر تلقائي** من GitHub
- ✅ **مراقبة متقدمة** للأداء
- ✅ **تكلفة منخفضة** جداً

**🚀 مبروك! نظام الحصان الذهبي جاهز للعمل مع Coolify!**

---

## 📞 **تواصل معنا**

لأي استفسارات أو مساعدة إضافية، يمكنك:
- فتح Issue في GitHub
- مراجعة الدليل الشامل
- التواصل مع مجتمع Coolify

**نتمنى لك تجربة ممتازة مع نظام الحصان الذهبي! 🐎✨**
