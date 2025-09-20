#!/usr/bin/env node

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import models from '../src/models/index.js';
import { createAuditLog } from '../src/middleware/auditTrail.js';

// تحميل متغيرات البيئة
dotenv.config();

const { AuditLog, User, Account } = models;

async function testAuditTrail() {
  console.log('🔍 اختبار نظام Audit Trail...');
  
  try {
    // التأكد من وجود المستخدم
    const [user] = await User.findAll({ limit: 1 });
    if (!user) {
      console.error('❌ لا يوجد مستخدمين في النظام');
      return;
    }

    console.log(`✅ تم العثور على المستخدم: ${user.username}`);

    // اختبار 1: إنشاء سجل تدقيق يدوي
    console.log('\n📝 اختبار 1: إنشاء سجل تدقيق يدوي...');
    
    const testAuditLog = await createAuditLog({
      tableName: 'accounts',
      recordId: '12345678-1234-1234-1234-123456789012',
      action: 'UPDATE',
      userId: user.id,
      oldValues: { balance: 1000.00, name: 'حساب قديم' },
      newValues: { balance: 1500.00, name: 'حساب محدث' },
      description: 'اختبار تحديث رصيد الحساب',
      severity: 'MEDIUM',
      businessImpact: 'تغيير في الرصيد قد يؤثر على التقارير المالية'
    });

    console.log('✅ تم إنشاء سجل التدقيق بنجاح');

    // اختبار 2: البحث عن سجلات التدقيق
    console.log('\n🔍 اختبار 2: البحث عن سجلات التدقيق...');
    
    const auditLogs = await AuditLog.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'name'] }]
    });

    console.log(`✅ تم العثور على ${auditLogs.length} سجل تدقيق`);
    
    auditLogs.forEach((log, index) => {
      console.log(`${index + 1}. [${log.action}] ${log.tableName} - ${log.description || 'بدون وصف'}`);
      console.log(`   المستخدم: ${log.user?.username || 'غير معروف'}`);
      console.log(`   التاريخ: ${log.createdAt}`);
      console.log(`   الخطورة: ${log.severity}`);
      
      if (log.changedFields && log.changedFields.length > 0) {
        console.log(`   الحقول المتغيرة: ${log.changedFields.join(', ')}`);
      }
      
      console.log('');
    });

    // اختبار 3: البحث عن التغييرات المالية
    console.log('\n💰 اختبار 3: البحث عن التغييرات المالية...');
    
    const financialLogs = await AuditLog.findFinancialChanges();
    console.log(`✅ تم العثور على ${financialLogs.length} تغيير مالي`);

    // اختبار 4: البحث عن سجلات مستخدم معين
    console.log('\n👤 اختبار 4: البحث عن سجلات مستخدم معين...');
    
    const userLogs = await AuditLog.findByUser(user.id);
    console.log(`✅ تم العثور على ${userLogs.length} سجل للمستخدم ${user.username}`);

    // اختبار 5: اختبار الطرق المساعدة
    console.log('\n🔧 اختبار 5: اختبار الطرق المساعدة...');
    
    if (auditLogs.length > 0) {
      const firstLog = auditLogs[0];
      
      console.log(`هل له تأثير مالي؟ ${firstLog.hasFinancialImpact() ? 'نعم' : 'لا'}`);
      
      const formattedChanges = firstLog.getFormattedChanges();
      if (formattedChanges) {
        console.log('التغييرات المنسقة:');
        formattedChanges.forEach(change => {
          console.log(`  - ${change.field}: ${change.oldValue} → ${change.newValue}`);
        });
      }
    }

    // إحصائيات عامة
    console.log('\n📊 إحصائيات عامة:');
    
    const stats = await AuditLog.findAll({
      attributes: [
        'action',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['action'],
      raw: true
    });

    console.log('توزيع العمليات:');
    stats.forEach(stat => {
      console.log(`  ${stat.action}: ${stat.count}`);
    });

    const categoryStats = await AuditLog.findAll({
      attributes: [
        'category',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['category'],
      raw: true
    });

    console.log('\nتوزيع الفئات:');
    categoryStats.forEach(stat => {
      console.log(`  ${stat.category}: ${stat.count}`);
    });

    console.log('\n✅ انتهى اختبار نظام Audit Trail بنجاح');

  } catch (error) {
    console.error('❌ خطأ في اختبار نظام Audit Trail:', error);
    throw error;
  }
}

// تشغيل الاختبار
testAuditTrail()
  .then(() => {
    console.log('\n🎉 تم اختبار نظام Audit Trail بنجاح');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 فشل اختبار نظام Audit Trail:', error);
    process.exit(1);
  });
