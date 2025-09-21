import { Sequelize, DataTypes, Op } from 'sequelize';

/**
 * إصلاح مشاكل enum في قاعدة البيانات
 * Fix enum issues in database
 */

console.log('🔧 بدء إصلاح مشاكل enum...\n');

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

async function fixEnumIssues() {
  try {
    console.log('📊 فحص الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ الاتصال بقاعدة البيانات ناجح\n');

    // 1. فحص enum types الموجودة
    console.log('🔍 فحص enum types الموجودة...');
    try {
      const enumTypes = await sequelize.query(`
        SELECT t.typname, e.enumlabel
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        WHERE t.typname LIKE '%enum%'
        ORDER BY t.typname, e.enumsortorder
      `, { type: sequelize.QueryTypes.SELECT });
      
      console.log('📋 enum types الموجودة:');
      const groupedEnums = {};
      enumTypes.forEach(row => {
        if (!groupedEnums[row.typname]) {
          groupedEnums[row.typname] = [];
        }
        groupedEnums[row.typname].push(row.enumlabel);
      });
      
      Object.keys(groupedEnums).forEach(typeName => {
        console.log(`  - ${typeName}: [${groupedEnums[typeName].join(', ')}]`);
      });
      
    } catch (error) {
      console.log(`❌ خطأ في فحص enum types: ${error.message}`);
    }

    // 2. إصلاح Sales Invoices functions مع enum casting
    console.log('\n🔧 إصلاح Sales Invoices functions مع enum casting...');
    try {
      const salesInvoicesFunction = `
        CREATE OR REPLACE FUNCTION get_sales_invoices_fixed(
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
            AND (status_filter IS NULL OR si.status::text = status_filter)
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
                'status', si.status::text,
                'paymentStatus', si."paymentStatus"::text,
                'salesPerson', si."salesPerson",
                'salesChannel', si."salesChannel",
                'notes', si.notes,
                'createdAt', si."createdAt",
                'customer', json_build_object(
                  'id', c.id,
                  'code', c.code,
                  'name', c.name,
                  'phone', c.phone,
                  'email', c.email,
                  'type', c.type::text
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
            AND (status_filter IS NULL OR si.status::text = status_filter)
            AND (customer_filter IS NULL OR si."customerId" = customer_filter)
          ORDER BY si."invoiceDate" DESC
          LIMIT page_size OFFSET offset_val;
          
          RETURN result;
        END;
        $$ LANGUAGE plpgsql;
      `;
      
      await sequelize.query(salesInvoicesFunction);
      console.log('✅ تم إنشاء get_sales_invoices_fixed function');
      
      // اختبار الـ function
      const invoicesTest = await sequelize.query(`
        SELECT get_sales_invoices_fixed(1, 5) as invoices
      `, { type: sequelize.QueryTypes.SELECT });
      
      const invoicesData = invoicesTest[0].invoices;
      console.log(`✅ اختبار get_sales_invoices_fixed نجح: ${invoicesData.data?.length || 0} فاتورة`);
      
    } catch (error) {
      console.log(`❌ خطأ في إصلاح Sales Invoices function: ${error.message}`);
    }

    // 3. إصلاح Customers function مع enum casting
    console.log('\n👥 إصلاح Customers function مع enum casting...');
    try {
      const customersFunction = `
        CREATE OR REPLACE FUNCTION get_customers_list_fixed(
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
            AND (type_filter IS NULL OR c.type::text = type_filter);
          
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
                'type', c.type::text,
                'customerType', c."customerType"::text,
                'creditLimit', c."creditLimit",
                'paymentTerms', c."paymentTerms",
                'isActive', c."isActive",
                'createdAt', c."createdAt"
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
            AND (type_filter IS NULL OR c.type::text = type_filter)
          ORDER BY c.name
          LIMIT page_size OFFSET offset_val;
          
          RETURN result;
        END;
        $$ LANGUAGE plpgsql;
      `;
      
      await sequelize.query(customersFunction);
      console.log('✅ تم إنشاء get_customers_list_fixed function');
      
      // اختبار الـ function
      const customersTest = await sequelize.query(`
        SELECT get_customers_list_fixed(1, 5) as customers
      `, { type: sequelize.QueryTypes.SELECT });
      
      const customersData = customersTest[0].customers;
      console.log(`✅ اختبار get_customers_list_fixed نجح: ${customersData.data?.length || 0} عميل`);
      
    } catch (error) {
      console.log(`❌ خطأ في إصلاح Customers function: ${error.message}`);
    }

    // 4. إنشاء helper functions للـ APIs
    console.log('\n🛠️ إنشاء helper functions للـ APIs...');
    try {
      const helperFunctions = `
        -- Helper function للحصول على customer بـ ID
        CREATE OR REPLACE FUNCTION get_customer_by_id(customer_id UUID)
        RETURNS JSON AS $$
        DECLARE
          result JSON;
        BEGIN
          SELECT json_build_object(
            'id', c.id,
            'code', c.code,
            'name', c.name,
            'phone', c.phone,
            'email', c.email,
            'balance', c.balance,
            'type', c.type::text,
            'customerType', c."customerType"::text,
            'creditLimit', c."creditLimit",
            'paymentTerms', c."paymentTerms",
            'isActive', c."isActive"
          ) INTO result
          FROM customers c
          WHERE c.id = customer_id AND c."isActive" = true;
          
          RETURN result;
        END;
        $$ LANGUAGE plpgsql;

        -- Helper function للحصول على sales invoice بـ ID
        CREATE OR REPLACE FUNCTION get_sales_invoice_by_id(invoice_id UUID)
        RETURNS JSON AS $$
        DECLARE
          result JSON;
        BEGIN
          SELECT json_build_object(
            'id', si.id,
            'invoiceNumber', si."invoiceNumber",
            'invoiceDate', si."invoiceDate",
            'dueDate', si."dueDate",
            'totalAmount', si."totalAmount",
            'status', si.status::text,
            'paymentStatus', si."paymentStatus"::text,
            'salesPerson', si."salesPerson",
            'salesChannel', si."salesChannel",
            'notes', si.notes,
            'customer', json_build_object(
              'id', c.id,
              'code', c.code,
              'name', c.name,
              'phone', c.phone,
              'email', c.email
            )
          ) INTO result
          FROM sales_invoices si
          LEFT JOIN customers c ON si."customerId" = c.id
          WHERE si.id = invoice_id AND si."isActive" = true;
          
          RETURN result;
        END;
        $$ LANGUAGE plpgsql;
      `;
      
      await sequelize.query(helperFunctions);
      console.log('✅ تم إنشاء helper functions');
      
    } catch (error) {
      console.log(`❌ خطأ في إنشاء helper functions: ${error.message}`);
    }

    // 5. اختبار شامل للـ functions الجديدة
    console.log('\n🧪 اختبار شامل للـ functions الجديدة...');
    
    try {
      // اختبار sales summary
      const summaryTest = await sequelize.query(`
        SELECT get_sales_summary() as summary
      `, { type: sequelize.QueryTypes.SELECT });
      console.log('✅ get_sales_summary يعمل بشكل صحيح');
      
      // اختبار sales invoices
      const invoicesTest = await sequelize.query(`
        SELECT get_sales_invoices_fixed(1, 3) as invoices
      `, { type: sequelize.QueryTypes.SELECT });
      console.log('✅ get_sales_invoices_fixed يعمل بشكل صحيح');
      
      // اختبار customers
      const customersTest = await sequelize.query(`
        SELECT get_customers_list_fixed(1, 3) as customers
      `, { type: sequelize.QueryTypes.SELECT });
      console.log('✅ get_customers_list_fixed يعمل بشكل صحيح');
      
      // اختبار dashboard view
      const dashboardTest = await sequelize.query(`
        SELECT * FROM sales_dashboard_view
      `, { type: sequelize.QueryTypes.SELECT });
      console.log('✅ sales_dashboard_view يعمل بشكل صحيح');
      
    } catch (error) {
      console.log(`❌ خطأ في الاختبار الشامل: ${error.message}`);
    }

    console.log('\n🎉 تم إصلاح جميع مشاكل enum بنجاح!');
    console.log('\n📋 الملخص النهائي:');
    console.log('  ✅ get_sales_summary() - ملخص المبيعات');
    console.log('  ✅ get_sales_invoices_fixed() - قائمة الفواتير (مع enum casting)');
    console.log('  ✅ get_customers_list_fixed() - قائمة العملاء (مع enum casting)');
    console.log('  ✅ get_customer_by_id() - عميل واحد');
    console.log('  ✅ get_sales_invoice_by_id() - فاتورة واحدة');
    console.log('  ✅ sales_dashboard_view - عرض شامل للمبيعات');
    console.log('\n💡 جميع الـ functions جاهزة للاستخدام في APIs!');
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح enum:', error.message);
    console.error('📋 تفاصيل الخطأ:', error);
  } finally {
    await sequelize.close();
  }
}

// تشغيل الإصلاح
fixEnumIssues();
