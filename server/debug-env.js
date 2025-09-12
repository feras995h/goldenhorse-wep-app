#!/usr/bin/env node

/**
 * Environment Variables Debug Script
 * This script helps diagnose environment variable issues in production
 */

console.log('🔍 Environment Variables Debug Script');
console.log('=====================================\n');

console.log('📊 Basic Environment Info:');
console.log('  - Node.js Version:', process.version);
console.log('  - Platform:', process.platform);
console.log('  - Architecture:', process.arch);
console.log('  - Current Working Directory:', process.cwd());
console.log('  - Script Path:', __filename);
console.log('');

console.log('🌍 Environment Variables:');
console.log('  - NODE_ENV:', JSON.stringify(process.env.NODE_ENV));
console.log('  - NODE_ENV type:', typeof process.env.NODE_ENV);
console.log('  - NODE_ENV length:', process.env.NODE_ENV ? process.env.NODE_ENV.length : 0);
console.log('  - NODE_ENV starts with =:', process.env.NODE_ENV ? process.env.NODE_ENV.startsWith('=') : false);
console.log('');

console.log('🗄️ Database Environment Variables:');
console.log('  - DB_URL present:', !!process.env.DB_URL);
console.log('  - DB_URL type:', typeof process.env.DB_URL);
console.log('  - DB_URL length:', process.env.DB_URL ? process.env.DB_URL.length : 0);
console.log('  - DB_URL value (first 30 chars):', process.env.DB_URL ? process.env.DB_URL.substring(0, 30) + '...' : 'N/A');
console.log('');

console.log('  - DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('  - DATABASE_URL type:', typeof process.env.DATABASE_URL);
console.log('  - DATABASE_URL length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0);
console.log('  - DATABASE_URL starts with =:', process.env.DATABASE_URL ? process.env.DATABASE_URL.startsWith('=') : false);
console.log('  - DATABASE_URL value (first 30 chars):', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'N/A');
console.log('');

console.log('🔐 Security Environment Variables:');
console.log('  - JWT_SECRET present:', !!process.env.JWT_SECRET);
console.log('  - JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
console.log('  - JWT_REFRESH_SECRET present:', !!process.env.JWT_REFRESH_SECRET);
console.log('  - JWT_REFRESH_SECRET length:', process.env.JWT_REFRESH_SECRET ? process.env.JWT_REFRESH_SECRET.length : 0);
console.log('');

console.log('🔧 Other Important Variables:');
console.log('  - PORT:', process.env.PORT);
console.log('  - CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('  - DB_DIALECT:', process.env.DB_DIALECT);
console.log('');

// Test the validation logic
console.log('🧪 Testing Validation Logic:');
const hasDbUrl = process.env.DB_URL || process.env.DATABASE_URL;
console.log('  - hasDbUrl (DB_URL || DATABASE_URL):', !!hasDbUrl);

if (hasDbUrl) {
  console.log('  ✅ Database URL found - validation should PASS');
  console.log('  - Source:', process.env.DATABASE_URL ? 'DATABASE_URL' : 'DB_URL');
} else {
  console.log('  ❌ No database URL found - validation should FAIL');
  console.log('  - Need either DATABASE_URL or DB_URL');
}
console.log('');

// Check for common Coolify issues
console.log('🔍 Coolify-specific Checks:');
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('=')) {
  console.log('  ⚠️  WARNING: DATABASE_URL starts with = (Coolify bug)');
  console.log('  - Raw value:', process.env.DATABASE_URL.substring(0, 40) + '...');
  console.log('  - This should be automatically cleaned by the application');
} else if (process.env.DATABASE_URL) {
  console.log('  ✅ DATABASE_URL format looks correct');
} else {
  console.log('  ❌ DATABASE_URL not found');
}
console.log('');

console.log('📋 Summary:');
console.log('  - Environment:', process.env.NODE_ENV || 'undefined');
console.log('  - Database URL Available:', !!hasDbUrl);
console.log('  - JWT Secrets Available:', !!(process.env.JWT_SECRET && process.env.JWT_REFRESH_SECRET));

if (hasDbUrl && process.env.JWT_SECRET && process.env.JWT_REFRESH_SECRET) {
  console.log('  🎉 All required environment variables appear to be present!');
  console.log('  📝 If you\'re still getting errors, check the application logs for more details.');
} else {
  console.log('  ❌ Some required environment variables are missing:');
  if (!hasDbUrl) console.log('    - Database URL (DATABASE_URL or DB_URL)');
  if (!process.env.JWT_SECRET) console.log('    - JWT_SECRET');
  if (!process.env.JWT_REFRESH_SECRET) console.log('    - JWT_REFRESH_SECRET');
}

console.log('');
console.log('💡 Next Steps:');
console.log('  1. If DATABASE_URL is present but app still fails, check application logs');
console.log('  2. If DATABASE_URL is missing, add it in Coolify Environment Variables');
console.log('  3. If DATABASE_URL starts with =, the app should clean it automatically');
console.log('  4. Make sure to restart/redeploy the application after changing environment variables');
