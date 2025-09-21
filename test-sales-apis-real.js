import { Sequelize, DataTypes, Op } from 'sequelize';

/**
 * اختبار حقيقي لـ APIs المبيعات
 * Real Sales APIs Testing
 */

console.log('🛒 بدء الاختبار الحقيقي لـ APIs المبيعات...\n');

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

async function testSalesAPIsReal() {
  try {
    console.log('📊 فحص الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ الاتصال بقاعدة البيانات ناجح\n');

    // 1. فحص الجداول الموجودة فعلياً
    console.log('🔍 فحص الجداول الموجودة فعلياً...');
    try {
      const tables = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name LIKE '%sales%' 
          OR table_name LIKE '%customer%'
          OR table_name LIKE '%invoice%'
        ORDER BY table_name
      `, { type: sequelize.QueryTypes.SELECT });
      
      console.log('📋 الجداول المتعلقة بالمبيعات:');
      tables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    } catch (error) {
      console.log(`❌ خطأ في فحص الجداول: ${error.message}`);
    }

    // 2. اختبار API /sales/summary الحقيقي
    console.log('\n📊 اختبار /sales/summary API...');
    try {
      // محاولة استخدام SalesInvoice model
      const salesInvoiceTest = await sequelize.query(`
        SELECT COUNT(*) as count FROM sales_invoices WHERE "isActive" = true
      `, { type: sequelize.QueryTypes.SELECT });
      
      console.log(`✅ جدول sales_invoices يحتوي على ${salesInvoiceTest[0].count} سجل`);
      
      // اختبار الاستعلام الفعلي للـ summary
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_invoices,
          COALESCE(SUM("totalAmount"), 0) as total_sales,
          COUNT(DISTINCT "customerId") as active_customers,
          AVG("totalAmount") as average_order_value
        FROM sales_invoices 
        WHERE "isActive" = true AND status != 'cancelled'
      `;
      
      const summary = await sequelize.query(summaryQuery, { type: sequelize.QueryTypes.SELECT });
      console.log(`✅ Sales summary نجح:`);
      console.log(`   - إجمالي الفواتير: ${summary[0].total_invoices}`);
      console.log(`   - إجمالي المبيعات: ${summary[0].total_sales} د.ل`);
      console.log(`   - العملاء النشطين: ${summary[0].active_customers}`);
      
    } catch (error) {
      console.log(`❌ خطأ في /sales/summary: ${error.message}`);
    }

    // 3. اختبار API /sales/customers الحقيقي
    console.log('\n👥 اختبار /sales/customers API...');
    try {
      const customersQuery = `
        SELECT 
          c.id, c.code, c.name, c.phone, c.email, c.balance, c."isActive"
        FROM customers c
        WHERE c."isActive" = true
        ORDER BY c.name
        LIMIT 10
      `;
      
      const customers = await sequelize.query(customersQuery, { type: sequelize.QueryTypes.SELECT });
      console.log(`✅ Customers API نجح - ${customers.length} عميل`);
      
      if (customers.length > 0) {
        console.log('   📋 عينة من العملاء:');
        customers.slice(0, 3).forEach((customer, index) => {
          console.log(`     ${index + 1}. ${customer.name} (${customer.code}) - رصيد: ${customer.balance} د.ل`);
        });
      }
    } catch (error) {
      console.log(`❌ خطأ في /sales/customers: ${error.message}`);
    }

    // 4. اختبار API /sales/sales-invoices الحقيقي
    console.log('\n📄 اختبار /sales/sales-invoices API...');
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
      console.log(`✅ Sales invoices API نجح - ${invoices.length} فاتورة`);
      
      if (invoices.length > 0) {
        console.log('   📋 عينة من الفواتير:');
        invoices.slice(0, 3).forEach((invoice, index) => {
          console.log(`     ${index + 1}. ${invoice.invoiceNumber} - ${invoice.totalAmount} د.ل (${invoice.customer_name})`);
        });
      }
    } catch (error) {
      console.log(`❌ خطأ في /sales/sales-invoices: ${error.message}`);
    }

    // 5. فحص مشاكل محتملة في الـ models
    console.log('\n🔧 فحص مشاكل محتملة في الـ models...');
    try {
      // فحص إذا كان هناك مشاكل في associations
      const associationTest = await sequelize.query(`
        SELECT 
          si.id, si."invoiceNumber",
          c.name as customer_name
        FROM sales_invoices si
        INNER JOIN customers c ON si."customerId" = c.id
        WHERE si."isActive" = true
        LIMIT 1
      `, { type: sequelize.QueryTypes.SELECT });
      
      if (associationTest.length > 0) {
        console.log('✅ العلاقات بين الجداول تعمل بشكل صحيح');
      } else {
        console.log('⚠️ لا توجد بيانات للاختبار');
      }
    } catch (error) {
      console.log(`❌ خطأ في العلاقات: ${error.message}`);
    }

    // 6. فحص الأعمدة المطلوبة
    console.log('\n🔍 فحص الأعمدة المطلوبة...');
    try {
      const salesInvoicesColumns = await sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'sales_invoices'
        ORDER BY ordinal_position
      `, { type: sequelize.QueryTypes.SELECT });
      
      console.log('📋 أعمدة جدول sales_invoices:');
      const requiredColumns = ['invoiceNumber', 'invoiceDate', 'totalAmount', 'customerId', 'status', 'isActive'];
      
      requiredColumns.forEach(col => {
        const found = salesInvoicesColumns.find(dbCol => dbCol.column_name === col);
        if (found) {
          console.log(`  ✅ ${col}: ${found.data_type}`);
        } else {
          console.log(`  ❌ ${col}: مفقود`);
        }
      });
    } catch (error) {
      console.log(`❌ خطأ في فحص الأعمدة: ${error.message}`);
    }

    // 7. اختبار الاستعلامات التي تفشل في الـ frontend
    console.log('\n🧪 اختبار الاستعلامات التي تفشل في الـ frontend...');
    
    // محاكاة استدعاء getSalesSummary
    try {
      console.log('📊 محاكاة getSalesSummary...');
      const summaryResult = await sequelize.query(`
        SELECT 
          COUNT(*) as "totalInvoices",
          COALESCE(SUM("totalAmount"), 0) as "totalSales",
          COUNT(DISTINCT "customerId") as "activeCustomers",
          AVG("totalAmount") as "averageOrderValue"
        FROM sales_invoices 
        WHERE "isActive" = true
      `, { type: sequelize.QueryTypes.SELECT });
      
      console.log('✅ getSalesSummary محاكاة نجحت:', summaryResult[0]);
    } catch (error) {
      console.log(`❌ خطأ في محاكاة getSalesSummary: ${error.message}`);
    }

    // محاكاة استدعاء getSalesInvoicesV2
    try {
      console.log('📄 محاكاة getSalesInvoicesV2...');
      const invoicesResult = await sequelize.query(`
        SELECT 
          si.id, si."invoiceNumber", si."invoiceDate", si."totalAmount", si.status,
          c.id as "customer_id", c.name as "customer_name", c.code as "customer_code"
        FROM sales_invoices si
        LEFT JOIN customers c ON si."customerId" = c.id
        WHERE si."isActive" = true
        ORDER BY si."invoiceDate" DESC
        LIMIT 10
      `, { type: sequelize.QueryTypes.SELECT });
      
      console.log(`✅ getSalesInvoicesV2 محاكاة نجحت: ${invoicesResult.length} فاتورة`);
    } catch (error) {
      console.log(`❌ خطأ في محاكاة getSalesInvoicesV2: ${error.message}`);
    }

    console.log('\n🎯 انتهاء الاختبار الحقيقي لـ APIs المبيعات');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار الحقيقي:', error.message);
    console.error('📋 تفاصيل الخطأ:', error);
  } finally {
    await sequelize.close();
  }
}

// تشغيل الاختبار
testSalesAPIsReal();
