/**
 * سكريبت إصلاح مشكلة الاتصال بقاعدة البيانات
 * يقوم بإنشاء ملف .env صحيح ويختبر الاتصال
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

console.log('🔧 معالج إصلاح الاتصال بقاعدة البيانات');
console.log('=' .repeat(60));
console.log('\nهذا السكريبت سيساعدك على إعداد الاتصال بقاعدة البيانات\n');

async function main() {
  try {
    console.log('اختر نوع قاعدة البيانات:\n');
    console.log('1. SQLite (محلي - للتطوير والاختبار) ✅ موصى به للبداية');
    console.log('2. PostgreSQL (إنتاجي - للاستضافة)');
    console.log('3. إلغاء\n');

    const choice = await question('اختيارك (1/2/3): ');

    if (choice === '3') {
      console.log('\n❌ تم الإلغاء');
      rl.close();
      return;
    }

    let envContent = `# ملف البيئة - تم إنشاؤه بواسطة fix-database-connection.js
# التاريخ: ${new Date().toISOString()}

# ====================================
# إعدادات البيئة
# ====================================
NODE_ENV=development

`;

    if (choice === '1') {
      // SQLite
      console.log('\n✅ تم اختيار SQLite (قاعدة بيانات محلية)\n');
      
      envContent += `# ====================================
# قاعدة البيانات - SQLite (محلي)
# ====================================
DB_DIALECT=sqlite
DB_STORAGE=./database/development.sqlite

`;
      
      console.log('📝 سيتم إنشاء قاعدة بيانات SQLite في:');
      console.log('   server/database/development.sqlite\n');

      // إنشاء المجلد إذا لم يكن موجوداً
      const dbDir = path.join(__dirname, 'server', 'database');
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log('✅ تم إنشاء مجلد database\n');
      }

    } else if (choice === '2') {
      // PostgreSQL
      console.log('\n📝 إعداد PostgreSQL\n');
      console.log('لديك خياران:\n');
      console.log('A. استخدام DATABASE_URL كاملة (موصى به)');
      console.log('B. إدخال تفاصيل الاتصال منفصلة\n');

      const pgChoice = await question('اختيارك (A/B): ');

      if (pgChoice.toLowerCase() === 'a') {
        console.log('\nأدخل DATABASE_URL كاملة:');
        console.log('مثال: postgresql://username:password@host:5432/database\n');
        
        const dbUrl = await question('DATABASE_URL: ');
        
        envContent += `# ====================================
# قاعدة البيانات - PostgreSQL
# ====================================
DATABASE_URL=${dbUrl}

`;
      } else {
        console.log('\nأدخل تفاصيل الاتصال:\n');
        
        const dbHost = await question('Host (مثال: localhost): ');
        const dbPort = await question('Port (افتراضي: 5432): ') || '5432';
        const dbName = await question('Database Name: ');
        const dbUser = await question('Username: ');
        const dbPass = await question('Password: ');

        envContent += `# ====================================
# قاعدة البيانات - PostgreSQL
# ====================================
DB_DIALECT=postgres
DB_HOST=${dbHost}
DB_PORT=${dbPort}
DB_NAME=${dbName}
DB_USERNAME=${dbUser}
DB_PASSWORD=${dbPass}

`;
      }
    }

    // إعدادات JWT
    const crypto = await import('crypto');
    const jwtSecret = crypto.randomBytes(64).toString('hex');
    const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');

    envContent += `# ====================================
# إعدادات JWT (تم إنشاؤها تلقائياً)
# ====================================
JWT_SECRET=${jwtSecret}
JWT_REFRESH_SECRET=${jwtRefreshSecret}
JWT_EXPIRES_IN=28800
JWT_REFRESH_EXPIRES_IN=604800

# ====================================
# إعدادات السيرفر
# ====================================
PORT=5001
HOST=localhost
CORS_ORIGIN=http://localhost:5173

# ====================================
# إعدادات Rate Limiting
# ====================================
ENABLE_RATE_LIMITING=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_GENERAL_MAX=1000
RATE_LIMIT_AUTH_MAX=10

# ====================================
# إعدادات أخرى
# ====================================
TRUST_PROXY=0
`;

    // حفظ ملف .env في المجلد الرئيسي
    const mainEnvPath = path.join(__dirname, '.env');
    
    // نسخة احتياطية إذا كان الملف موجوداً
    if (fs.existsSync(mainEnvPath)) {
      const backupPath = `${mainEnvPath}.backup.${Date.now()}`;
      fs.copyFileSync(mainEnvPath, backupPath);
      console.log(`\n💾 تم حفظ نسخة احتياطية من .env القديم`);
    }

    fs.writeFileSync(mainEnvPath, envContent, 'utf8');
    console.log(`\n✅ تم إنشاء ملف .env في: ${mainEnvPath}`);

    // حفظ نسخة في مجلد server أيضاً
    const serverEnvPath = path.join(__dirname, 'server', '.env');
    fs.writeFileSync(serverEnvPath, envContent, 'utf8');
    console.log(`✅ تم إنشاء ملف .env في: ${serverEnvPath}`);

    // التأكد من وجود .gitignore
    const gitignorePath = path.join(__dirname, '.gitignore');
    let gitignore = '';
    
    if (fs.existsSync(gitignorePath)) {
      gitignore = fs.readFileSync(gitignorePath, 'utf8');
    }

    if (!gitignore.includes('.env')) {
      gitignore += '\n.env\n.env.local\n.env.*.local\n';
      fs.writeFileSync(gitignorePath, gitignore, 'utf8');
      console.log('✅ تم تحديث .gitignore');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ تم إعداد ملف البيئة بنجاح!');
    console.log('='.repeat(60));

    if (choice === '1') {
      console.log('\n📋 الخطوات التالية لـ SQLite:');
      console.log('   1. تشغيل السيرفر: cd server && npm start');
      console.log('   2. إنشاء الجداول: node server/create-all-tables.js');
      console.log('   3. إنشاء مستخدم admin: node server/create-admin-user.js');
    } else {
      console.log('\n📋 الخطوات التالية لـ PostgreSQL:');
      console.log('   1. اختبار الاتصال: cd server && npm run test-connection');
      console.log('   2. تشغيل Migrations: npm run db:migrate');
      console.log('   3. تشغيل السيرفر: npm start');
    }

    console.log('\n⚠️  تذكير مهم:');
    console.log('   - لا ترفع ملف .env إلى Git');
    console.log('   - لا تشارك محتوى .env مع أحد');
    console.log('   - احتفظ بنسخة احتياطية من .env في مكان آمن\n');

    // اختبار الاتصال
    console.log('هل تريد اختبار الاتصال الآن؟ (y/n): ');
    const testChoice = await question('');

    if (testChoice.toLowerCase() === 'y') {
      console.log('\n🔍 جارٍ اختبار الاتصال...\n');
      await testConnection(choice === '1' ? 'sqlite' : 'postgres');
    }

  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
  } finally {
    rl.close();
  }
}

/**
 * اختبار الاتصال بقاعدة البيانات
 */
async function testConnection(dbType) {
  try {
    // تحميل متغيرات البيئة الجديدة
    const dotenv = await import('dotenv');
    dotenv.config({ path: path.join(__dirname, '.env') });

    const { Sequelize } = await import('sequelize');
    let sequelize;

    if (dbType === 'sqlite') {
      sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: process.env.DB_STORAGE || './server/database/development.sqlite',
        logging: false
      });
    } else {
      if (process.env.DATABASE_URL) {
        sequelize = new Sequelize(process.env.DATABASE_URL, {
          dialect: 'postgres',
          logging: false
        });
      } else {
        sequelize = new Sequelize({
          dialect: 'postgres',
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_NAME,
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          logging: false
        });
      }
    }

    await sequelize.authenticate();
    console.log('✅ نجح الاتصال بقاعدة البيانات!');
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ فشل الاتصال:', error.message);
    console.log('\nتأكد من:');
    if (dbType === 'sqlite') {
      console.log('   - أن مجلد database موجود');
      console.log('   - أن لديك صلاحيات الكتابة');
    } else {
      console.log('   - أن الخادم يعمل');
      console.log('   - أن بيانات الاتصال صحيحة');
      console.log('   - أن الجدار الناري يسمح بالاتصال');
    }
  }
}

// تشغيل السكريبت
main().catch(error => {
  console.error('❌ خطأ فادح:', error);
  process.exit(1);
});

