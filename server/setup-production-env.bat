@echo off
REM Production Environment Setup Script for Windows/VPS
REM This script sets up the correct environment variables for PostgreSQL

echo 🚀 Setting up Production Environment for VPS
echo =============================================

REM Set environment variables
set NODE_ENV=production
set DATABASE_URL=postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres
set DB_DIALECT=postgres
set DB_HOST=72.60.92.146
set DB_PORT=5432
set DB_NAME=postgres
set DB_USERNAME=postgres
set DB_PASSWORD=XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP
set DB_SSL=false
set PORT=3000

echo ✅ Environment variables set:
echo    NODE_ENV: %NODE_ENV%
echo    DATABASE_URL: %DATABASE_URL:~0,30%...
echo    DB_DIALECT: %DB_DIALECT%
echo    DB_HOST: %DB_HOST%
echo    DB_PORT: %DB_PORT%
echo    DB_SSL: %DB_SSL%

echo.
echo 🔍 Testing database connection...

REM Test the connection
node test-postgres-connection.js

if %errorlevel% equ 0 (
    echo.
    echo ✅ Database connection successful!
    echo 🚀 Starting the application...
    echo.
    npm start
) else (
    echo.
    echo ❌ Database connection failed!
    echo Please check your database configuration.
    exit /b 1
)

