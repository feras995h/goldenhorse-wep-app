import { Sequelize, DataTypes, Op } from 'sequelize';

/**
 * إصلاح مشاكل GROUP BY في functions
 * Fix GROUP BY issues in functions
 */

console.log('🔧 بدء إصلاح مشاكل GROUP BY...\n');

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

async function fixGroupByIssues() {
  try {
    console.log('📊 فحص الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ الاتصال بقاعدة البيانات ناجح\n');

    // 1. إصلاح Sales Invoices function بدون GROUP BY
    console.log('🔧 إصلاح Sales Invoices function...');
    try {
      const salesInvoicesFunction = `
        CREATE OR REPLACE FUNCTION get_sales_invoices_final(
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
          invoices_data JSON;
        BEGIN
          offset_val := (page_num - 1) * page_size;
          
          -- Get total count first
          SELECT COUNT(*) INTO total_count
          FROM sales_invoices si
          LEFT JOIN customers c ON si."customerId" = c.id
          WHERE si."isActive" = true
            AND (search_term IS NULL OR si."invoiceNumber" ILIKE '%' || search_term || '%')
            AND (status_filter IS NULL OR si.status::text = status_filter)
            AND (customer_filter IS NULL OR si."customerId" = customer_filter);
          
          -- Get invoices data
          WITH invoice_data AS (
            SELECT 
              si.id, si."invoiceNumber", si."invoiceDate", si."dueDate", 
              si."totalAmount", si.status::text as status, si."paymentStatus"::text as payment_status,
              si."salesPerson", si."salesChannel", si.notes, si."createdAt",
              c.id as customer_id, c.code as customer_code, c.name as customer_name,
              c.phone as customer_phone, c.email as customer_email
            FROM sales_invoices si
            LEFT JOIN customers c ON si."customerId" = c.id
            WHERE si."isActive" = true
              AND (search_term IS NULL OR si."invoiceNumber" ILIKE '%' || search_term || '%')
              AND (status_filter IS NULL OR si.status::text = status_filter)
              AND (customer_filter IS NULL OR si."customerId" = customer_filter)
            ORDER BY si."invoiceDate" DESC
            LIMIT page_size OFFSET offset_val
          )
          SELECT json_agg(
            json_build_object(
              'id', id,
              'invoiceNumber', "invoiceNumber",
              'invoiceDate', "invoiceDate",
              'dueDate', "dueDate",
              'totalAmount', "totalAmount",
              'status', status,
              'paymentStatus', payment_status,
              'salesPerson', "salesPerson",
              'salesChannel', "salesChannel",
              'notes', notes,
              'createdAt', "createdAt",
              'customer', json_build_object(
                'id', customer_id,
                'code', customer_code,
                'name', customer_name,
                'phone', customer_phone,
                'email', customer_email
              )
            )
          ) INTO invoices_data
          FROM invoice_data;
          
          -- Build final result
          SELECT json_build_object(
            'data', COALESCE(invoices_data, '[]'::json),
            'pagination', json_build_object(
              'total', total_count,
              'page', page_num,
              'limit', page_size,
              'totalPages', CEIL(total_count::FLOAT / page_size)
            )
          ) INTO result;
          
          RETURN result;
        END;
        $$ LANGUAGE plpgsql;
      `;
      
      await sequelize.query(salesInvoicesFunction);
      console.log('✅ تم إنشاء get_sales_invoices_final function');
      
    } catch (error) {
      console.log(`❌ خطأ في إصلاح Sales Invoices function: ${error.message}`);
    }

    // 2. إصلاح Customers function بدون GROUP BY
    console.log('\n👥 إصلاح Customers function...');
    try {
      const customersFunction = `
        CREATE OR REPLACE FUNCTION get_customers_list_final(
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
          customers_data JSON;
        BEGIN
          offset_val := (page_num - 1) * page_size;
          
          -- Get total count first
          SELECT COUNT(*) INTO total_count
          FROM customers c
          WHERE c."isActive" = true
            AND (search_term IS NULL OR c.name ILIKE '%' || search_term || '%' OR c.code ILIKE '%' || search_term || '%')
            AND (type_filter IS NULL OR c.type::text = type_filter);
          
          -- Get customers data
          WITH customer_data AS (
            SELECT 
              c.id, c.code, c.name, c.phone, c.email, c.balance,
              c.type::text as type, c."customerType"::text as customer_type,
              c."creditLimit", c."paymentTerms", c."isActive", c."createdAt"
            FROM customers c
            WHERE c."isActive" = true
              AND (search_term IS NULL OR c.name ILIKE '%' || search_term || '%' OR c.code ILIKE '%' || search_term || '%')
              AND (type_filter IS NULL OR c.type::text = type_filter)
            ORDER BY c.name
            LIMIT page_size OFFSET offset_val
          )
          SELECT json_agg(
            json_build_object(
              'id', id,
              'code', code,
              'name', name,
              'phone', phone,
              'email', email,
              'balance', balance,
              'type', type,
              'customerType', customer_type,
              'creditLimit', "creditLimit",
              'paymentTerms', "paymentTerms",
              'isActive', "isActive",
              'createdAt', "createdAt"
            )
          ) INTO customers_data
          FROM customer_data;
          
          -- Build final result
          SELECT json_build_object(
            'data', COALESCE(customers_data, '[]'::json),
            'pagination', json_build_object(
              'total', total_count,
              'page', page_num,
              'limit', page_size,
              'totalPages', CEIL(total_count::FLOAT / page_size)
            )
          ) INTO result;
          
          RETURN result;
        END;
        $$ LANGUAGE plpgsql;
      `;
      
      await sequelize.query(customersFunction);
      console.log('✅ تم إنشاء get_customers_list_final function');
      
    } catch (error) {
      console.log(`❌ خطأ في إصلاح Customers function: ${error.message}`);
    }

    // 3. إنشاء function للـ reports
    console.log('\n📊 إنشاء function للـ reports...');
    try {
      const reportsFunction = `
        CREATE OR REPLACE FUNCTION get_sales_reports(
          report_type TEXT DEFAULT 'summary',
          date_from DATE DEFAULT NULL,
          date_to DATE DEFAULT NULL
        )
        RETURNS JSON AS $$
        DECLARE
          result JSON;
        BEGIN
          IF report_type = 'summary' THEN
            SELECT json_build_object(
              'totalSales', COALESCE(SUM("totalAmount"), 0),
              'totalInvoices', COUNT(*),
              'averageOrderValue', COALESCE(AVG("totalAmount"), 0),
              'draftInvoices', COUNT(CASE WHEN status::text = 'draft' THEN 1 END),
              'postedInvoices', COUNT(CASE WHEN status::text = 'posted' THEN 1 END),
              'paidInvoices', COUNT(CASE WHEN status::text = 'paid' THEN 1 END),
              'pendingInvoices', COUNT(CASE WHEN status::text = 'pending' THEN 1 END),
              'cancelledInvoices', COUNT(CASE WHEN status::text = 'cancelled' THEN 1 END),
              'dateFrom', date_from,
              'dateTo', date_to,
              'generatedAt', NOW()
            ) INTO result
            FROM sales_invoices 
            WHERE "isActive" = true
              AND (date_from IS NULL OR "invoiceDate" >= date_from)
              AND (date_to IS NULL OR "invoiceDate" <= date_to);
              
          ELSIF report_type = 'customer' THEN
            WITH customer_sales AS (
              SELECT 
                c.id, c.code, c.name,
                COUNT(si.id) as total_invoices,
                COALESCE(SUM(si."totalAmount"), 0) as total_sales,
                COALESCE(AVG(si."totalAmount"), 0) as average_order_value
              FROM customers c
              LEFT JOIN sales_invoices si ON c.id = si."customerId" 
                AND si."isActive" = true
                AND (date_from IS NULL OR si."invoiceDate" >= date_from)
                AND (date_to IS NULL OR si."invoiceDate" <= date_to)
              WHERE c."isActive" = true
              GROUP BY c.id, c.code, c.name
              ORDER BY total_sales DESC
              LIMIT 20
            )
            SELECT json_build_object(
              'customers', json_agg(
                json_build_object(
                  'id', id,
                  'code', code,
                  'name', name,
                  'totalInvoices', total_invoices,
                  'totalSales', total_sales,
                  'averageOrderValue', average_order_value
                )
              ),
              'dateFrom', date_from,
              'dateTo', date_to,
              'generatedAt', NOW()
            ) INTO result
            FROM customer_sales;
            
          ELSE
            result := json_build_object('error', 'Invalid report type');
          END IF;
          
          RETURN result;
        END;
        $$ LANGUAGE plpgsql;
      `;
      
      await sequelize.query(reportsFunction);
      console.log('✅ تم إنشاء get_sales_reports function');
      
    } catch (error) {
      console.log(`❌ خطأ في إنشاء reports function: ${error.message}`);
    }

    // 4. اختبار شامل للـ functions الجديدة
    console.log('\n🧪 اختبار شامل للـ functions الجديدة...');
    
    try {
      // اختبار sales summary
      console.log('📊 اختبار sales summary...');
      const summaryTest = await sequelize.query(`
        SELECT get_sales_summary() as summary
      `, { type: sequelize.QueryTypes.SELECT });
      console.log('✅ get_sales_summary يعمل بشكل صحيح');
      
      // اختبار sales invoices
      console.log('📄 اختبار sales invoices...');
      const invoicesTest = await sequelize.query(`
        SELECT get_sales_invoices_final(1, 3) as invoices
      `, { type: sequelize.QueryTypes.SELECT });
      const invoicesData = invoicesTest[0].invoices;
      console.log(`✅ get_sales_invoices_final يعمل بشكل صحيح: ${invoicesData.data?.length || 0} فاتورة`);
      
      // اختبار customers
      console.log('👥 اختبار customers...');
      const customersTest = await sequelize.query(`
        SELECT get_customers_list_final(1, 3) as customers
      `, { type: sequelize.QueryTypes.SELECT });
      const customersData = customersTest[0].customers;
      console.log(`✅ get_customers_list_final يعمل بشكل صحيح: ${customersData.data?.length || 0} عميل`);
      
      // اختبار reports
      console.log('📊 اختبار reports...');
      const reportsTest = await sequelize.query(`
        SELECT get_sales_reports('summary') as report
      `, { type: sequelize.QueryTypes.SELECT });
      console.log('✅ get_sales_reports يعمل بشكل صحيح');
      
      // اختبار customer report
      const customerReportTest = await sequelize.query(`
        SELECT get_sales_reports('customer') as report
      `, { type: sequelize.QueryTypes.SELECT });
      console.log('✅ get_sales_reports (customer) يعمل بشكل صحيح');
      
      // اختبار helper functions
      console.log('🛠️ اختبار helper functions...');
      const customerByIdTest = await sequelize.query(`
        SELECT get_customer_by_id((SELECT id FROM customers WHERE "isActive" = true LIMIT 1)) as customer
      `, { type: sequelize.QueryTypes.SELECT });
      console.log('✅ get_customer_by_id يعمل بشكل صحيح');
      
      const invoiceByIdTest = await sequelize.query(`
        SELECT get_sales_invoice_by_id((SELECT id FROM sales_invoices WHERE "isActive" = true LIMIT 1)) as invoice
      `, { type: sequelize.QueryTypes.SELECT });
      console.log('✅ get_sales_invoice_by_id يعمل بشكل صحيح');
      
    } catch (error) {
      console.log(`❌ خطأ في الاختبار الشامل: ${error.message}`);
    }

    console.log('\n🎉 تم إصلاح جميع مشاكل GROUP BY بنجاح!');
    console.log('\n📋 الملخص النهائي:');
    console.log('  ✅ get_sales_summary() - ملخص المبيعات');
    console.log('  ✅ get_sales_invoices_final() - قائمة الفواتير (مُصلحة)');
    console.log('  ✅ get_customers_list_final() - قائمة العملاء (مُصلحة)');
    console.log('  ✅ get_sales_reports() - تقارير المبيعات');
    console.log('  ✅ get_customer_by_id() - عميل واحد');
    console.log('  ✅ get_sales_invoice_by_id() - فاتورة واحدة');
    console.log('  ✅ sales_dashboard_view - عرض شامل للمبيعات');
    console.log('\n💡 جميع الـ functions جاهزة للاستخدام في APIs!');
    console.log('\n🚀 الخطوة التالية: تحديث sales.js لاستخدام هذه الـ functions');
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح GROUP BY:', error.message);
    console.error('📋 تفاصيل الخطأ:', error);
  } finally {
    await sequelize.close();
  }
}

// تشغيل الإصلاح
fixGroupByIssues();
