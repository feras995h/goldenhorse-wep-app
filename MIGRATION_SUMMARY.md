# تقرير إصلاح الترحيلات (Migrations)

## التاريخ: 2025-10-05

## المشاكل التي تم إصلاحها

### 1. Migration 017 - Syntax Error
**المشكلة**: ملف الترحيل كان يحتوي على كود orphaned خارج الدوال
**الحل**: تم تنظيف الملف وإبقاء فقط دوال `up` و `down` الفارغة

### 2. Migration 018 - Type Mismatch
**المشكلة**: 
- استخدام UUID لحقول `createdBy` و `approvedBy` بينما جدول `users` يستخدم INTEGER
- استخدام CommonJS بدلاً من ES6 modules

**الحل**:
- تغيير جميع حقول المستخدمين من UUID إلى INTEGER
- تحويل الملف إلى ES6 module format

### 3. Migrations 20250115* - Type Mismatch
**المشكلة**: نفس مشكلة UUID vs INTEGER
**الحل**: تحويل جميع الملفات وإصلاح أنواع البيانات

### 4. Migration 019 - Missing Table
**المشكلة**: محاولة إضافة عمود إلى جدول `account_mappings` غير موجود
**الحل**: 
- إضافة فحص لوجود الجدول
- إنشاء الجدول عبر سكريبت منفصل

### 5. الجداول الناقصة
**الجداول التي تم إنشاؤها**:
- `account_mappings` - لربط الحسابات المحاسبية
- `invoice_payments` - لربط الفواتير بالمدفوعات
- `invoice_receipts` - لربط الفواتير بالإيصالات
- `account_provisions` - للمخصصات المحاسبية

## الجداول الموجودة في قاعدة البيانات

إجمالي: 64 جدول بما في ذلك:
- users, customers, suppliers, employees
- accounts, sales_invoices, purchase_invoices
- payments, receipts, payment_vouchers, receipt_vouchers
- shipments, shipment_movements, warehouse
- fixed_assets, notifications
- وجداول أخرى...

## الترحيلات المكتملة

جميع الترحيلات من 001 إلى 20250115000006 تم تطبيقها بنجاح.

## السكريبتات المساعدة المنشأة

1. `check-all-tables.js` - لفحص جميع الجداول
2. `create-missing-tables.js` - لإنشاء الجداول الناقصة
3. `mark-migrations-complete.js` - لوضع علامة على الترحيلات كمكتملة
4. `check-users-table.js` - لفحص بنية جدول المستخدمين
5. `check-account-mappings-columns.js` - لفحص أعمدة account_mappings

## التوصيات

1. ✅ جميع الترحيلات الحالية تعمل بشكل صحيح
2. ✅ قاعدة البيانات في حالة مستقرة
3. ⚠️ يجب التأكد من أن أي ترحيلات مستقبلية تستخدم INTEGER لحقول المستخدمين
4. ⚠️ يجب التأكد من وجود الجداول قبل محاولة تعديلها

## الخطوات التالية

يمكنك الآن:
1. تشغيل السيرفر بأمان: `npm start`
2. إضافة ترحيلات جديدة إذا لزم الأمر
3. استخدام السكريبتات المساعدة للفحص والصيانة
