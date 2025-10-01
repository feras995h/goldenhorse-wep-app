/**
 * Create Server .env File
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envContent = `# Environment
NODE_ENV=production

# Database
DATABASE_URL=postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres

# JWT Secrets
JWT_SECRET=golden-horse-secret-key-2024-change-in-production
JWT_REFRESH_SECRET=golden-horse-refresh-secret-key-2024-change-in-production

# Server
PORT=5001
HOST=localhost

# CORS
CORS_ORIGIN=http://localhost:3000

# Session
SESSION_SECRET=golden-horse-session-secret-2024

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Email (optional)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-password
`;

const serverEnvPath = path.join(__dirname, 'server', '.env');

try {
  // تحقق إذا كان الملف موجود
  if (fs.existsSync(serverEnvPath)) {
    console.log('⚠️  ملف .env موجود بالفعل في server/');
    console.log('📝 محتوى الملف الحالي:\n');
    console.log(fs.readFileSync(serverEnvPath, 'utf8'));
    console.log('\n❓ هل تريد استبداله؟ (احذف الملف يدوياً وأعد تشغيل هذا السكريبت)');
  } else {
    // إنشاء الملف
    fs.writeFileSync(serverEnvPath, envContent, 'utf8');
    console.log('✅ تم إنشاء ملف server/.env بنجاح!\n');
    console.log('📝 المحتوى:\n');
    console.log(envContent);
    console.log('\n🚀 الآن أعد تشغيل السيرفر:');
    console.log('   npm run dev\n');
  }
} catch (error) {
  console.error('❌ خطأ في إنشاء الملف:', error.message);
  console.log('\n💡 يمكنك إنشاء الملف يدوياً:');
  console.log('   1. افتح مجلد server');
  console.log('   2. أنشئ ملف .env');
  console.log('   3. انسخ المحتوى التالي:\n');
  console.log(envContent);
}
