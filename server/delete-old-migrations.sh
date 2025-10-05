#!/bin/bash
# سكريبت لحذف ملفات الهجرة القديمة
# تم إنشاؤه تلقائياً في 2025-10-05T09:27:27.571Z

cd src/migrations

echo "🗑️  حذف ملفات الهجرة القديمة..."

echo "  حذف 001-initial-schema.js..."
rm -f "001-initial-schema.js"
echo "  حذف 001-updated-complete-schema.js..."
rm -f "001-updated-complete-schema.js"
echo "  حذف 002-add-missing-columns.js..."
rm -f "002-add-missing-columns.js"
echo "  حذف 002-add-performance-indexes.js..."
rm -f "002-add-performance-indexes.js"
echo "  حذف 002-additional-tables.js..."
rm -f "002-additional-tables.js"
echo "  حذف 002-create-notifications.js..."
rm -f "002-create-notifications.js"
echo "  حذف 003-add-user-columns.js..."
rm -f "003-add-user-columns.js"
echo "  حذف 004-add-account-columns.js..."
rm -f "004-add-account-columns.js"
echo "  حذف 005-add-account-balance-columns.js..."
rm -f "005-add-account-balance-columns.js"
echo "  حذف 006-add-account-description.js..."
rm -f "006-add-account-description.js"
echo "  حذف 007-create-shipments-table.js..."
rm -f "007-create-shipments-table.js"
echo "  حذف 008-add-performance-indexes.js..."
rm -f "008-add-performance-indexes.js"
echo "  حذف 009-add-customer-missing-fields.js..."
rm -f "009-add-customer-missing-fields.js"
echo "  حذف 018-create-new-tables-only.js..."
rm -f "018-create-new-tables-only.js"

echo ""
echo "✅ تم حذف 14 ملف"
echo "📊 الملفات المتبقية:"
ls -lh
