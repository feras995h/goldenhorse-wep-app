#!/bin/bash

# Golden Horse Shipping - Deployment Fix Script
echo "🔧 Fixing deployment issues..."

# 1. Check for TypeScript errors in client
echo "📋 Checking TypeScript errors..."
cd client
npm run type-check

# 2. Check for any build issues
echo "🏗️ Testing client build locally..."
npm run build

# 3. Check server for any syntax errors
echo "🔍 Checking server files..."
cd ../server
node --check src/server.js

# 4. Verify all Phase 1 route files
echo "📁 Verifying Phase 1 routes..."
node --check src/routes/advancedReports.js
node --check src/routes/costAnalysis.js
node --check src/routes/budgetPlanning.js
node --check src/routes/cashFlowManagement.js
node --check src/routes/financialRatios.js

echo "✅ Deployment readiness check complete!"