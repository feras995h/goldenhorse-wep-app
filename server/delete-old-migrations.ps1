# سكريبت لحذف ملفات الهجرة القديمة
# تم إنشاؤه تلقائياً في 2025-10-05T09:27:27.588Z

Set-Location src/migrations

Write-Host "🗑️  حذف ملفات الهجرة القديمة..." -ForegroundColor Yellow

Write-Host "  حذف 001-initial-schema.js..." -ForegroundColor Gray
Remove-Item -Path "001-initial-schema.js" -Force -ErrorAction SilentlyContinue
Write-Host "  حذف 001-updated-complete-schema.js..." -ForegroundColor Gray
Remove-Item -Path "001-updated-complete-schema.js" -Force -ErrorAction SilentlyContinue
Write-Host "  حذف 002-add-missing-columns.js..." -ForegroundColor Gray
Remove-Item -Path "002-add-missing-columns.js" -Force -ErrorAction SilentlyContinue
Write-Host "  حذف 002-add-performance-indexes.js..." -ForegroundColor Gray
Remove-Item -Path "002-add-performance-indexes.js" -Force -ErrorAction SilentlyContinue
Write-Host "  حذف 002-additional-tables.js..." -ForegroundColor Gray
Remove-Item -Path "002-additional-tables.js" -Force -ErrorAction SilentlyContinue
Write-Host "  حذف 002-create-notifications.js..." -ForegroundColor Gray
Remove-Item -Path "002-create-notifications.js" -Force -ErrorAction SilentlyContinue
Write-Host "  حذف 003-add-user-columns.js..." -ForegroundColor Gray
Remove-Item -Path "003-add-user-columns.js" -Force -ErrorAction SilentlyContinue
Write-Host "  حذف 004-add-account-columns.js..." -ForegroundColor Gray
Remove-Item -Path "004-add-account-columns.js" -Force -ErrorAction SilentlyContinue
Write-Host "  حذف 005-add-account-balance-columns.js..." -ForegroundColor Gray
Remove-Item -Path "005-add-account-balance-columns.js" -Force -ErrorAction SilentlyContinue
Write-Host "  حذف 006-add-account-description.js..." -ForegroundColor Gray
Remove-Item -Path "006-add-account-description.js" -Force -ErrorAction SilentlyContinue
Write-Host "  حذف 007-create-shipments-table.js..." -ForegroundColor Gray
Remove-Item -Path "007-create-shipments-table.js" -Force -ErrorAction SilentlyContinue
Write-Host "  حذف 008-add-performance-indexes.js..." -ForegroundColor Gray
Remove-Item -Path "008-add-performance-indexes.js" -Force -ErrorAction SilentlyContinue
Write-Host "  حذف 009-add-customer-missing-fields.js..." -ForegroundColor Gray
Remove-Item -Path "009-add-customer-missing-fields.js" -Force -ErrorAction SilentlyContinue
Write-Host "  حذف 018-create-new-tables-only.js..." -ForegroundColor Gray
Remove-Item -Path "018-create-new-tables-only.js" -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ تم حذف 14 ملف" -ForegroundColor Green
Write-Host "📊 الملفات المتبقية:" -ForegroundColor Cyan
Get-ChildItem | Format-Table Name, Length, LastWriteTime
