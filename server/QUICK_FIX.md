# إصلاح سريع لأخطاء 500

## المشكلة
الأخطاء التالية:
- ❌ `/api/financial/summary` - 500
- ❌ `/api/accounting-periods/current` - 500  
- ❌ `/api/sales/summary` - 500

## السبب
جدول `accounting_periods` لا يطابق AccountingPeriod Model

## الحل السريع

### 1. إصلاح accounting_periods
```bash
node fix-accounting-periods.js
```

### 2. التحقق من قاعدة البيانات
```bash
node verify-database.js
```

### 3. إعادة تشغيل السيرفر
```bash
# أوقف السيرفر (Ctrl+C)
npm start
```

## ملاحظة
بعد تشغيل fix-accounting-periods.js، ستحتاج لإنشاء فترة محاسبية أولية عبر API أو يدوياً.

---

## إنشاء فترة محاسبية يدوياً (اختياري)

```sql
INSERT INTO accounting_periods (
  id, year, month, status, 
  "startDate", "endDate",
  "createdAt", "updatedAt"
) VALUES (
  uuid_generate_v4(),
  2025,
  10,
  'open',
  '2025-10-01',
  '2025-10-31',
  NOW(),
  NOW()
);
```

أو عبر سكريبت:

```javascript
// في node console أو سكريبت
import { AccountingPeriod } from './src/models/index.js';

await AccountingPeriod.create({
  year: 2025,
  month: 10,
  status: 'open',
  startDate: '2025-10-01',
  endDate: '2025-10-31'
});
```
