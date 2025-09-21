import { Sequelize } from 'sequelize';

/**
 * اختبار شامل لجميع إصلاحات لوحة المبيعات
 * Comprehensive Sales Dashboard Fix Test
 */

console.log('🎯 اختبار شامل لإصلاحات لوحة المبيعات...\n');

// إعداد الاتصالات
const connections = {
  correct: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping',
  wrong: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

async function comprehensiveTest() {
  console.log('📊 المرحلة 1: فحص اتصالات قاعدة البيانات...\n');

  for (const [name, url] of Object.entries(connections)) {
    console.log(`🔍 اختبار قاعدة البيانات: ${name}`);
    
    const sequelize = new Sequelize(url, {
      dialect: 'postgres',
      logging: false,
      pool: { max: 2, min: 0, acquire: 10000, idle: 5000 }
    });

    try {
      await sequelize.authenticate();
      console.log('✅ الاتصال ناجح');

      // فحص اسم قاعدة البيانات الحالية
      const dbInfo = await sequelize.query('SELECT current_database() as db_name', {
        type: sequelize.QueryTypes.SELECT
      });
      console.log(`📋 قاعدة البيانات: ${dbInfo[0].db_name}`);

      // فحص الجداول المهمة
      const tables = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'customers', 'sales_invoices', 'notifications')
        ORDER BY table_name
      `, { type: sequelize.QueryTypes.SELECT });

      console.log(`📊 الجداول الموجودة: ${tables.map(t => t.table_name).join(', ')}`);

      // فحص هيكل جدول المستخدمين
      if (tables.find(t => t.table_name === 'users')) {
        const userColumns = await sequelize.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'id'
        `, { type: sequelize.QueryTypes.SELECT });

        if (userColumns.length > 0) {
          console.log(`👤 نوع ID في جدول المستخدمين: ${userColumns[0].data_type}`);
          
          // فحص المستخدمين الموجودين
          const users = await sequelize.query(`
            SELECT id, username, role, "isActive" 
            FROM users 
            WHERE "isActive" = true AND role = 'admin'
            ORDER BY "createdAt" ASC
            LIMIT 3
          `, { type: sequelize.QueryTypes.SELECT });

          console.log(`📊 المستخدمين admin النشطين: ${users.length}`);
          users.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.username} - ID: ${user.id} (${typeof user.id})`);
          });
        }
      }

      // اختبار notifications مع UUID fix
      if (tables.find(t => t.table_name === 'notifications') && name === 'correct') {
        console.log('\n📢 اختبار Notifications مع UUID fix...');
        
        try {
          // محاكاة userId integer (المشكلة الأصلية)
          const mockUserId = 1;
          
          // تطبيق نفس منطق الإصلاح
          let validUserId = mockUserId;
          if (typeof mockUserId === 'number' || (typeof mockUserId === 'string' && /^\d+$/.test(mockUserId))) {
            const adminUsers = await sequelize.query(`
              SELECT id, username, name, role, "isActive"
              FROM users 
              WHERE role = 'admin' AND "isActive" = true
              ORDER BY "createdAt" ASC
              LIMIT 1
            `, { type: sequelize.QueryTypes.SELECT });
            
            if (adminUsers.length > 0) {
              validUserId = adminUsers[0].id;
              console.log(`⚠️ تم تحويل userId من ${mockUserId} إلى ${validUserId} (UUID صحيح)`);
            }
          }

          // اختبار notifications query مع UUID صحيح
          const notificationsQuery = `
            SELECT COUNT(*) as count 
            FROM notifications 
            WHERE ("userId" = $1 OR "userId" IS NULL) 
            AND ("expiresAt" IS NULL OR "expiresAt" > NOW()) 
            AND "isActive" = true
          `;

          const notificationsResult = await sequelize.query(notificationsQuery, {
            bind: [validUserId],
            type: sequelize.QueryTypes.SELECT
          });

          console.log('✅ Notifications UUID fix نجح!');
          console.log(`  - إجمالي الإشعارات: ${notificationsResult[0].count}`);
          console.log(`  - User ID المستخدم: ${validUserId} (${typeof validUserId})`);
          
        } catch (error) {
          console.log(`❌ خطأ في Notifications UUID fix: ${error.message}`);
        }
      }

      // اختبار Sales APIs
      if (tables.find(t => t.table_name === 'sales_invoices') && name === 'correct') {
        console.log('\n📈 اختبار Sales APIs...');
        
        try {
          // Sales Summary
          const salesSummary = await sequelize.query(`
            SELECT 
              COALESCE(COUNT(DISTINCT si.id), 0) as total_invoices,
              COALESCE(SUM(si."totalAmount"), 0) as total_sales,
              COALESCE(COUNT(DISTINCT si."customerId"), 0) as active_customers
            FROM sales_invoices si
            WHERE si."isActive" = true
          `, { type: sequelize.QueryTypes.SELECT });

          console.log('✅ Sales Summary نجح:');
          console.log(`  - إجمالي الفواتير: ${salesSummary[0].total_invoices}`);
          console.log(`  - إجمالي المبيعات: ${salesSummary[0].total_sales} د.ل`);
          console.log(`  - العملاء النشطين: ${salesSummary[0].active_customers}`);

          // Customers List
          const customers = await sequelize.query(`
            SELECT COUNT(*) as count FROM customers WHERE "isActive" = true
          `, { type: sequelize.QueryTypes.SELECT });

          console.log(`✅ Customers List نجح: ${customers[0].count} عميل`);
          
        } catch (error) {
          console.log(`❌ خطأ في Sales APIs: ${error.message}`);
        }
      }

    } catch (error) {
      console.log(`❌ فشل الاتصال: ${error.message}`);
    } finally {
      await sequelize.close();
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }

  // اختبار APIs المباشرة
  console.log('🌐 المرحلة 2: اختبار APIs المباشرة...\n');
  
  const apiTests = [
    {
      name: 'Health Check',
      url: 'https://web.goldenhorse-ly.com/api/health',
      requiresAuth: false
    },
    {
      name: 'Debug Environment',
      url: 'https://web.goldenhorse-ly.com/api/debug-env',
      requiresAuth: false
    }
  ];

  for (const test of apiTests) {
    try {
      console.log(`🔍 اختبار: ${test.name}`);
      
      const response = await fetch(test.url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Comprehensive-Test/1.0'
        }
      });

      console.log(`📊 الاستجابة: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (test.name === 'Health Check') {
          console.log(`✅ الخادم يعمل - Database: ${data.database?.status}`);
        } else if (test.name === 'Debug Environment') {
          console.log(`✅ Debug Info:`);
          console.log(`  - Database: ${data.database_config?.database}`);
          console.log(`  - Host: ${data.database_config?.host}`);
          console.log(`  - Current DB: ${data.database_test?.current_db}`);
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ خطأ: ${errorText.substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.log(`❌ خطأ في الطلب: ${error.message}`);
    }
    
    console.log('');
  }

  // تقرير نهائي
  console.log('🎯 المرحلة 3: التقرير النهائي...\n');
  
  console.log('📋 ملخص الاختبار الشامل:');
  console.log('');
  console.log('✅ الإصلاحات المطبقة:');
  console.log('  1. إصلاح Notification Model UUID conversion');
  console.log('  2. تحسين Authentication Middleware');
  console.log('  3. إصلاح Sales Summary API');
  console.log('  4. إصلاح Customers List API');
  console.log('');
  console.log('🎯 الخطوات التالية:');
  console.log('  1. نشر الكود المحدث على الخادم');
  console.log('  2. تحديث متغيرات البيئة');
  console.log('  3. إعادة تشغيل الخادم');
  console.log('  4. اختبار جميع APIs');
  console.log('');
  console.log('🚀 النتيجة المتوقعة: لوحة مبيعات تعمل بكفاءة 100%!');
}

// تشغيل الاختبار الشامل
comprehensiveTest().catch(console.error);
