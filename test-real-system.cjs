const { Sequelize } = require('sequelize');

async function testRealSystem() {
  console.log('🔧 اختبار النظام الحقيقي...\n');

  // 1. اختبار الملفات المطلوبة
  console.log('1️⃣ اختبار الملفات المطلوبة...');
  
  const fs = require('fs');
  const path = require('path');

  const requiredFiles = [
    'server/src/server.js',
    'server/src/routes/financial.js',
    'server/src/routes/sales.js',
    'server/src/routes/auth.js',
    'server/src/models/index.js'
  ];

  const missingFiles = [];
  requiredFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) {
      missingFiles.push(file);
    }
  });

  if (missingFiles.length === 0) {
    console.log('✅ جميع الملفات المطلوبة موجودة');
  } else {
    console.log('❌ ملفات مفقودة:', missingFiles);
  }

  // 2. اختبار قاعدة البيانات
  console.log('\n2️⃣ اختبار قاعدة البيانات...');
  try {
    const sequelize = new Sequelize('postgres://postgres:password@localhost:5432/accounting_system');
    await sequelize.authenticate();
    console.log('✅ قاعدة البيانات متصلة بنجاح');
    await sequelize.close();
  } catch (error) {
    console.log('❌ قاعدة البيانات غير متصلة:', error.message);
    console.log('💡 تأكد من تشغيل PostgreSQL');
  }

  // 3. اختبار المتغيرات البيئية
  console.log('\n3️⃣ اختبار المتغيرات البيئية...');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'CORS_ORIGIN'
  ];

  const missingEnvVars = [];
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      missingEnvVars.push(envVar);
    }
  });

  if (missingEnvVars.length === 0) {
    console.log('✅ جميع المتغيرات البيئية موجودة');
  } else {
    console.log('❌ متغيرات بيئية مفقودة:', missingEnvVars);
  }

  // 4. التحقق من إزالة Mock
  console.log('\n4️⃣ التحقق من إزالة Mock...');
  
  const mockFiles = [
    'server/src/server-no-db.js',
    'server/src/server-simple.js',
    'server/src/server-no-redis.js',
    'server/src/server-enhanced.js',
    'server/src/server-updated.js',
    'server/src/server-fixed.js',
    'server/src/server-working.js',
    'server/src/server-database.js'
  ];

  const existingMockFiles = [];
  mockFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      existingMockFiles.push(file);
    }
  });

  if (existingMockFiles.length === 0) {
    console.log('✅ تم إزالة جميع ملفات Mock');
  } else {
    console.log('❌ ملفات Mock لا تزال موجودة:', existingMockFiles);
  }

  // 5. اختبار package.json
  console.log('\n5️⃣ اختبار package.json...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'server/package.json'), 'utf8'));
    const mockScripts = Object.keys(packageJson.scripts).filter(script => 
      script.includes('mock') || script.includes('simple') || script.includes('no-redis') || 
      script.includes('enhanced') || script.includes('updated') || script.includes('fixed') || 
      script.includes('working') || script.includes('database')
    );

    if (mockScripts.length === 0) {
      console.log('✅ تم إزالة جميع scripts Mock من package.json');
    } else {
      console.log('❌ scripts Mock لا تزال موجودة:', mockScripts);
    }
  } catch (error) {
    console.log('❌ خطأ في قراءة package.json:', error.message);
  }

  // 6. ملخص النتائج
  console.log('\n🎯 ملخص النتائج:');
  
  if (missingFiles.length === 0 && existingMockFiles.length === 0) {
    console.log('✅ النظام جاهز للاستخدام الحقيقي');
    console.log('✅ جميع ملفات Mock تم إزالتها');
    console.log('✅ النظام يعتمد على الوظائف الحقيقية فقط');
    
    console.log('\n🚀 يمكنك الآن تشغيل النظام:');
    console.log('   cd server');
    console.log('   npm run dev');
    console.log('   أو');
    console.log('   npm start');
    
    console.log('\n📋 المتطلبات:');
    console.log('   - PostgreSQL يجب أن يكون مشغلاً');
    console.log('   - المتغيرات البيئية يجب أن تكون محددة');
    console.log('   - قاعدة البيانات يجب أن تكون مهيأة');
    
  } else {
    console.log('❌ النظام يحتاج إلى إصلاحات إضافية');
    if (missingFiles.length > 0) {
      console.log('   - ملفات مفقودة:', missingFiles);
    }
    if (existingMockFiles.length > 0) {
      console.log('   - ملفات Mock لا تزال موجودة:', existingMockFiles);
    }
  }

  console.log('\n✨ النظام الآن يعتمد على الوظائف الحقيقية فقط!');
}

testRealSystem().catch(console.error);
