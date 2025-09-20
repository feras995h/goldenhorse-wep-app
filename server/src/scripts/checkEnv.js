import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Checking environment variables...');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Not set');
console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? '✅ Set' : '❌ Not set');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

if (!process.env.JWT_SECRET) {
  console.log('⚠️  JWT_SECRET is not set, using default value');
  process.env.JWT_SECRET = 'default-jwt-secret-key-for-development';
}

console.log('✅ Environment check complete');
