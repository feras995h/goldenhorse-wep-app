const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;

const execAsync = promisify(exec);

console.log('🚀 إعداد قاعدة بيانات محلية سريعة');
console.log('=' .repeat(50));

async function setupLocalDatabase() {
  console.log('🔍 التحقق من Docker...');
  
  try {
    // التحقق من وجود Docker
    await execAsync('docker --version');
    console.log('✅ Docker متاح');
    
    // التحقق من وجود حاوية PostgreSQL
    try {
      const { stdout } = await execAsync('docker ps -a --filter name=golden-horse-postgres --format "{{.Names}}"');
      
      if (stdout.includes('golden-horse-postgres')) {
        console.log('📦 حاوية PostgreSQL موجودة مسبقاً');
        
        // التحقق من حالة الحاوية
        const { stdout: status } = await execAsync('docker ps --filter name=golden-horse-postgres --format "{{.Status}}"');
        
        if (status.includes('Up')) {
          console.log('✅ PostgreSQL يعمل بالفعل');
        } else {
          console.log('🔄 بدء تشغيل PostgreSQL...');
          await execAsync('docker start golden-horse-postgres');
          console.log('✅ تم بدء تشغيل PostgreSQL');
        }
      } else {
        console.log('🔄 إنشاء حاوية PostgreSQL جديدة...');
        
        const dockerCommand = `docker run --name golden-horse-postgres \
          -e POSTGRES_PASSWORD=1234 \
          -e POSTGRES_DB=golden_horse_dev \
          -e POSTGRES_USER=postgres \
          -p 5432:5432 \
          -d postgres:15`;
        
        await execAsync(dockerCommand);
        console.log('✅ تم إنشاء وتشغيل PostgreSQL');
        
        // انتظار حتى يبدأ PostgreSQL
        console.log('⏳ انتظار بدء تشغيل PostgreSQL...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      
      // اختبار الاتصال
      console.log('🔍 اختبار الاتصال بقاعدة البيانات...');
      
      const testCommand = `docker exec golden-horse-postgres psql -U postgres -d golden_horse_dev -c "SELECT version();"`;
      const { stdout: version } = await execAsync(testCommand);
      
      console.log('✅ الاتصال بقاعدة البيانات ناجح');
      console.log('📊 إصدار PostgreSQL:', version.split('\n')[2]?.trim() || 'غير محدد');
      
      // تحديث ملف .env
      await updateEnvFile();
      
      console.log('\n🎉 تم إعداد قاعدة البيانات بنجاح!');
      console.log('📋 بيانات الاتصال:');
      console.log('   Host: localhost');
      console.log('   Port: 5432');
      console.log('   Database: golden_horse_dev');
      console.log('   Username: postgres');
      console.log('   Password: 1234');
      
      console.log('\n🔄 الخطوة التالية: اختبار التطبيق');
      console.log('   npm run dev');
      
      return true;
      
    } catch (error) {
      console.log('❌ خطأ في إعداد PostgreSQL:', error.message);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Docker غير متاح:', error.message);
    console.log('\n💡 خيارات بديلة:');
    console.log('1. تثبيت Docker Desktop من: https://www.docker.com/products/docker-desktop');
    console.log('2. تثبيت PostgreSQL مباشرة من: https://www.postgresql.org/download/');
    console.log('3. استخدام قاعدة بيانات سحابية مجانية');
    
    return false;
  }
}

async function updateEnvFile() {
  console.log('📝 تحديث ملف .env...');
  
  try {
    let envContent = await fs.readFile('.env', 'utf8');
    
    // تحديث إعدادات قاعدة البيانات المحلية
    const updates = {
      'DB_HOST=.*': 'DB_HOST=localhost',
      'DB_PORT=.*': 'DB_PORT=5432',
      'DB_NAME=.*': 'DB_NAME=golden_horse_dev',
      'DB_USERNAME=.*': 'DB_USERNAME=postgres',
      'DB_PASSWORD=.*': 'DB_PASSWORD=1234'
    };
    
    Object.entries(updates).forEach(([pattern, replacement]) => {
      const regex = new RegExp(pattern);
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, replacement);
      } else {
        envContent += `\n${replacement}`;
      }
    });
    
    await fs.writeFile('.env', envContent);
    console.log('✅ تم تحديث ملف .env');
    
  } catch (error) {
    console.log('❌ خطأ في تحديث ملف .env:', error.message);
  }
}

// تشغيل الإعداد
setupLocalDatabase().catch(error => {
  console.error('💥 خطأ في الإعداد:', error.message);
});
