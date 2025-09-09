#!/usr/bin/env node

/**
 * سكريپت تكوين إعدادات VPS
 * VPS Configuration Script
 */

const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function configureVPS() {
  console.log('🚀 إعداد Hostinger VPS للحصان الذهبي');
  console.log('=' .repeat(50));
  
  try {
    // جمع المعلومات من المستخدم
    console.log('\n📋 يرجى إدخال بيانات الخادم الافتراضي:');
    
    const vpsIP = await question('🌐 عنوان IP الخادم: ');
    const sshUsername = await question('👤 اسم المستخدم SSH (افتراضي: root): ') || 'root';
    const sshPassword = await question('🔐 كلمة مرور SSH: ');
    
    // التحقق من صحة البيانات
    if (!vpsIP || !sshPassword) {
      console.log('❌ يرجى إدخال جميع البيانات المطلوبة');
      process.exit(1);
    }
    
    // التحقق من تنسيق IP
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(vpsIP)) {
      console.log('❌ تنسيق عنوان IP غير صحيح');
      process.exit(1);
    }
    
    console.log('\n✅ البيانات المدخلة:');
    console.log(`   IP: ${vpsIP}`);
    console.log(`   Username: ${sshUsername}`);
    console.log(`   Password: ${'*'.repeat(sshPassword.length)}`);
    
    const confirm = await question('\n❓ هل البيانات صحيحة؟ (y/n): ');
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ تم إلغاء العملية');
      process.exit(0);
    }
    
    // تحديث ملف .env
    await updateEnvFile(vpsIP, sshUsername, sshPassword);
    
    // إنشاء سكريپت الاتصال
    await createConnectionScript(vpsIP, sshUsername, sshPassword);
    
    // إنشاء سكريپت إعداد Coolify
    await createCoolifySetupScript();
    
    console.log('\n🎉 تم تكوين الإعدادات بنجاح!');
    console.log('\n🔄 الخطوات التالية:');
    console.log('1. تشغيل سكريپت الاتصال: node connect-to-vps.js');
    console.log('2. أو الاتصال يدوياً: ssh ' + sshUsername + '@' + vpsIP);
    console.log('3. تشغيل سكريپت إعداد Coolify على الخادم');
    
  } catch (error) {
    console.error('❌ خطأ في التكوين:', error.message);
  } finally {
    rl.close();
  }
}

async function updateEnvFile(vpsIP, sshUsername, sshPassword) {
  console.log('\n📝 تحديث ملف .env...');
  
  try {
    let envContent = await fs.readFile('.env', 'utf8');
    
    // تحديث إعدادات VPS
    const updates = {
      'VPS_IP=.*': `VPS_IP=${vpsIP}`,
      'SSH_USERNAME=.*': `SSH_USERNAME=${sshUsername}`,
      'VPS_SSH_PASSWORD=.*': `VPS_SSH_PASSWORD=${sshPassword}`
    };
    
    Object.entries(updates).forEach(([pattern, replacement]) => {
      const regex = new RegExp(pattern);
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, replacement);
      } else {
        envContent += `\n${replacement}`;
      }
    });
    
    // إضافة تعليق للإنتاج
    if (!envContent.includes('# Production Database Configuration')) {
      envContent += `\n\n# Production Database Configuration (سيتم تحديثها بعد إعداد Coolify)
# DB_HOST=${vpsIP}
# DB_PORT=5432
# DB_NAME=golden_horse_production
# DB_USERNAME=golden_horse_user
# DB_PASSWORD=سيتم_إنشاؤها_تلقائياً`;
    }
    
    await fs.writeFile('.env', envContent);
    console.log('✅ تم تحديث ملف .env');
    
  } catch (error) {
    console.log('❌ خطأ في تحديث ملف .env:', error.message);
  }
}

async function createConnectionScript(vpsIP, sshUsername, sshPassword) {
  console.log('📝 إنشاء سكريپت الاتصال...');
  
  const connectionScript = `#!/usr/bin/env node

/**
 * سكريپت الاتصال بالخادم الافتراضي
 * VPS Connection Script
 */

const { spawn } = require('child_process');

console.log('🔗 الاتصال بالخادم الافتراضي...');
console.log('IP: ${vpsIP}');
console.log('Username: ${sshUsername}');
console.log('');
console.log('💡 نصائح:');
console.log('- استخدم كلمة المرور: ${sshPassword}');
console.log('- بعد الاتصال، شغل: curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash');
console.log('- أو انسخ والصق الأوامر من setup-coolify-commands.txt');
console.log('');

// فتح اتصال SSH
const ssh = spawn('ssh', ['${sshUsername}@${vpsIP}'], {
  stdio: 'inherit'
});

ssh.on('error', (error) => {
  console.error('❌ خطأ في الاتصال:', error.message);
  console.log('');
  console.log('💡 جرب الاتصال يدوياً:');
  console.log('ssh ${sshUsername}@${vpsIP}');
});

ssh.on('close', (code) => {
  console.log('🔚 تم إنهاء الاتصال');
});
`;

  try {
    await fs.writeFile('connect-to-vps.js', connectionScript);
    console.log('✅ تم إنشاء سكريپت الاتصال: connect-to-vps.js');
  } catch (error) {
    console.log('❌ خطأ في إنشاء سكريپت الاتصال:', error.message);
  }
}

async function createCoolifySetupScript() {
  console.log('📝 إنشاء أوامر إعداد Coolify...');
  
  const setupCommands = `# أوامر إعداد Coolify على الخادم الافتراضي
# نسخ والصق هذه الأوامر واحداً تلو الآخر

echo "🚀 بدء إعداد Coolify..."

# 1. تحديث النظام
echo "📦 تحديث النظام..."
apt update && apt upgrade -y

# 2. تثبيت Docker
echo "🐳 تثبيت Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker

# 3. تثبيت Coolify
echo "❄️ تثبيت Coolify..."
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# 4. التحقق من التثبيت
echo "✅ التحقق من التثبيت..."
docker --version
systemctl status docker

echo "🎉 تم إعداد Coolify بنجاح!"
echo "🌐 يمكنك الوصول إليه عبر: http://YOUR_VPS_IP:8000"
echo "📋 أنشئ حساب مدير وابدأ في إعداد قاعدة البيانات"

# 5. إنشاء قاعدة بيانات PostgreSQL (اختياري - يمكن عمله من واجهة Coolify)
echo "🗄️ لإنشاء قاعدة بيانات PostgreSQL:"
echo "1. اذهب إلى http://YOUR_VPS_IP:8000"
echo "2. أنشئ حساب مدير"
echo "3. اضغط + New Resource"
echo "4. اختر Database > PostgreSQL"
echo "5. املأ البيانات:"
echo "   - Name: golden-horse-postgres"
echo "   - Database: golden_horse_production"
echo "   - Username: golden_horse_user"
echo "   - Password: [إنشاء كلمة مرور قوية]"
echo "6. اضغط Deploy"
`;

  try {
    await fs.writeFile('setup-coolify-commands.txt', setupCommands);
    console.log('✅ تم إنشاء ملف الأوامر: setup-coolify-commands.txt');
  } catch (error) {
    console.log('❌ خطأ في إنشاء ملف الأوامر:', error.message);
  }
}

// تشغيل السكريپت
if (require.main === module) {
  configureVPS();
}

module.exports = { configureVPS };
