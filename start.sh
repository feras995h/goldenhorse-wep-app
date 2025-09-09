#!/bin/bash

# Simple start script for Coolify deployment
echo "🚀 Starting Golden Horse Shipping System..."

# Set environment
export NODE_ENV=production
export PORT=5001

# Create directories
mkdir -p server/uploads server/logs server/backups server/archives
chmod 755 server/uploads server/logs server/backups server/archives

# Navigate to server directory
cd server

# Check if database connection works
echo "🔍 Testing database connection..."
timeout 30 npm run db:test-connection || echo "⚠️ Database connection test failed, continuing anyway..."

# Run migrations if needed
echo "📊 Running database migrations..."
npm run db:migrate || echo "⚠️ Migration failed, continuing anyway..."

# Seed basic data if database is empty
echo "🌱 Checking if seeding is needed..."
if npm run check-users 2>/dev/null | grep -q "Found 0 users"; then
    echo "🌱 Seeding basic data..."
    npm run seed-basic-data || echo "⚠️ Seeding failed, continuing anyway..."
fi

# Start the application
echo "🎯 Starting application on port $PORT..."
exec npm start
