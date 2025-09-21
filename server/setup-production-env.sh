#!/bin/bash

# Production Environment Setup Script for VPS
# This script sets up the correct environment variables for PostgreSQL

echo "🚀 Setting up Production Environment for VPS"
echo "============================================="

# Set environment variables
export NODE_ENV=production
export DATABASE_URL="postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres"
export DB_DIALECT=postgres
export DB_HOST=72.60.92.146
export DB_PORT=5432
export DB_NAME=postgres
export DB_USERNAME=postgres
export DB_PASSWORD=XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP
export DB_SSL=false
export PORT=3000

echo "✅ Environment variables set:"
echo "   NODE_ENV: $NODE_ENV"
echo "   DATABASE_URL: ${DATABASE_URL:0:30}..."
echo "   DB_DIALECT: $DB_DIALECT"
echo "   DB_HOST: $DB_HOST"
echo "   DB_PORT: $DB_PORT"
echo "   DB_SSL: $DB_SSL"

echo ""
echo "🔍 Testing database connection..."

# Test the connection
node test-postgres-connection.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database connection successful!"
    echo "🚀 Starting the application..."
    echo ""
    npm start
else
    echo ""
    echo "❌ Database connection failed!"
    echo "Please check your database configuration."
    exit 1
fi



