#!/bin/bash

# Golden Horse Shipping System - Coolify Deployment Script
# This script is specifically designed for Coolify deployment

set -e

echo "🚀 Golden Horse Shipping System - Coolify Deployment"
echo "===================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Set environment for production
export NODE_ENV=production

print_status "Setting up Golden Horse Shipping System for Coolify..."

# Copy Coolify environment file
if [ -f "server/.env.coolify" ]; then
    cp server/.env.coolify server/.env
    print_success "Coolify environment configuration loaded"
else
    print_warning "Coolify environment file not found, using production defaults"
    if [ -f "server/.env.production" ]; then
        cp server/.env.production server/.env
    fi
fi

# Install root dependencies
print_status "Installing root dependencies..."
npm ci --only=production --silent

# Install server dependencies
print_status "Installing server dependencies..."
cd server
npm ci --only=production --silent
cd ..

# Install client dependencies and build
print_status "Installing client dependencies and building..."
cd client
npm ci --only=production --silent
npm run build
cd ..

print_success "Dependencies installed and client built"

# Create necessary directories
print_status "Creating application directories..."
mkdir -p server/uploads
mkdir -p server/logs
mkdir -p server/backups
mkdir -p server/archives

# Set proper permissions
chmod 755 server/uploads
chmod 755 server/logs
chmod 755 server/backups
chmod 755 server/archives

print_success "Application directories created"

# Database setup
print_status "Setting up database..."
cd server

# Wait for database to be ready (Coolify specific)
print_status "Waiting for database connection..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if npm run db:test-connection > /dev/null 2>&1; then
        print_success "Database connection established"
        break
    else
        print_status "Waiting for database... (attempt $attempt/$max_attempts)"
        sleep 5
        attempt=$((attempt + 1))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    print_error "Database connection failed after $max_attempts attempts"
    exit 1
fi

# Run database migrations
print_status "Running database migrations..."
npm run db:migrate

# Check if database needs seeding
print_status "Checking database status..."
user_count=$(npm run check-users 2>/dev/null | grep -o "Found [0-9]* users" | grep -o "[0-9]*" || echo "0")

if [ "$user_count" = "0" ]; then
    print_status "Database is empty, seeding basic data..."
    npm run seed-basic-data
    print_success "Basic data seeded successfully"
else
    print_success "Database already contains $user_count users"
fi

cd ..

print_success "Database setup completed"

# Final verification
print_status "Performing final verification..."

# Check if client build exists
if [ -f "client/dist/index.html" ]; then
    print_success "Client build verified"
else
    print_error "Client build not found"
    exit 1
fi

# Check if server files exist
if [ -f "server/src/server.js" ]; then
    print_success "Server files verified"
else
    print_error "Server files not found"
    exit 1
fi

print_success "🎉 Golden Horse Shipping System deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "- Environment: Production (Coolify)"
echo "- Database: PostgreSQL (goldenhorse-wep-app-db)"
echo "- Client: Built and ready"
echo "- Server: Configured and ready"
echo "- Directories: Created with proper permissions"
echo ""
echo "🚀 Starting application..."
echo "Application will be available on port 5001"
echo "Health check: /api/health"
echo ""

# Start the application
cd server
exec npm start
