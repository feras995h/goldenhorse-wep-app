#!/usr/bin/env node

/**
 * سكريپت شامل لإعداد قاعدة البيانات عبر Hostinger + Coolify
 * Comprehensive script for database setup via Hostinger + Coolify
 */

import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';

const execAsync = promisify(exec);

class HostingerCoolifyManager {
  constructor(config) {
    this.hostingerAPI = config.hostinger;
    this.serverIP = config.serverIP;
    this.sshCredentials = config.ssh;
    this.coolifyUrl = `http://${config.serverIP}:8000`;
  }

  /**
   * التحقق من وصول Hostinger API
   */
  async checkHostingerAccess() {
    console.log('🔍 التحقق من وصول Hostinger API...');
    
    if (!this.hostingerAPI?.apiKey) {
      console.log('⚠️  Hostinger API غير متاح، سنستخدم SSH مباشرة');
      return false;
    }

    try {
      const response = await axios.get(`${this.hostingerAPI.endpoint}/vps`, {
        headers: {
          'Authorization': `Bearer ${this.hostingerAPI.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('✅ Hostinger API متاح');
      console.log(`📊 عدد الخوادم المتاحة: ${response.data?.length || 0}`);
      return true;
    } catch (error) {
      console.log('❌ خطأ في Hostinger API:', error.message);
      return false;
    }
  }

  /**
   * التحقق من وصول الخادم عبر SSH
   */
  async checkSSHAccess() {
    console.log('🔍 التحقق من وصول SSH...');
    
    try {
      const command = `ssh -o ConnectTimeout=10 -o BatchMode=yes ${this.sshCredentials.username}@${this.serverIP} "echo 'SSH متاح'"`;
      const { stdout } = await execAsync(command);
      
      console.log('✅ SSH متاح:', stdout.trim());
      return true;
    } catch (error) {
      console.log('❌ خطأ في SSH:', error.message);
      console.log('💡 تأكد من:');
      console.log('   - صحة عنوان IP');
      console.log('   - إعداد SSH Key أو كلمة المرور');
      console.log('   - فتح منفذ 22');
      return false;
    }
  }

  /**
   * التحقق من حالة Coolify
   */
  async checkCoolifyStatus() {
    console.log('🔍 التحقق من حالة Coolify...');
    
    try {
      const response = await axios.get(`${this.coolifyUrl}/api/v1/health`, {
        timeout: 10000
      });
      
      console.log('✅ Coolify يعمل بشكل طبيعي');
      return { available: true, data: response.data };
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ Coolify غير مثبت أو لا يعمل');
        return { available: false, needsInstallation: true };
      } else {
        console.log('❌ خطأ في الوصول إلى Coolify:', error.message);
        return { available: false, error: error.message };
      }
    }
  }

  /**
   * تثبيت Coolify عبر SSH
   */
  async installCoolify() {
    console.log('🚀 تثبيت Coolify...');
    
    const commands = [
      'apt update && apt upgrade -y',
      'curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh',
      'systemctl enable docker && systemctl start docker',
      'curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash'
    ];

    try {
      for (let i = 0; i < commands.length; i++) {
        console.log(`🔄 تنفيذ الخطوة ${i + 1}/${commands.length}...`);
        const command = `ssh ${this.sshCredentials.username}@${this.serverIP} "${commands[i]}"`;
        await execAsync(command);
        console.log(`✅ الخطوة ${i + 1} مكتملة`);
      }

      console.log('✅ تم تثبيت Coolify بنجاح');
      console.log(`🌐 يمكنك الوصول إليه عبر: ${this.coolifyUrl}`);
      return true;
    } catch (error) {
      console.log('❌ خطأ في تثبيت Coolify:', error.message);
      return false;
    }
  }

  /**
   * إنشاء قاعدة بيانات PostgreSQL
   */
  async createPostgreSQLDatabase(authToken) {
    console.log('🗄️ إنشاء قاعدة بيانات PostgreSQL...');
    
    const password = this.generateSecurePassword();
    const databaseConfig = {
      name: 'golden-horse-postgres',
      type: 'postgresql',
      version: '15',
      database: 'golden_horse_production',
      username: 'golden_horse_user',
      password: password,
      port: 5432,
      environment: 'production',
      description: 'Golden Horse Shipping Database'
    };

    try {
      const response = await axios.post(`${this.coolifyUrl}/api/v1/databases`, databaseConfig, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ قاعدة البيانات تم إنشاؤها بنجاح');
      
      const connectionDetails = {
        host: this.serverIP,
        port: 5432,
        database: 'golden_horse_production',
        username: 'golden_horse_user',
        password: password,
        url: `postgresql://golden_horse_user:${password}@${this.serverIP}:5432/golden_horse_production`
      };

      console.log('📋 بيانات الاتصال:');
      console.log(`   Host: ${connectionDetails.host}`);
      console.log(`   Port: ${connectionDetails.port}`);
      console.log(`   Database: ${connectionDetails.database}`);
      console.log(`   Username: ${connectionDetails.username}`);
      console.log(`   Password: ${connectionDetails.password}`);

      return { success: true, connection: connectionDetails, response: response.data };
    } catch (error) {
      console.log('❌ خطأ في إنشاء قاعدة البيانات:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * إنشاء كلمة مرور آمنة
   */
  generateSecurePassword(length = 16) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  /**
   * تحديث ملف .env بالبيانات الجديدة
   */
  async updateEnvironmentFile(connectionDetails) {
    console.log('📝 تحديث ملف .env...');
    
    const envContent = `
# Database Configuration (Production - Coolify/Hostinger)
DB_HOST=${connectionDetails.host}
DB_PORT=${connectionDetails.port}
DB_NAME=${connectionDetails.database}
DB_USERNAME=${connectionDetails.username}
DB_PASSWORD=${connectionDetails.password}

# Connection URL
DATABASE_URL=${connectionDetails.url}

# Updated on: ${new Date().toISOString()}
`;

    try {
      const fs = await import('fs/promises');
      await fs.writeFile('../.env.production', envContent);
      console.log('✅ تم تحديث ملف .env.production');
      return true;
    } catch (error) {
      console.log('❌ خطأ في تحديث ملف .env:', error.message);
      return false;
    }
  }

  /**
   * تشغيل العملية الكاملة
   */
  async setupComplete() {
    console.log('🚀 بدء الإعداد الشامل لقاعدة البيانات');
    console.log('=' .repeat(50));

    // 1. التحقق من الوصولات
    const hostingerAccess = await this.checkHostingerAccess();
    const sshAccess = await this.checkSSHAccess();

    if (!sshAccess) {
      console.log('❌ لا يمكن المتابعة بدون وصول SSH');
      return false;
    }

    // 2. التحقق من Coolify
    const coolifyStatus = await this.checkCoolifyStatus();
    
    if (!coolifyStatus.available && coolifyStatus.needsInstallation) {
      const installed = await this.installCoolify();
      if (!installed) {
        console.log('❌ فشل في تثبيت Coolify');
        return false;
      }
      
      // انتظار حتى يبدأ Coolify
      console.log('⏳ انتظار بدء تشغيل Coolify...');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }

    // 3. إنشاء قاعدة البيانات
    console.log('💡 ملاحظة: ستحتاج إلى token من Coolify لإنشاء قاعدة البيانات');
    console.log(`🌐 اذهب إلى: ${this.coolifyUrl}`);
    console.log('📋 أنشئ حساب وأحصل على API token ثم شغل:');
    console.log('   node hostinger-coolify-setup.js --token YOUR_TOKEN');

    return true;
  }
}

// تشغيل السكريپت
async function main() {
  const config = {
    hostinger: {
      apiKey: process.env.HOSTINGER_API_KEY || null,
      endpoint: 'https://api.hostinger.com/v1'
    },
    serverIP: process.env.VPS_IP || 'YOUR_VPS_IP_HERE',
    ssh: {
      username: process.env.SSH_USERNAME || 'root'
    }
  };

  const manager = new HostingerCoolifyManager(config);
  
  if (process.argv.includes('--token')) {
    const tokenIndex = process.argv.indexOf('--token') + 1;
    const token = process.argv[tokenIndex];
    
    if (token) {
      const result = await manager.createPostgreSQLDatabase(token);
      if (result.success) {
        await manager.updateEnvironmentFile(result.connection);
      }
    } else {
      console.log('❌ يرجى تقديم token صحيح');
    }
  } else {
    await manager.setupComplete();
  }
}

// تشغيل السكريپت إذا تم استدعاؤه مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default HostingerCoolifyManager;
