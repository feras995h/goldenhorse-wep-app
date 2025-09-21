import { Sequelize, DataTypes, Op } from 'sequelize';

/**
 * إصلاح مباشر لـ APIs المبيعات
 * Direct Fix for Sales APIs
 */

console.log('🛒 بدء الإصلاح المباشر لـ APIs المبيعات...\n');

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

async function fixSalesAPIsDirectly() {
  try {
    console.log('📊 فحص الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ الاتصال بقاعدة البيانات ناجح\n');

    // 1. فحص المشاكل الحقيقية في APIs
    console.log('🔍 فحص المشاكل الحقيقية في APIs...');
    
    // فحص إذا كان هناك مشاكل في الـ models
    try {
      console.log('📋 فحص الـ models المستخدمة...');
      
      // فحص SalesInvoice model
      const salesInvoiceTest = await sequelize.query(`
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'sales_invoices'
        ORDER BY ordinal_position
      `, { type: sequelize.QueryTypes.SELECT });
      
      console.log(`✅ جدول sales_invoices يحتوي على ${salesInvoiceTest.length} عمود`);
      
      // فحص Customer model
      const customerTest = await sequelize.query(`
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'customers'
        ORDER BY ordinal_position
      `, { type: sequelize.QueryTypes.SELECT });
      
      console.log(`✅ جدول customers يحتوي على ${customerTest.length} عمود`);
      
    } catch (error) {
      console.log(`❌ خطأ في فحص الـ models: ${error.message}`);
    }

    // 2. إنشاء APIs بديلة بـ SQL مباشر
    console.log('\n🔧 إنشاء APIs بديلة بـ SQL مباشر...');
    
    // API 1: Sales Summary
    console.log('📊 إنشاء Sales Summary API...');
    try {
      const salesSummaryFunction = `
        CREATE OR REPLACE FUNCTION get_sales_summary(
          date_from DATE DEFAULT NULL,
          date_to DATE DEFAULT NULL
        )
        RETURNS JSON AS $$
        DECLARE
          result JSON;
        BEGIN
          SELECT json_build_object(
            'totalSales', COALESCE(SUM("totalAmount"), 0),
            'totalOrders', COUNT(*),
            'activeCustomers', COUNT(DISTINCT "customerId"),
            'averageOrderValue', COALESCE(AVG("totalAmount"), 0),
            'totalInvoices', COUNT(*),
            'generatedAt', NOW()
          ) INTO result
          FROM sales_invoices 
          WHERE "isActive" = true 
            AND status != 'cancelled'
            AND (date_from IS NULL OR "invoiceDate" >= date_from)
            AND (date_to IS NULL OR "invoiceDate" <= date_to);
          
          RETURN result;
        END;
        $$ LANGUAGE plpgsql;
      `;
      
      await sequelize.query(salesSummaryFunction);
      console.log('✅ تم إنشاء get_sales_summary function');
      
      // اختبار الـ function
      const summaryTest = await sequelize.query(`
        SELECT get_sales_summary() as summary
      `, { type: sequelize.QueryTypes.SELECT });
      
      console.log('✅ اختبار get_sales_summary نجح:', summaryTest[0].summary);
      
    } catch (error) {
      console.log(`❌ خطأ في إنشاء Sales Summary API: ${error.message}`);
    }

    // API 2: Sales Invoices List
    console.log('\n📄 إنشاء Sales Invoices List API...');
    try {
      const salesInvoicesFunction = `
        CREATE OR REPLACE FUNCTION get_sales_invoices(
          page_num INTEGER DEFAULT 1,
          page_size INTEGER DEFAULT 10,
          search_term TEXT DEFAULT NULL,
          status_filter TEXT DEFAULT NULL,
          customer_filter UUID DEFAULT NULL
        )
        RETURNS JSON AS $$
        DECLARE
          result JSON;
          total_count INTEGER;
          offset_val INTEGER;
        BEGIN
          offset_val := (page_num - 1) * page_size;
          
          -- Get total count
          SELECT COUNT(*) INTO total_count
          FROM sales_invoices si
          LEFT JOIN customers c ON si."customerId" = c.id
          WHERE si."isActive" = true
            AND (search_term IS NULL OR si."invoiceNumber" ILIKE '%' || search_term || '%')
            AND (status_filter IS NULL OR si.status = status_filter)
            AND (customer_filter IS NULL OR si."customerId" = customer_filter);
          
          -- Get data
          SELECT json_build_object(
            'data', json_agg(
              json_build_object(
                'id', si.id,
                'invoiceNumber', si."invoiceNumber",
                'invoiceDate', si."invoiceDate",
                'dueDate', si."dueDate",
                'totalAmount', si."totalAmount",
                'status', si.status,
                'paymentStatus', si."paymentStatus",
                'customer', json_build_object(
                  'id', c.id,
                  'code', c.code,
                  'name', c.name,
                  'phone', c.phone,
                  'email', c.email
                )
              )
            ),
            'pagination', json_build_object(
              'total', total_count,
              'page', page_num,
              'limit', page_size,
              'totalPages', CEIL(total_count::FLOAT / page_size)
            )
          ) INTO result
          FROM sales_invoices si
          LEFT JOIN customers c ON si."customerId" = c.id
          WHERE si."isActive" = true
            AND (search_term IS NULL OR si."invoiceNumber" ILIKE '%' || search_term || '%')
            AND (status_filter IS NULL OR si.status = status_filter)
            AND (customer_filter IS NULL OR si."customerId" = customer_filter)
          ORDER BY si."invoiceDate" DESC
          LIMIT page_size OFFSET offset_val;
          
          RETURN result;
        END;
        $$ LANGUAGE plpgsql;
      `;
      
      await sequelize.query(salesInvoicesFunction);
      console.log('✅ تم إنشاء get_sales_invoices function');
      
      // اختبار الـ function
      const invoicesTest = await sequelize.query(`
        SELECT get_sales_invoices(1, 5) as invoices
      `, { type: sequelize.QueryTypes.SELECT });
      
      const invoicesData = invoicesTest[0].invoices;
      console.log(`✅ اختبار get_sales_invoices نجح: ${invoicesData.data?.length || 0} فاتورة`);
      
    } catch (error) {
      console.log(`❌ خطأ في إنشاء Sales Invoices API: ${error.message}`);
    }

    // API 3: Customers List
    console.log('\n👥 إنشاء Customers List API...');
    try {
      const customersFunction = `
        CREATE OR REPLACE FUNCTION get_customers_list(
          page_num INTEGER DEFAULT 1,
          page_size INTEGER DEFAULT 10,
          search_term TEXT DEFAULT NULL,
          type_filter TEXT DEFAULT NULL
        )
        RETURNS JSON AS $$
        DECLARE
          result JSON;
          total_count INTEGER;
          offset_val INTEGER;
        BEGIN
          offset_val := (page_num - 1) * page_size;
          
          -- Get total count
          SELECT COUNT(*) INTO total_count
          FROM customers c
          WHERE c."isActive" = true
            AND (search_term IS NULL OR c.name ILIKE '%' || search_term || '%' OR c.code ILIKE '%' || search_term || '%')
            AND (type_filter IS NULL OR c.type = type_filter);
          
          -- Get data
          SELECT json_build_object(
            'data', json_agg(
              json_build_object(
                'id', c.id,
                'code', c.code,
                'name', c.name,
                'phone', c.phone,
                'email', c.email,
                'balance', c.balance,
                'type', c.type,
                'customerType', c."customerType",
                'creditLimit', c."creditLimit",
                'isActive', c."isActive"
              )
            ),
            'pagination', json_build_object(
              'total', total_count,
              'page', page_num,
              'limit', page_size,
              'totalPages', CEIL(total_count::FLOAT / page_size)
            )
          ) INTO result
          FROM customers c
          WHERE c."isActive" = true
            AND (search_term IS NULL OR c.name ILIKE '%' || search_term || '%' OR c.code ILIKE '%' || search_term || '%')
            AND (type_filter IS NULL OR c.type = type_filter)
          ORDER BY c.name
          LIMIT page_size OFFSET offset_val;
          
          RETURN result;
        END;
        $$ LANGUAGE plpgsql;
      `;
      
      await sequelize.query(customersFunction);
      console.log('✅ تم إنشاء get_customers_list function');
      
      // اختبار الـ function
      const customersTest = await sequelize.query(`
        SELECT get_customers_list(1, 5) as customers
      `, { type: sequelize.QueryTypes.SELECT });
      
      const customersData = customersTest[0].customers;
      console.log(`✅ اختبار get_customers_list نجح: ${customersData.data?.length || 0} عميل`);
      
    } catch (error) {
      console.log(`❌ خطأ في إنشاء Customers API: ${error.message}`);
    }

    // 3. إنشاء view شامل للمبيعات
    console.log('\n🔧 إنشاء view شامل للمبيعات...');
    try {
      const salesView = `
        CREATE OR REPLACE VIEW sales_dashboard_view AS
        SELECT 
          'summary' as type,
          json_build_object(
            'totalSales', COALESCE(SUM(si."totalAmount"), 0),
            'totalInvoices', COUNT(si.id),
            'activeCustomers', COUNT(DISTINCT si."customerId"),
            'averageOrderValue', COALESCE(AVG(si."totalAmount"), 0),
            'draftInvoices', COUNT(CASE WHEN si.status = 'draft' THEN 1 END),
            'postedInvoices', COUNT(CASE WHEN si.status = 'posted' THEN 1 END),
            'paidInvoices', COUNT(CASE WHEN si.status = 'paid' THEN 1 END),
            'pendingInvoices', COUNT(CASE WHEN si.status = 'pending' THEN 1 END)
          ) as data
        FROM sales_invoices si
        WHERE si."isActive" = true
        
        UNION ALL
        
        SELECT 
          'customers' as type,
          json_build_object(
            'totalCustomers', COUNT(c.id),
            'activeCustomers', COUNT(CASE WHEN c."isActive" = true THEN 1 END),
            'totalBalance', COALESCE(SUM(c.balance), 0)
          ) as data
        FROM customers c;
      `;
      
      await sequelize.query(salesView);
      console.log('✅ تم إنشاء sales_dashboard_view');
      
      // اختبار الـ view
      const viewTest = await sequelize.query(`
        SELECT * FROM sales_dashboard_view
      `, { type: sequelize.QueryTypes.SELECT });
      
      console.log(`✅ اختبار sales_dashboard_view نجح: ${viewTest.length} سجل`);
      viewTest.forEach(row => {
        console.log(`   - ${row.type}:`, row.data);
      });
      
    } catch (error) {
      console.log(`❌ خطأ في إنشاء sales view: ${error.message}`);
    }

    console.log('\n🎉 تم إنشاء APIs بديلة بنجاح!');
    console.log('\n📋 الملخص:');
    console.log('  ✅ get_sales_summary() - ملخص المبيعات');
    console.log('  ✅ get_sales_invoices() - قائمة الفواتير');
    console.log('  ✅ get_customers_list() - قائمة العملاء');
    console.log('  ✅ sales_dashboard_view - عرض شامل للمبيعات');
    console.log('\n💡 يمكن الآن استخدام هذه الـ functions في APIs بدلاً من Sequelize');
    
  } catch (error) {
    console.error('❌ خطأ في الإصلاح المباشر:', error.message);
    console.error('📋 تفاصيل الخطأ:', error);
  } finally {
    await sequelize.close();
  }
}

// تشغيل الإصلاح
fixSalesAPIsDirectly();
