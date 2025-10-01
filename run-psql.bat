@echo off
echo ========================================
echo Golden Horse - Database Setup
echo ========================================
echo.

set PGPASSWORD=XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP

psql -h 72.60.92.146 -p 5432 -U postgres -d postgres -f run-sql.sql

echo.
echo ========================================
echo Done!
echo ========================================
pause
