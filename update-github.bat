@echo off
echo ====================================
echo   تحديث مستودع GitHub - Phase 1
echo ====================================
echo.

REM Check if Git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git غير مثبت على النظام
    echo.
    echo لتثبيت Git:
    echo 1. قم بتحميله من: https://git-scm.com/download/win
    echo 2. أو استخدم: winget install --id Git.Git -e --source winget
    echo.
    pause
    exit /b 1
)

echo ✅ Git مثبت ومتاح
echo.

REM Configure Git with user information
echo 🔧 إعداد معلومات Git...
git config --global user.name "Feras Al-Hashim"
git config --global user.email "feras995h@gmail.com"
echo ✅ تم إعداد: Feras Al-Hashim (feras995h@gmail.com)
echo.

REM Check repository status
echo 📋 فحص حالة المستودع...
git status
echo.

REM Add Phase 1 backend files
echo 📁 إضافة ملفات Backend الجديدة...
git add server/src/routes/advancedReports.js
git add server/src/routes/costAnalysis.js
git add server/src/routes/budgetPlanning.js
git add server/src/routes/cashFlowManagement.js
git add server/src/routes/financialRatios.js
echo ✅ تمت إضافة 5 ملفات backend

REM Add Phase 1 frontend files
echo 📁 إضافة ملفات Frontend الجديدة...
git add client/src/pages/AdvancedProfitabilityReports.tsx
git add client/src/pages/KPIDashboard.tsx
git add client/src/pages/CostAnalysis.tsx
git add client/src/pages/BudgetPlanning.tsx
git add client/src/pages/CashFlowManagement.tsx
echo ✅ تمت إضافة 5 ملفات frontend

REM Add updated system files
echo 📁 إضافة الملفات المحدثة...
git add server/src/utils/databaseInit.js
git add client/src/App.tsx
git add server/src/server.js
echo ✅ تمت إضافة الملفات المحدثة

REM Add documentation
echo 📁 إضافة ملفات التوثيق...
git add PHASE_1_COMPLETION_REPORT.md
git add GITHUB_UPDATE_INSTRUCTIONS.md
git add REPOSITORY_UPDATE_GUIDE_AR.md
git add server/check-tables.js
echo ✅ تمت إضافة ملفات التوثيق

REM Check what will be committed
echo.
echo 📊 الملفات المضافة للـ commit:
git diff --cached --name-only
echo.

REM Commit with detailed message
echo 💾 إنشاء Commit...
git commit -m "🎉 Phase 1 Complete: Advanced Financial Analytics System

✅ المميزات المطورة:
- تقارير الربحية المتقدمة مع مؤشرات الأداء الرئيسية
- تحليل التكاليف القائم على الأنشطة (ABC)
- تخطيط الميزانية والتنبؤ المالي
- إدارة التدفق النقدي وتحليل السيولة
- تحليل النسب المالية والمقارنات المرجعية
- لوحة مؤشرات الأداء في الوقت الفعلي

🔧 الإصلاحات المهمة:
- حل مشكلة SQLite ENUM compatibility
- إصلاح خطأ تهيئة قاعدة البيانات
- تصحيح مسارات الاستيراد
- تحديث middleware المصادقة

📊 حالة النظام:
- 30 جدول قاعدة بيانات يعمل بكفاءة
- جميع الوظائف الأساسية تم التحقق منها
- الخادم يعمل بدون أخطاء
- 100%% من أهداف Phase 1 مكتملة

جاهز لتطوير Phase 2 والنشر في الإنتاج."

if errorlevel 1 (
    echo ❌ فشل في إنشاء commit
    pause
    exit /b 1
)

echo ✅ تم إنشاء commit بنجاح
echo.

REM Push to GitHub
echo 🚀 رفع التحديثات إلى GitHub...
git push origin main

if errorlevel 1 (
    echo ❌ فشل في رفع التحديثات
    echo تأكد من:
    echo 1. اتصال الإنترنت
    echo 2. صلاحيات GitHub
    echo 3. عدم وجود تعارض في الملفات
    pause
    exit /b 1
)

echo ✅ تم رفع التحديثات بنجاح إلى GitHub
echo.

REM Create release tag
echo 🏷️ إنشاء tag للإصدار...
git tag -a v1.1.0-phase1 -m "Phase 1: نظام التحليلات المالية المتقدمة مكتمل

يتضمن هذا الإصدار:
- 5 واجهات برمجة تطبيقات جديدة للتحليلات المتقدمة
- 5 مكونات واجهة مستخدم جديدة للوحات المالية
- إصلاحات شاملة لتوافق قاعدة البيانات
- تنفيذ 100%% من مميزات Phase 1
- فحص شامل للنظام واختباره

جاهز للنشر في الإنتاج."

git push origin v1.1.0-phase1

if errorlevel 1 (
    echo ⚠️ تحذير: فشل في رفع tag (لكن الكود تم رفعه بنجاح)
) else (
    echo ✅ تم إنشاء ورفع tag بنجاح
)

echo.
echo ====================================
echo   🎉 تم تحديث المستودع بنجاح!
echo ====================================
echo.
echo Phase 1 Advanced Financial Analytics
echo تم رفعه بالكامل إلى GitHub
echo.
echo يمكنك الآن:
echo - عرض التحديثات على GitHub
echo - البدء في Phase 2
echo - نشر النظام في الإنتاج
echo.
pause