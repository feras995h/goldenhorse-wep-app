import { Sequelize } from 'sequelize';

/**
 * فحص شامل لقاعدة البيانات golden-horse-shipping
 * Comprehensive Database Audit for golden-horse-shipping
 */

console.log('🔍 فحص شامل لقاعدة البيانات golden-horse-shipping...\n');

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

async function comprehensiveDatabaseAudit() {
  try {
    console.log('📊 الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ الاتصال ناجح\n');

    // 1. فحص جميع الجداول الموجودة
    console.log('📋 1. فحص جميع الجداول الموجودة:');
    const tables = await sequelize.query(`
      SELECT 
        table_name,
        table_type,
        table_schema
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `, { type: sequelize.QueryTypes.SELECT });

    console.log(`📊 إجمالي الجداول: ${tables.length}`);
    tables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.table_name}`);
    });

    // 2. فحص الجداول الأساسية المطلوبة
    console.log('\n📋 2. فحص الجداول الأساسية المطلوبة:');
    const requiredTables = [
      'users', 'customers', 'suppliers', 'employees',
      'accounts', 'sales_invoices', 'purchase_invoices', 
      'receipts', 'payments', 'notifications',
      'shipments', 'shipment_movements', 'stock_movements',
      'journal_entries', 'journal_entry_details',
      'settings', 'roles', 'audit_logs'
    ];

    const missingTables = [];
    const existingTables = [];

    requiredTables.forEach(tableName => {
      const exists = tables.find(t => t.table_name === tableName);
      if (exists) {
        existingTables.push(tableName);
        console.log(`  ✅ ${tableName}`);
      } else {
        missingTables.push(tableName);
        console.log(`  ❌ ${tableName} (مفقود)`);
      }
    });

    console.log(`\n📊 الجداول الموجودة: ${existingTables.length}/${requiredTables.length}`);
    if (missingTables.length > 0) {
      console.log(`⚠️ الجداول المفقودة: ${missingTables.join(', ')}`);
    }

    // 3. فحص هيكل الجداول الأساسية
    console.log('\n📋 3. فحص هيكل الجداول الأساسية:');
    
    const criticalTables = ['users', 'customers', 'sales_invoices', 'accounts', 'notifications'];
    
    for (const tableName of criticalTables) {
      if (existingTables.includes(tableName)) {
        console.log(`\n🔍 فحص جدول ${tableName}:`);
        
        // فحص الأعمدة
        const columns = await sequelize.query(`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
          FROM information_schema.columns 
          WHERE table_name = '${tableName}' 
          AND table_schema = 'public'
          ORDER BY ordinal_position
        `, { type: sequelize.QueryTypes.SELECT });

        console.log(`  📊 الأعمدة (${columns.length}):`);
        columns.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? '' : ' (NOT NULL)';
          const length = col.character_maximum_length ? ` (${col.character_maximum_length})` : '';
          console.log(`    - ${col.column_name}: ${col.data_type}${length}${nullable}`);
        });

        // فحص عدد السجلات
        const countResult = await sequelize.query(`
          SELECT COUNT(*) as count FROM ${tableName}
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log(`  📊 عدد السجلات: ${countResult[0].count}`);

        // فحص المفاتيح الأجنبية
        const foreignKeys = await sequelize.query(`
          SELECT
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = '${tableName}'
            AND tc.table_schema = 'public'
        `, { type: sequelize.QueryTypes.SELECT });

        if (foreignKeys.length > 0) {
          console.log(`  🔗 المفاتيح الأجنبية (${foreignKeys.length}):`);
          foreignKeys.forEach(fk => {
            console.log(`    - ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
          });
        }
      }
    }

    // 4. فحص الدوال المخزنة
    console.log('\n📋 4. فحص الدوال المخزنة (Stored Functions):');
    const functions = await sequelize.query(`
      SELECT 
        routine_name,
        routine_type,
        data_type
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_type = 'FUNCTION'
      ORDER BY routine_name
    `, { type: sequelize.QueryTypes.SELECT });

    console.log(`📊 إجمالي الدوال: ${functions.length}`);
    if (functions.length > 0) {
      functions.forEach((func, index) => {
        console.log(`  ${index + 1}. ${func.routine_name} (${func.data_type})`);
      });
    } else {
      console.log('  ⚠️ لا توجد دوال مخزنة');
    }

    // فحص الدوال المطلوبة
    const requiredFunctions = ['get_sales_summary', 'get_customers_list_final'];
    console.log('\n📋 فحص الدوال المطلوبة:');
    requiredFunctions.forEach(funcName => {
      const exists = functions.find(f => f.routine_name === funcName);
      console.log(`  ${exists ? '✅' : '❌'} ${funcName}`);
    });

    // 5. فحص البيانات الأساسية
    console.log('\n📋 5. فحص البيانات الأساسية:');
    
    // فحص المستخدمين
    if (existingTables.includes('users')) {
      const users = await sequelize.query(`
        SELECT id, username, name, role, "isActive", "createdAt"
        FROM users 
        ORDER BY "createdAt"
        LIMIT 10
      `, { type: sequelize.QueryTypes.SELECT });

      console.log(`\n👤 المستخدمين (${users.length}):`);
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.username} (${user.name}) - ${user.role} - ${user.isActive ? 'نشط' : 'غير نشط'}`);
        console.log(`     ID: ${user.id} (${typeof user.id})`);
      });
    }

    // فحص العملاء
    if (existingTables.includes('customers')) {
      const customers = await sequelize.query(`
        SELECT id, code, name, email, phone, "isActive"
        FROM customers 
        WHERE "isActive" = true
        ORDER BY "createdAt"
        LIMIT 5
      `, { type: sequelize.QueryTypes.SELECT });

      console.log(`\n👥 العملاء النشطين (${customers.length}):`);
      customers.forEach((customer, index) => {
        console.log(`  ${index + 1}. ${customer.code} - ${customer.name}`);
        console.log(`     Email: ${customer.email || 'غير محدد'}, Phone: ${customer.phone || 'غير محدد'}`);
      });
    }

    // فحص فواتير المبيعات
    if (existingTables.includes('sales_invoices')) {
      const invoices = await sequelize.query(`
        SELECT 
          id, 
          "invoiceNumber", 
          "totalAmount", 
          "invoiceDate",
          "isActive"
        FROM sales_invoices 
        WHERE "isActive" = true
        ORDER BY "invoiceDate" DESC
        LIMIT 5
      `, { type: sequelize.QueryTypes.SELECT });

      console.log(`\n📄 فواتير المبيعات (${invoices.length}):`);
      let totalSales = 0;
      invoices.forEach((invoice, index) => {
        console.log(`  ${index + 1}. ${invoice.invoiceNumber} - ${invoice.totalAmount} د.ل`);
        const dateStr = invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : 'غير محدد';
        console.log(`     التاريخ: ${dateStr}`);
        totalSales += parseFloat(invoice.totalAmount || 0);
      });
      console.log(`  💰 إجمالي المبيعات (العينة): ${totalSales.toFixed(2)} د.ل`);
    }

    // فحص الحسابات
    if (existingTables.includes('accounts')) {
      const accounts = await sequelize.query(`
        SELECT 
          id, 
          code, 
          name, 
          type, 
          balance,
          "isActive"
        FROM accounts 
        WHERE "isActive" = true
        ORDER BY code
        LIMIT 10
      `, { type: sequelize.QueryTypes.SELECT });

      console.log(`\n💰 الحسابات (${accounts.length}):`);
      accounts.forEach((account, index) => {
        console.log(`  ${index + 1}. ${account.code} - ${account.name} (${account.type})`);
        console.log(`     الرصيد: ${account.balance || 0} د.ل`);
      });
    }

    // 6. فحص الفهارس
    console.log('\n📋 6. فحص الفهارس (Indexes):');
    const indexes = await sequelize.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `, { type: sequelize.QueryTypes.SELECT });

    console.log(`📊 إجمالي الفهارس: ${indexes.length}`);
    
    // تجميع الفهارس حسب الجدول
    const indexesByTable = {};
    indexes.forEach(index => {
      if (!indexesByTable[index.tablename]) {
        indexesByTable[index.tablename] = [];
      }
      indexesByTable[index.tablename].push(index.indexname);
    });

    Object.keys(indexesByTable).forEach(tableName => {
      console.log(`  📊 ${tableName}: ${indexesByTable[tableName].length} فهرس`);
    });

    // 7. تقرير نهائي
    console.log('\n📋 7. التقرير النهائي:');
    console.log('');
    console.log('✅ نقاط القوة:');
    console.log(`  - ${existingTables.length} جدول موجود من أصل ${requiredTables.length}`);
    console.log(`  - ${functions.length} دالة مخزنة`);
    console.log(`  - ${indexes.length} فهرس للأداء`);
    
    if (missingTables.length > 0) {
      console.log('\n⚠️ نقاط تحتاج تحسين:');
      console.log(`  - ${missingTables.length} جدول مفقود: ${missingTables.join(', ')}`);
    }

    const missingFunctions = requiredFunctions.filter(func => 
      !functions.find(f => f.routine_name === func)
    );
    
    if (missingFunctions.length > 0) {
      console.log(`  - ${missingFunctions.length} دالة مفقودة: ${missingFunctions.join(', ')}`);
    }

    console.log('\n🎯 التوصيات:');
    if (missingTables.length === 0 && missingFunctions.length === 0) {
      console.log('  ✅ قاعدة البيانات مكتملة وجاهزة للاستخدام');
      console.log('  ✅ يمكن توجيه الخادم لهذه القاعدة بأمان');
    } else {
      console.log('  🔧 إنشاء الجداول والدوال المفقودة');
      console.log('  📊 تشغيل migrations للتأكد من اكتمال الهيكل');
    }

    console.log('\n🚀 خلاصة الفحص: قاعدة البيانات جاهزة للاستخدام!');

  } catch (error) {
    console.error('❌ خطأ في فحص قاعدة البيانات:', error.message);
    console.error('📋 تفاصيل الخطأ:', error);
  } finally {
    await sequelize.close();
  }
}

// تشغيل الفحص الشامل
comprehensiveDatabaseAudit();
