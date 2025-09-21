import { Sequelize } from 'sequelize';

/**
 * فحص حالة الخادم الحالية بعد النشر وضبط متغيرات البيئة
 * Debug Current Server Status After Deployment
 */

console.log('🔍 فحص حالة الخادم الحالية...\n');

// اختبار الاتصالات المختلفة
const connections = [
  {
    name: 'قاعدة البيانات الجديدة (golden-horse-shipping)',
    url: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping'
  },
  {
    name: 'قاعدة البيانات القديمة (postgres)',
    url: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
  }
];

async function debugServerStatus() {
  console.log('🔍 اختبار الاتصالات المختلفة...\n');

  for (const conn of connections) {
    console.log(`📊 اختبار: ${conn.name}`);
    
    const sequelize = new Sequelize(conn.url, {
      dialect: 'postgres',
      logging: false,
      pool: { max: 2, min: 0, acquire: 10000, idle: 5000 }
    });

    try {
      await sequelize.authenticate();
      console.log('✅ الاتصال ناجح');

      // فحص الجداول الموجودة
      const tables = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `, { type: sequelize.QueryTypes.SELECT });

      console.log(`📋 الجداول الموجودة (${tables.length}):`);
      const importantTables = ['users', 'customers', 'sales_invoices', 'notifications', 'accounts'];
      
      importantTables.forEach(tableName => {
        const exists = tables.find(t => t.table_name === tableName);
        console.log(`  ${exists ? '✅' : '❌'} ${tableName}`);
      });

      // فحص الدوال المطلوبة
      console.log('\n🔧 فحص الدوال المطلوبة:');
      const functions = await sequelize.query(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_type = 'FUNCTION'
        AND routine_name IN ('get_sales_summary', 'get_customers_list_final')
      `, { type: sequelize.QueryTypes.SELECT });

      const requiredFunctions = ['get_sales_summary', 'get_customers_list_final'];
      requiredFunctions.forEach(funcName => {
        const exists = functions.find(f => f.routine_name === funcName);
        console.log(`  ${exists ? '✅' : '❌'} ${funcName}`);
      });

      // فحص هيكل جدول المستخدمين
      if (tables.find(t => t.table_name === 'users')) {
        console.log('\n👤 فحص هيكل جدول المستخدمين:');
        const userColumns = await sequelize.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'users' 
          AND table_schema = 'public'
          ORDER BY ordinal_position
        `, { type: sequelize.QueryTypes.SELECT });

        userColumns.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
        });

        // فحص المستخدمين الموجودين
        const users = await sequelize.query(`
          SELECT id, username, name, role, "isActive" 
          FROM users 
          WHERE "isActive" = true
          ORDER BY "createdAt"
        `, { type: sequelize.QueryTypes.SELECT });

        console.log(`\n📊 المستخدمين النشطين (${users.length}):`);
        users.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.username} (${user.name}) - ${user.role} - ID: ${user.id}`);
        });
      }

      // اختبار الاستعلامات المشكلة
      if (tables.find(t => t.table_name === 'sales_invoices')) {
        console.log('\n📈 اختبار Sales Summary:');
        try {
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
          console.log(`  - إجمالي المبيعات: ${salesSummary[0].total_sales}`);
          console.log(`  - العملاء النشطين: ${salesSummary[0].active_customers}`);
        } catch (error) {
          console.log(`❌ خطأ في Sales Summary: ${error.message}`);
        }
      }

      if (tables.find(t => t.table_name === 'customers')) {
        console.log('\n👥 اختبار Customers List:');
        try {
          const customers = await sequelize.query(`
            SELECT COUNT(*) as count FROM customers WHERE "isActive" = true
          `, { type: sequelize.QueryTypes.SELECT });

          console.log(`✅ Customers List نجح: ${customers[0].count} عميل`);
        } catch (error) {
          console.log(`❌ خطأ في Customers List: ${error.message}`);
        }
      }

      if (tables.find(t => t.table_name === 'notifications')) {
        console.log('\n📢 اختبار Notifications:');
        try {
          // اختبار مع UUID صحيح
          const users = await sequelize.query(`
            SELECT id FROM users WHERE role = 'admin' AND "isActive" = true LIMIT 1
          `, { type: sequelize.QueryTypes.SELECT });

          if (users.length > 0) {
            const notifications = await sequelize.query(`
              SELECT COUNT(*) as count 
              FROM notifications 
              WHERE ("userId" = $1 OR "userId" IS NULL) 
              AND ("expiresAt" IS NULL OR "expiresAt" > NOW()) 
              AND "isActive" = true
            `, { 
              bind: [users[0].id],
              type: sequelize.QueryTypes.SELECT 
            });

            console.log(`✅ Notifications نجح: ${notifications[0].count} إشعار`);
          } else {
            console.log('❌ لا يوجد مستخدم admin للاختبار');
          }
        } catch (error) {
          console.log(`❌ خطأ في Notifications: ${error.message}`);
        }
      }

    } catch (error) {
      console.log(`❌ فشل الاتصال: ${error.message}`);
    } finally {
      await sequelize.close();
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }

  // اختبار APIs مباشرة
  console.log('🌐 اختبار APIs مباشرة...\n');
  
  const apiTests = [
    'https://web.goldenhorse-ly.com/api/health',
    'https://web.goldenhorse-ly.com/api/sales/summary',
    'https://web.goldenhorse-ly.com/api/sales/customers?limit=5',
    'https://web.goldenhorse-ly.com/api/financial/summary'
  ];

  for (const apiUrl of apiTests) {
    try {
      console.log(`🔍 اختبار: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Debug-Script/1.0'
        }
      });

      console.log(`📊 الاستجابة: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ البيانات: ${JSON.stringify(data).substring(0, 200)}...`);
      } else {
        const errorText = await response.text();
        console.log(`❌ خطأ: ${errorText.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`❌ خطأ في الطلب: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('🎯 انتهاء فحص حالة الخادم');
}

// تشغيل الفحص
debugServerStatus().catch(console.error);
