# حل مشاكل استخدام الذاكرة العالي

## المشكلة الحالية

استخدام الذاكرة يصل إلى **90-94%** بشكل مستمر، مما يسبب:
- بطء في الأداء
- تحذيرات متكررة في السجلات
- احتمال توقف السيرفر (OOM - Out of Memory)

## الأسباب المكتشفة

### 1. خدمة المراقبة (Monitoring Service)
الخدمة تخزن كل الطلبات والأخطاء في الذاكرة بدون حدود.

### 2. عدم تنظيف الذاكرة
لا يوجد Garbage Collection يدوي أو تنظيف دوري.

### 3. WebSocket Connections
اتصالات WebSocket قد تبقى مفتوحة بدون إغلاق.

### 4. Cache Service
التخزين المؤقت بدون حدود قصوى.

---

## الحلول الفورية

### الحل 1: تحديد حجم الذاكرة عند التشغيل

**في `package.json` - قسم scripts**:

```json
{
  "scripts": {
    "start": "NODE_OPTIONS='--max-old-space-size=512' node src/server.js",
    "dev": "NODE_OPTIONS='--max-old-space-size=512' nodemon src/server.js"
  }
}
```

**أو في `.env`**:
```bash
NODE_OPTIONS=--max-old-space-size=512
```

**الشرح**:
- `512` = 512 MB (يمكن زيادتها حسب الحاجة)
- للخوادم الصغيرة: 256-512 MB
- للخوادم المتوسطة: 1024 MB
- للخوادم الكبيرة: 2048 MB

---

### الحل 2: تحسين Monitoring Service

**ملف: `server/src/utils/monitoringManager.js`**

أضف حدود للبيانات المخزنة:

```javascript
class MonitoringManager {
  constructor() {
    this.metrics = {
      requests: [],
      errors: [],
      // ... بقية الخصائص
    };
    
    // ✅ إضافة حدود
    this.MAX_STORED_REQUESTS = 100;  // فقط آخر 100 طلب
    this.MAX_STORED_ERRORS = 50;     // فقط آخر 50 خطأ
    
    // تنظيف دوري كل 5 دقائق
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }
  
  cleanup() {
    // حذف الطلبات القديمة
    if (this.metrics.requests.length > this.MAX_STORED_REQUESTS) {
      this.metrics.requests = this.metrics.requests.slice(-this.MAX_STORED_REQUESTS);
    }
    
    // حذف الأخطاء القديمة
    if (this.metrics.errors.length > this.MAX_STORED_ERRORS) {
      this.metrics.errors = this.metrics.errors.slice(-this.MAX_STORED_ERRORS);
    }
    
    // تشغيل Garbage Collector يدوياً (اختياري)
    if (global.gc) {
      global.gc();
    }
  }
}
```

---

### الحل 3: تحسين Cache Service

**ملف: `server/src/services/cacheService.js`** (إذا كنت تستخدم ذاكرة بدلاً من Redis)

```javascript
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.MAX_CACHE_SIZE = 1000; // حد أقصى 1000 عنصر
    this.MAX_MEMORY_MB = 50;    // حد أقصى 50 MB
  }
  
  set(key, value, ttl = 3600) {
    // فحص الحد الأقصى
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // حذف أقدم عنصر
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      expiry: Date.now() + (ttl * 1000)
    });
  }
  
  // تنظيف العناصر منتهية الصلاحية
  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.cache.entries()) {
      if (data.expiry < now) {
        this.cache.delete(key);
      }
    }
  }
}
```

---

### الحل 4: إغلاق الاتصالات بشكل صحيح

**ملف: `server/src/server.js`**

تأكد من وجود:

```javascript
// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  
  // 1. إيقاف قبول طلبات جديدة
  server.close(() => {
    console.log('✅ HTTP server closed');
  });
  
  // 2. إغلاق اتصالات WebSocket
  if (webSocketService) {
    await webSocketService.close();
    console.log('✅ WebSocket connections closed');
  }
  
  // 3. إغلاق قاعدة البيانات
  if (sequelize) {
    await sequelize.close();
    console.log('✅ Database connections closed');
  }
  
  // 4. إغلاق Cache/Redis
  if (cacheService) {
    await cacheService.disconnect();
    console.log('✅ Cache disconnected');
  }
  
  // 5. تشغيل Garbage Collector
  if (global.gc) {
    global.gc();
    console.log('✅ Garbage collection triggered');
  }
  
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

---

### الحل 5: تقليل Health Checks

**ملف: `server/src/utils/monitoringManager.js`**

```javascript
// قلل تكرار Health Checks من كل 30 ثانية إلى كل 5 دقائق
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 دقائق بدلاً من 30 ثانية

setInterval(() => {
  this.performHealthCheck();
}, HEALTH_CHECK_INTERVAL);
```

---

### الحل 6: استخدام Streams بدلاً من تحميل كل شيء في الذاكرة

**للتقارير الكبيرة والملفات**:

```javascript
// ❌ سيء - تحميل كل البيانات في الذاكرة
const allRecords = await Model.findAll();
res.json(allRecords);

// ✅ جيد - استخدام Pagination
const records = await Model.findAll({
  limit: 100,
  offset: page * 100
});
res.json(records);

// ✅ أفضل - استخدام Streams للملفات الكبيرة
const stream = Model.sequelize.query('SELECT * FROM table', {
  type: QueryTypes.SELECT,
  raw: true
});
```

---

## خطة التطبيق السريعة

### المرحلة 1: فوري (5 دقائق) ⚡

```bash
# 1. إضافة حد للذاكرة
echo "NODE_OPTIONS=--max-old-space-size=512" >> .env

# 2. إعادة تشغيل السيرفر
cd server
npm restart
```

### المرحلة 2: قصيرة المدى (30 دقيقة) 📅

1. ✅ تحديث `monitoringManager.js` - إضافة cleanup()
2. ✅ تحديث `cacheService.js` - إضافة حدود
3. ✅ تحسين graceful shutdown
4. ✅ تقليل تكرار health checks

### المرحلة 3: متوسطة المدى (يوم واحد) 📅

1. ✅ إضافة memory profiling
2. ✅ البحث عن memory leaks باستخدام:
   ```bash
   node --inspect src/server.js
   # ثم افتح chrome://inspect في المتصفح
   ```
3. ✅ تحويل استعلامات كبيرة لـ Streams/Pagination

---

## مراقبة استخدام الذاكرة

### 1. عند التشغيل

```bash
# تشغيل مع memory profiling
node --inspect --max-old-space-size=512 src/server.js

# أو مع garbage collection logs
node --expose-gc --max-old-space-size=512 src/server.js
```

### 2. أثناء التشغيل

**إضافة endpoint للمراقبة**:

```javascript
// في server.js
app.get('/api/health/memory', (req, res) => {
  const usage = process.memoryUsage();
  
  res.json({
    memory: {
      rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(usage.external / 1024 / 1024)} MB`,
      usagePercent: `${Math.round((usage.heapUsed / usage.heapTotal) * 100)}%`
    },
    timestamp: new Date().toISOString()
  });
});
```

### 3. تنبيهات تلقائية

```javascript
// مراقبة الذاكرة كل دقيقة
setInterval(() => {
  const usage = process.memoryUsage();
  const usagePercent = (usage.heapUsed / usage.heapTotal) * 100;
  
  if (usagePercent > 90) {
    console.warn('⚠️ استخدام ذاكرة عالي:', usagePercent.toFixed(2) + '%');
    
    // تنظيف فوري
    if (global.gc) {
      global.gc();
    }
  }
}, 60000); // كل دقيقة
```

---

## أدوات التحليل

### 1. Chrome DevTools

```bash
# تشغيل مع inspector
node --inspect src/server.js

# افتح في المتصفح
chrome://inspect
```

**يمكنك**:
- أخذ Heap Snapshot
- مراقبة Memory Timeline
- اكتشاف Memory Leaks

### 2. clinic.js

```bash
# تثبيت
npm install -g clinic

# تشغيل مع memory profiling
clinic doctor -- node src/server.js

# تحليل النتائج
# سيتم إنشاء تقرير HTML تلقائياً
```

### 3. node-memwatch

```bash
npm install @airbnb/node-memwatch

# في الكود
import memwatch from '@airbnb/node-memwatch';

memwatch.on('leak', (info) => {
  console.error('Memory leak detected!', info);
});

memwatch.on('stats', (stats) => {
  console.log('Memory stats:', stats);
});
```

---

## النتائج المتوقعة

بعد تطبيق الحلول:

| المؤشر | قبل | بعد | التحسن |
|--------|-----|-----|--------|
| استخدام الذاكرة | 90-94% | 50-60% | ✅ 35% |
| عدد التحذيرات | ~120/ساعة | ~5/ساعة | ✅ 96% |
| استقرار النظام | منخفض | عالي | ✅ 100% |
| سرعة الاستجابة | بطيء | سريع | ✅ 2x |

---

## ملخص الإجراءات

### ✅ يجب عمله فوراً:
1. [ ] تحديد حد الذاكرة (`NODE_OPTIONS`)
2. [ ] تقليل تكرار Health Checks
3. [ ] إضافة cleanup للـ Monitoring Service
4. [ ] تحسين Graceful Shutdown

### ⚠️ يجب عمله قريباً:
1. [ ] إضافة حدود للـ Cache
2. [ ] تحويل الاستعلامات الكبيرة لـ Pagination
3. [ ] مراقبة الذاكرة بشكل دوري
4. [ ] البحث عن Memory Leaks

### 📅 يمكن عمله لاحقاً:
1. [ ] استخدام Redis بدلاً من Memory Cache
2. [ ] تحسين WebSocket Connection Management
3. [ ] إضافة Monitoring Dashboard
4. [ ] استخدام PM2 أو Cluster Mode

---

## مراجع مفيدة

- [Node.js Memory Management](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Finding Memory Leaks](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [Clinic.js Documentation](https://clinicjs.org/documentation/)

---

**تم إعداده**: 2025-10-07  
**الحالة**: جاهز للتطبيق

