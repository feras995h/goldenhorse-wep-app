#!/bin/bash

echo "🚀 Starting Golden Horse Shipping System (Simple Mode)..."

# Set basic environment
export NODE_ENV=production
export PORT=5001

# Navigate to server directory
cd server

echo "📁 Current directory: $(pwd)"
echo "📋 Environment: NODE_ENV=$NODE_ENV, PORT=$PORT"

# Create basic directories (ignore errors)
mkdir -p uploads logs backups archives 2>/dev/null || true

# Start the application directly
echo "🎯 Starting Node.js application..."
exec node src/server.js
