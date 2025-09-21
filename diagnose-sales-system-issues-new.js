import { Sequelize, DataTypes, Op } from 'sequelize';

/**
 * تشخيص شامل لمشاكل نظام المبيعات
 * Comprehensive Sales System Issues Diagnosis
 */

console.log('🛒 بدء التشخيص الشامل لمشاكل نظام المبيعات...\n');

// إعداد الاتصال بقاعدة البيانات
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

async function diagnoseSalesSystemIssues() {
  try {
    console.log('📊 فحص الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ الاتصال بقاعدة البيانات ناجح\n');

    // فحص الجداول المتعلقة بالمبيعات
    console.log('🔍 فحص الجداول المتعلقة بالمبيعات...');
    
    const salesTables = [
      'sales_invoices', 
      'sales_invoice_items', 
      'sales_invoice_payments',
      'customers', 
      'sales_returns',
      'invoices',
      'invoice_payments',
      'invoice_receipts'
    ];
    
    for (const tableName of salesTables) {
      try {
        const tableExists = await sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = '${tableName}'
          )
        `, { type: sequelize.QueryTypes.SELECT });
        
        if (tableExists[0].exists) {
          console.log(`✅ جدول ${tableName} موجود`);
          
          // فحص بنية الجدول
          const columns = await sequelize.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = '${tableName}'
            ORDER BY ordinal_position
          `, { type: sequelize.QueryTypes.SELECT });
          
          console.log(`   📋 أعمدة جدول ${tableName} (${columns.length} عمود):`);
          columns.forEach(col => {
            const defaultVal = col.column_default ? ` (default: ${col.column_default})` : '';
            console.log(`     - ${col.column_name}: ${col.data_type}${defaultVal}`);
          });
          
          // فحص عدد السجلات
          const count = await sequelize.query(`
            SELECT COUNT(*) as count FROM ${tableName}
          `, { type: sequelize.QueryTypes.SELECT });
          
          console.log(`   📊 عدد السجلات: ${count[0].count}\n`);
        } else {
          console.log(`❌ جدول ${tableName} غير موجود\n`);
        }
      } catch (error) {
        console.log(`❌ خطأ في فحص جدول ${tableName}: ${error.message}\n`);
      }
    }

    // اختبار APIs المبيعات الأساسية
    console.log('🧪 اختبار APIs المبيعات الأساسية...');
    
    // اختبار sales summary
    console.log('\n📊 اختبار sales summary...');
    try {
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_invoices,
          COALESCE(SUM("totalAmount"), 0) as total_amount,
          COUNT(DISTINCT "customerId") as unique_customers
        FROM sales_invoices 
        WHERE "isActive" = true
      `;
      
      const summary = await sequelize.query(summaryQuery, { type: sequelize.QueryTypes.SELECT });
      console.log(`✅ Sales summary نجح:`);
      console.log(`   - إجمالي الفواتير: ${summary[0].total_invoices}`);
      console.log(`   - إجمالي المبلغ: ${summary[0].total_amount} د.ل`);
      console.log(`   - عدد العملاء: ${summary[0].unique_customers}`);
    } catch (error) {
      console.log(`❌ خطأ في sales summary: ${error.message}`);
    }

    // اختبار customers query
    console.log('\n👥 اختبار customers query...');
    try {
      const customersQuery = `
        SELECT 
          c.id, c.name, c.code, c."isActive", c.balance,
          COUNT(si.id) as invoice_count,
          COALESCE(SUM(si."totalAmount"), 0) as total_sales
        FROM customers c
        LEFT JOIN sales_invoices si ON c.id = si."customerId" AND si."isActive" = true
        WHERE c."isActive" = true
        GROUP BY c.id, c.name, c.code, c."isActive", c.balance
        ORDER BY total_sales DESC
        LIMIT 10
      `;
      
      const customers = await sequelize.query(customersQuery, { type: sequelize.QueryTypes.SELECT });
      console.log(`✅ Customers query نجح - ${customers.length} عميل`);
      
      if (customers.length > 0) {
        console.log('   📋 عينة من العملاء:');
        customers.slice(0, 3).forEach((customer, index) => {
          console.log(`     ${index + 1}. ${customer.name} (${customer.code}) - ${customer.total_sales} د.ل`);
        });
      }
    } catch (error) {
      console.log(`❌ خطأ في customers query: ${error.message}`);
    }

    // اختبار sales invoices query
    console.log('\n📄 اختبار sales invoices query...');
    try {
      const invoicesQuery = `
        SELECT 
          si.id, si."invoiceNumber", si."invoiceDate", si."totalAmount", si.status,
          c.name as customer_name, c.code as customer_code
        FROM sales_invoices si
        LEFT JOIN customers c ON si."customerId" = c.id
        WHERE si."isActive" = true
        ORDER BY si."invoiceDate" DESC
        LIMIT 10
      `;
      
      const invoices = await sequelize.query(invoicesQuery, { type: sequelize.QueryTypes.SELECT });
      console.log(`✅ Sales invoices query نجح - ${invoices.length} فاتورة`);
      
      if (invoices.length > 0) {
        console.log('   📋 عينة من الفواتير:');
        invoices.slice(0, 3).forEach((invoice, index) => {
          console.log(`     ${index + 1}. ${invoice.invoiceNumber} - ${invoice.totalAmount} د.ل (${invoice.customer_name})`);
        });
      }
    } catch (error) {
      console.log(`❌ خطأ في sales invoices query: ${error.message}`);
    }

    // فحص مشاكل محتملة في الأعمدة
    console.log('\n🔍 فحص مشاكل محتملة في الأعمدة...');
    
    // فحص sales_invoices
    try {
      const salesInvoicesColumns = await sequelize.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'sales_invoices'
      `, { type: sequelize.QueryTypes.SELECT });
      
      const requiredColumns = ['isActive', 'totalAmount', 'customerId', 'invoiceNumber', 'invoiceDate'];
      const missingColumns = requiredColumns.filter(col => 
        !salesInvoicesColumns.some(dbCol => dbCol.column_name === col)
      );
      
      if (missingColumns.length > 0) {
        console.log(`❌ أعمدة مفقودة في sales_invoices: ${missingColumns.join(', ')}`);
      } else {
        console.log(`✅ جميع الأعمدة المطلوبة موجودة في sales_invoices`);
      }
    } catch (error) {
      console.log(`❌ خطأ في فحص أعمدة sales_invoices: ${error.message}`);
    }

    // فحص customers
    try {
      const customersColumns = await sequelize.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'customers'
      `, { type: sequelize.QueryTypes.SELECT });
      
      const requiredColumns = ['isActive', 'balance', 'category'];
      const missingColumns = requiredColumns.filter(col => 
        !customersColumns.some(dbCol => dbCol.column_name === col)
      );
      
      if (missingColumns.length > 0) {
        console.log(`❌ أعمدة مفقودة في customers: ${missingColumns.join(', ')}`);
      } else {
        console.log(`✅ جميع الأعمدة المطلوبة موجودة في customers`);
      }
    } catch (error) {
      console.log(`❌ خطأ في فحص أعمدة customers: ${error.message}`);
    }

    // اختبار استعلام مشابه لما في sales dashboard
    console.log('\n📊 اختبار استعلام sales dashboard...');
    try {
      const dashboardQuery = `
        SELECT 
          (SELECT COUNT(*) FROM sales_invoices WHERE "isActive" = true) as total_invoices,
          (SELECT COUNT(*) FROM customers WHERE "isActive" = true) as total_customers,
          (SELECT COALESCE(SUM("totalAmount"), 0) FROM sales_invoices WHERE "isActive" = true) as total_sales,
          (SELECT COUNT(*) FROM sales_invoices WHERE "isActive" = true AND status = 'pending') as pending_invoices
      `;
      
      const dashboard = await sequelize.query(dashboardQuery, { type: sequelize.QueryTypes.SELECT });
      console.log(`✅ Sales dashboard query نجح:`);
      console.log(`   - إجمالي الفواتير: ${dashboard[0].total_invoices}`);
      console.log(`   - إجمالي العملاء: ${dashboard[0].total_customers}`);
      console.log(`   - إجمالي المبيعات: ${dashboard[0].total_sales} د.ل`);
      console.log(`   - الفواتير المعلقة: ${dashboard[0].pending_invoices}`);
    } catch (error) {
      console.log(`❌ خطأ في sales dashboard query: ${error.message}`);
    }

    // فحص العلاقات الخارجية
    console.log('\n🔗 فحص العلاقات الخارجية للمبيعات...');
    try {
      const foreignKeys = await sequelize.query(`
        SELECT 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name IN ('sales_invoices', 'sales_invoice_items', 'customers')
        ORDER BY tc.table_name, kcu.column_name
      `, { type: sequelize.QueryTypes.SELECT });
      
      console.log('📋 العلاقات الخارجية للمبيعات:');
      foreignKeys.forEach(fk => {
        console.log(`  - ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    } catch (error) {
      console.log(`❌ خطأ في فحص العلاقات الخارجية: ${error.message}`);
    }

    console.log('\n🎯 تشخيص نظام المبيعات مكتمل!');
    
  } catch (error) {
    console.error('❌ خطأ في تشخيص نظام المبيعات:', error.message);
    console.error('📋 تفاصيل الخطأ:', error);
  } finally {
    await sequelize.close();
  }
}

// تشغيل التشخيص
diagnoseSalesSystemIssues();
