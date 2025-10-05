# حل أخطاء API 500

## المشكلة
عدة endpoints تعيد خطأ 500:
- `/api/sales/summary`
- `/api/sales/shipments/eta-metrics`
- `/api/financial/vouchers/receipts`
- `/api/financial/vouchers/payments`
- `/api/sales/shipments/top-delays`

## السبب الجذري

الخطأ الأساسي كان:
```
column "salesRevenueAccount" does not exist
```

هذا يعني أن جدول `account_mappings` كان ينقصه أعمدة كثيرة.

## الحل المطبق

### 1. إصلاح جدول account_mappings ✅
تم تشغيل: `fix-account-mappings-columns.js`

أضاف 13 عمود ناقص:
- salesRevenueAccount
- localCustomersAccount
- foreignCustomersAccount
- discountAccount
- shippingRevenueAccount
- handlingFeeAccount
- customsClearanceAccount
- insuranceAccount
- storageAccount
- isActive
- description
- createdBy
- updatedBy

### 2. فحص الجداول الأخرى ✅
تم تشغيل: `comprehensive-table-fix.js`

تأكد من وجود جميع الأعمدة المطلوبة في:
- receipt_vouchers
- payment_vouchers
- sales_invoices
- shipments

### 3. اختبار الاستعلامات ✅
تم تشغيل: `test-endpoints.js`

جميع الاستعلامات تعمل بنجاح!

## الخطوات التالية

### إعادة تشغيل السيرفر
```bash
npm start
```

السيرفر يجب أن يعمل الآن بدون أخطاء في تهيئة النظام المحاسبي.

### التحقق من الـ Endpoints
بعد إعادة تشغيل السيرفر، جرب الـ endpoints مرة أخرى:

1. **Sales Summary**: `GET /api/sales/summary`
2. **Receipt Vouchers**: `GET /api/financial/vouchers/receipts?limit=5`
3. **Payment Vouchers**: `GET /api/financial/vouchers/payments?limit=5`
4. **Shipments ETA**: `GET /api/sales/shipments/eta-metrics`
5. **Top Delays**: `GET /api/sales/shipments/top-delays?limit=10`

## ملاحظات مهمة

### إذا استمرت الأخطاء:

1. **تحقق من سجلات السيرفر**
   ```bash
   npm start
   ```
   ابحث عن رسائل الخطأ التفصيلية

2. **تحقق من Models**
   تأكد من أن جميع Models متطابقة مع بنية قاعدة البيانات

3. **تحقق من Routes**
   تأكد من أن جميع Routes تستخدم الأعمدة الصحيحة

### الأعمدة المهمة في account_mappings

يجب أن يحتوي الجدول على 27 عمود:
- id, createdAt, updatedAt, createdBy, updatedBy
- cashAccount, bankAccount
- salesAccount, salesRevenueAccount, salesTaxAccount
- shippingRevenueAccount, handlingFeeAccount
- accountsReceivableAccount, localCustomersAccount, foreignCustomersAccount
- purchasesAccount, accountsPayableAccount
- inventoryAccount, costOfGoodsSoldAccount
- revenueAccount, expenseAccount
- customsClearanceAccount, insuranceAccount, storageAccount
- discountAccount
- isActive, description

## التحقق النهائي

قم بتشغيل هذا السكريبت للتحقق من كل شيء:
```bash
node check-account-mappings-columns.js
```

يجب أن يظهر 27 عمود.

---

## الحالة الحالية

- ✅ جدول account_mappings: 27 عمود كامل
- ✅ جدول receipt_vouchers: جاهز
- ✅ جدول payment_vouchers: جاهز
- ✅ جدول sales_invoices: جاهز
- ✅ جدول shipments: جاهز
- ✅ جميع الاستعلامات تعمل

**السيرفر جاهز للعمل! 🚀**

أعد تشغيل السيرفر وجرب الـ endpoints مرة أخرى.
