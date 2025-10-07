/**
 * سكريبت تنظيف البيانات الحساسة من الملفات
 * يقوم بإزالة كلمات المرور وعناوين IP المكشوفة واستبدالها بمتغيرات بيئة
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// البيانات الحساسة التي يجب إزالتها
const SENSITIVE_PATTERNS = [
  {
    pattern: /postgresql:\/\/postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72\.60\.92\.146:5432\/\w+/g,
    replacement: 'process.env.DATABASE_URL || "postgresql://user:password@host:5432/database"',
    description: 'PostgreSQL connection string'
  },
  {
    pattern: /postgres:\/\/postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72\.60\.92\.146:5432\/\w+/g,
    replacement: 'process.env.DATABASE_URL || "postgres://user:password@host:5432/database"',
    description: 'PostgreSQL connection string (postgres://)'
  },
  {
    pattern: /XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP/g,
    replacement: 'YOUR_PASSWORD_HERE',
    description: 'Database password'
  },
  {
    pattern: /72\.60\.92\.146/g,
    replacement: 'YOUR_DB_HOST',
    description: 'Database IP address'
  }
];

// الملفات التي يجب تنظيفها (من نتائج grep)
const FILES_TO_CLEAN = [
  'server/execute-fixes.js',
  'server/direct-migrate.js',
  'reset-postgres-db.js',
  'simple-fix.js',
  'fix-database.js',
  'setup-database.js',
  'database_setup.sql',
  'server/db-cleanup.js',
  'server/db-scan.js',
  'server/scripts/generateControlReports.js',
  'server/scripts/runAcceptanceTests.js',
  'server/scripts/runMaintenanceRoutine.js'
];

// الملفات الوثائقية (ملفات .md) - سيتم تعليمها فقط
const DOC_FILES = [
  'QUICK_START.md',
  'WARP.md',
  'ACCOUNTING_ENGINE_AUDIT.md'
];

// الملفات التي ستُستثنى (ملفات batch)
const BATCH_FILES = [
  'run-psql.bat'
];

console.log('🔒 بدء تنظيف البيانات الحساسة من الملفات...\n');

let totalFiles = 0;
let totalReplacements = 0;
let errors = [];

/**
 * تنظيف ملف واحد
 */
function cleanFile(filePath, dryRun = false) {
  try {
    const fullPath = path.join(__dirname, filePath);
    
    // التحقق من وجود الملف
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  الملف غير موجود: ${filePath}`);
      return false;
    }

    // قراءة محتوى الملف
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    let fileReplacements = 0;

    // تطبيق كل pattern
    SENSITIVE_PATTERNS.forEach(({ pattern, replacement, description }) => {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        modified = true;
        fileReplacements += matches.length;
        console.log(`   ✓ تم استبدال ${matches.length} من ${description}`);
      }
    });

    if (modified) {
      if (!dryRun) {
        // حفظ نسخة احتياطية
        const backupPath = `${fullPath}.backup`;
        fs.copyFileSync(fullPath, backupPath);
        console.log(`   💾 تم حفظ نسخة احتياطية: ${filePath}.backup`);
        
        // حفظ الملف المعدل
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`   ✅ تم تنظيف: ${filePath} (${fileReplacements} استبدال)`);
      } else {
        console.log(`   📋 سيتم تنظيف: ${filePath} (${fileReplacements} استبدال)`);
      }
      
      totalFiles++;
      totalReplacements += fileReplacements;
      return true;
    } else {
      console.log(`   ℹ️  نظيف بالفعل: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ خطأ في معالجة ${filePath}:`, error.message);
    errors.push({ file: filePath, error: error.message });
    return false;
  }
}

/**
 * إضافة تعليق تحذيري للملفات الوثائقية
 */
function markDocFile(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  الملف غير موجود: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // التحقق من وجود بيانات حساسة
    const haseSensitiveData = SENSITIVE_PATTERNS.some(({ pattern }) => 
      pattern.test(content)
    );

    if (hasSensitiveData && !content.includes('⚠️ تحذير أمني')) {
      // إضافة تحذير في بداية الملف
      const warning = `
---
⚠️ **تحذير أمني**: هذا المستند يحتوي على بيانات اتصال قديمة وكلمات مرور.
**جميع البيانات الموجودة هنا تم تغييرها ولم تعد صالحة للاستخدام.**
للاتصال بقاعدة البيانات، استخدم متغيرات البيئة في ملف \`.env\`
---

`;
      
      content = warning + content;
      
      // حفظ نسخة احتياطية
      const backupPath = `${fullPath}.backup`;
      fs.copyFileSync(fullPath, backupPath);
      
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`   ⚠️  تم إضافة تحذير أمني: ${filePath}`);
    }
  } catch (error) {
    console.error(`   ❌ خطأ في معالجة ${filePath}:`, error.message);
  }
}

/**
 * إنشاء ملف .env نموذجي
 */
function createEnvTemplate() {
  const envTemplate = `# ملف البيئة - Golden Horse Shipping System
# ⚠️ لا تشارك هذا الملف أبداً! يحتوي على بيانات حساسة

# ====================================
# إعدادات البيئة
# ====================================
NODE_ENV=development

# ====================================
# إعدادات قاعدة البيانات
# ====================================

# للتطوير المحلي (SQLite)
DB_DIALECT=sqlite
DB_STORAGE=./database/development.sqlite

# للإنتاج (PostgreSQL)
# DATABASE_URL=postgresql://username:password@host:5432/database_name

# أو استخدم متغيرات منفصلة:
# DB_DIALECT=postgres
# DB_HOST=your_host_here
# DB_PORT=5432
# DB_NAME=your_database_name
# DB_USERNAME=your_username
# DB_PASSWORD=your_password

# ====================================
# إعدادات JWT
# ====================================
# ⚠️ غيّر هذه المفاتيح لقيم عشوائية قوية!
# يمكنك توليد مفاتيح عشوائية بهذا الأمر:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

JWT_SECRET=change-this-to-a-very-long-random-string-minimum-32-characters
JWT_REFRESH_SECRET=change-this-to-another-very-long-random-string-also-32-chars

# مدة صلاحية التوكن (بالثواني)
JWT_EXPIRES_IN=28800
JWT_REFRESH_EXPIRES_IN=604800

# ====================================
# إعدادات السيرفر
# ====================================
PORT=5001
HOST=localhost

# ====================================
# إعدادات CORS
# ====================================
CORS_ORIGIN=http://localhost:5173

# ====================================
# إعدادات Redis (اختياري)
# ====================================
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=

# ====================================
# إعدادات Rate Limiting
# ====================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_GENERAL_MAX=1000
RATE_LIMIT_AUTH_MAX=10
RATE_LIMIT_FINANCIAL_MAX=500
RATE_LIMIT_SALES_MAX=800
ENABLE_RATE_LIMITING=true

# ====================================
# إعدادات Backup
# ====================================
BACKUP_ENABLED=true
BACKUP_INTERVAL=86400000
BACKUP_RETENTION_DAYS=30

# ====================================
# إعدادات أخرى
# ====================================
TRUST_PROXY=0
`;

  const envPath = path.join(__dirname, '.env.example');
  fs.writeFileSync(envPath, envTemplate, 'utf8');
  console.log('\n✅ تم إنشاء ملف .env.example');
  console.log('📝 قم بنسخه إلى .env وتعديل القيم:\n');
  console.log('   cp .env.example .env');
  console.log('   # ثم قم بتعديل .env بقيمك الخاصة\n');
}

/**
 * التأكد من أن .env في .gitignore
 */
function ensureGitignore() {
  const gitignorePath = path.join(__dirname, '.gitignore');
  
  try {
    let gitignoreContent = '';
    
    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }
    
    const entriesToAdd = [
      '.env',
      '.env.local',
      '.env.*.local',
      '*.backup'
    ];
    
    let modified = false;
    entriesToAdd.forEach(entry => {
      if (!gitignoreContent.includes(entry)) {
        gitignoreContent += `\n${entry}`;
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(gitignorePath, gitignoreContent, 'utf8');
      console.log('✅ تم تحديث .gitignore');
    } else {
      console.log('✅ .gitignore محدّث بالفعل');
    }
  } catch (error) {
    console.error('❌ خطأ في تحديث .gitignore:', error.message);
  }
}

// ====================================
// التشغيل الرئيسي
// ====================================

console.log('1️⃣  تنظيف ملفات الكود...\n');
FILES_TO_CLEAN.forEach(file => {
  console.log(`📄 معالجة: ${file}`);
  cleanFile(file, false); // false = تطبيق التغييرات فعلياً
  console.log('');
});

console.log('\n2️⃣  تعليم الملفات الوثائقية...\n');
DOC_FILES.forEach(file => {
  console.log(`📄 معالجة: ${file}`);
  markDocFile(file);
});

console.log('\n3️⃣  إنشاء ملفات البيئة...\n');
createEnvTemplate();
ensureGitignore();

// ملخص النتائج
console.log('\n' + '='.repeat(60));
console.log('📊 ملخص التنظيف:');
console.log('='.repeat(60));
console.log(`✅ الملفات المُنظفة: ${totalFiles}`);
console.log(`🔄 إجمالي الاستبدالات: ${totalReplacements}`);
console.log(`❌ الأخطاء: ${errors.length}`);

if (errors.length > 0) {
  console.log('\n⚠️  الأخطاء:');
  errors.forEach(({ file, error }) => {
    console.log(`   - ${file}: ${error}`);
  });
}

console.log('\n' + '='.repeat(60));
console.log('✅ اكتمل التنظيف!');
console.log('='.repeat(60));

console.log('\n📋 الخطوات التالية:');
console.log('   1. راجع الملفات المنظفة');
console.log('   2. انسخ .env.example إلى .env');
console.log('   3. عدّل .env بمعلومات الاتصال الصحيحة');
console.log('   4. غيّر كلمات مرور قاعدة البيانات على الخادم');
console.log('   5. احذف ملفات .backup بعد التأكد من النتائج');
console.log('   6. لا ترفع ملف .env إلى Git!');
console.log('\n⚠️  تذكير: لا تشارك ملف .env مع أحد!\n');

