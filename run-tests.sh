#!/bin/bash

# سكريپت تشغيل الاختبارات الشاملة
# يمكن تشغيله على البيئة المحلية أو VPS

echo "🚀 بدء الاختبار الشامل للنظام..."
echo "=================================="

# تحديد البيئة
ENVIRONMENT=${1:-local}

if [ "$ENVIRONMENT" = "vps" ]; then
    echo "🌐 اختبار البيئة: VPS (الإنتاج)"
    echo "🔗 الرابط: https://web.goldenhorse-ly.com"
elif [ "$ENVIRONMENT" = "local" ]; then
    echo "🏠 اختبار البيئة: المحلية"
    echo "🔗 الرابط: http://localhost:3001"
else
    echo "❌ بيئة غير صحيحة. استخدم: local أو vps"
    exit 1
fi

echo ""

# التحقق من وجود Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js غير مثبت"
    exit 1
fi

# التحقق من وجود ملف الاختبار
if [ ! -f "comprehensive-system-test.js" ]; then
    echo "❌ ملف الاختبار غير موجود: comprehensive-system-test.js"
    exit 1
fi

# تشغيل الاختبارات
echo "🧪 تشغيل الاختبارات..."
node comprehensive-system-test.js $ENVIRONMENT

# التحقق من نتيجة الاختبار
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ تم إكمال الاختبارات بنجاح"
    echo "📊 راجع النتائج أعلاه للتفاصيل"
else
    echo ""
    echo "❌ فشل في تشغيل الاختبارات"
    echo "🔍 راجع الأخطاء أعلاه"
    exit 1
fi

echo ""
echo "🎯 انتهى الاختبار"
echo "=================================="
