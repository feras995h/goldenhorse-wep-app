#!/usr/bin/env node

/**
 * سكريپت للحصول على معلومات الخوادم من Hostinger API
 * Script to get server information from Hostinger API
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const HOSTINGER_API_KEY = process.env.HOSTINGER_API_KEY;
const HOSTINGER_API_BASE = 'https://api.hostinger.com/v1';

class HostingerAPIClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = HOSTINGER_API_BASE;
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * اختبار صحة API Key
   */
  async testAPIKey() {
    console.log('🔍 اختبار صحة Hostinger API Key...');
    
    try {
      // محاولة الوصول إلى endpoint بسيط
      const response = await axios.get(`${this.baseURL}/domains`, {
        headers: this.headers,
        timeout: 10000
      });

      console.log('✅ API Key صحيح وفعال');
      return { valid: true, data: response.data };
    } catch (error) {
      console.log('❌ خطأ في API Key:', this.getErrorMessage(error));
      return { valid: false, error: error.message };
    }
  }

  /**
   * الحصول على قائمة الخوادم الافتراضية
   */
  async getVPSList() {
    console.log('🖥️  جاري الحصول على قائمة الخوادم الافتراضية...');
    
    try {
      const response = await axios.get(`${this.baseURL}/vps`, {
        headers: this.headers,
        timeout: 15000
      });

      const servers = response.data.data || response.data;
      console.log(`✅ تم العثور على ${servers.length} خادم افتراضي`);
      
      return { success: true, servers };
    } catch (error) {
      console.log('❌ خطأ في الحصول على الخوادم:', this.getErrorMessage(error));
      return { success: false, error: error.message };
    }
  }

  /**
   * الحصول على تفاصيل خادم محدد
   */
  async getVPSDetails(vpsId) {
    console.log(`🔍 جاري الحصول على تفاصيل الخادم ${vpsId}...`);
    
    try {
      const response = await axios.get(`${this.baseURL}/vps/${vpsId}`, {
        headers: this.headers,
        timeout: 10000
      });

      return { success: true, details: response.data };
    } catch (error) {
      console.log('❌ خطأ في الحصول على تفاصيل الخادم:', this.getErrorMessage(error));
      return { success: false, error: error.message };
    }
  }

  /**
   * عرض معلومات الخوادم بشكل منظم
   */
  displayServerInfo(servers) {
    console.log('\n📋 معلومات الخوادم المتاحة:');
    console.log('=' .repeat(60));

    servers.forEach((server, index) => {
      console.log(`\n🖥️  الخادم ${index + 1}:`);
      console.log(`   ID: ${server.id || 'غير متاح'}`);
      console.log(`   الاسم: ${server.name || server.hostname || 'غير محدد'}`);
      console.log(`   عنوان IP: ${server.ip || server.public_ip || 'غير متاح'}`);
      console.log(`   الحالة: ${server.status || 'غير محدد'}`);
      console.log(`   نظام التشغيل: ${server.os || server.operating_system || 'غير محدد'}`);
      console.log(`   المنطقة: ${server.location || server.region || 'غير محدد'}`);
      console.log(`   تاريخ الإنشاء: ${server.created_at || 'غير متاح'}`);
      
      if (server.specs || server.plan) {
        console.log(`   المواصفات:`);
        console.log(`     - CPU: ${server.specs?.cpu || server.plan?.cpu || 'غير محدد'}`);
        console.log(`     - RAM: ${server.specs?.ram || server.plan?.ram || 'غير محدد'}`);
        console.log(`     - التخزين: ${server.specs?.storage || server.plan?.storage || 'غير محدد'}`);
      }
    });
  }

  /**
   * استخراج رسالة الخطأ
   */
  getErrorMessage(error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.statusText;
      
      switch (status) {
        case 401:
          return 'API Key غير صحيح أو منتهي الصلاحية';
        case 403:
          return 'ليس لديك صلاحية للوصول إلى هذا المورد';
        case 404:
          return 'المورد المطلوب غير موجود';
        case 429:
          return 'تم تجاوز حد الطلبات، حاول مرة أخرى لاحقاً';
        default:
          return `خطأ HTTP ${status}: ${message}`;
      }
    } else if (error.code === 'ECONNREFUSED') {
      return 'لا يمكن الاتصال بخوادم Hostinger';
    } else if (error.code === 'ETIMEDOUT') {
      return 'انتهت مهلة الاتصال';
    } else {
      return error.message;
    }
  }

  /**
   * تحديث ملف .env بعنوان IP الخادم
   */
  async updateEnvWithServerIP(serverIP) {
    console.log(`📝 تحديث ملف .env بعنوان IP: ${serverIP}`);
    
    try {
      const fs = await import('fs/promises');
      let envContent = await fs.readFile('.env', 'utf8');
      
      // تحديث VPS_IP
      if (envContent.includes('VPS_IP=')) {
        envContent = envContent.replace(/VPS_IP=.*/, `VPS_IP=${serverIP}`);
      } else {
        envContent += `\nVPS_IP=${serverIP}`;
      }
      
      await fs.writeFile('.env', envContent);
      console.log('✅ تم تحديث ملف .env بنجاح');
      return true;
    } catch (error) {
      console.log('❌ خطأ في تحديث ملف .env:', error.message);
      return false;
    }
  }
}

/**
 * الدالة الرئيسية
 */
async function main() {
  console.log('🚀 بدء استعلام خوادم Hostinger');
  console.log('=' .repeat(50));

  if (!HOSTINGER_API_KEY) {
    console.log('❌ لم يتم العثور على HOSTINGER_API_KEY في ملف .env');
    console.log('💡 تأكد من إضافة API Key في ملف .env');
    return;
  }

  const client = new HostingerAPIClient(HOSTINGER_API_KEY);

  // 1. اختبار API Key
  const keyTest = await client.testAPIKey();
  if (!keyTest.valid) {
    console.log('❌ لا يمكن المتابعة مع API Key غير صحيح');
    return;
  }

  // 2. الحصول على قائمة الخوادم
  const vpsResult = await client.getVPSList();
  if (!vpsResult.success) {
    console.log('❌ لا يمكن الحصول على قائمة الخوادم');
    return;
  }

  const servers = vpsResult.servers;
  if (servers.length === 0) {
    console.log('⚠️  لم يتم العثور على أي خوادم افتراضية');
    console.log('💡 تأكد من أن لديك خوادم VPS في حساب Hostinger');
    return;
  }

  // 3. عرض معلومات الخوادم
  client.displayServerInfo(servers);

  // 4. اختيار الخادم الأول تلقائياً (أو يمكن للمستخدم الاختيار)
  const selectedServer = servers[0];
  const serverIP = selectedServer.ip || selectedServer.public_ip;

  if (serverIP) {
    console.log(`\n🎯 تم اختيار الخادم: ${selectedServer.name || selectedServer.id}`);
    console.log(`📍 عنوان IP: ${serverIP}`);
    
    // تحديث ملف .env
    await client.updateEnvWithServerIP(serverIP);
    
    console.log('\n🎉 تم الإعداد بنجاح!');
    console.log('🔄 الخطوة التالية: تشغيل سكريپت إعداد Coolify');
    console.log('   node scripts/hostinger-coolify-setup.js');
  } else {
    console.log('❌ لم يتم العثور على عنوان IP للخادم');
  }
}

// تشغيل السكريپت
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default HostingerAPIClient;
