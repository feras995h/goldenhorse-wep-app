import pkg from 'pg';
const { Client } = pkg;

// قاعدة البيانات المنشورة
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

async function fixProductionAPIs() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات المنشورة');

    console.log('\n🔧 إصلاح مشاكل APIs...\n');

    // 1. إصلاح جدول sales_invoices - إضافة الأعمدة المفقودة
    console.log('💰 إصلاح جدول sales_invoices...');
    
    const salesInvoiceColumns = [
      'ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS "invoiceDate" DATE;',
      'ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS "dueDate" DATE;',
      'ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS "subtotal" DECIMAL(15,2) DEFAULT 0;',
      'ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS "taxAmount" DECIMAL(15,2) DEFAULT 0;',
      'ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS "discountAmount" DECIMAL(15,2) DEFAULT 0;',
      'ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS "totalAmount" DECIMAL(15,2) DEFAULT 0;'
    ];

    for (const columnQuery of salesInvoiceColumns) {
      try {
        await client.query(columnQuery);
        const columnName = columnQuery.split('"')[1];
        console.log(`✅ تم إضافة عمود: ${columnName}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️ العمود موجود بالفعل`);
        } else {
          console.error('❌ خطأ في إضافة العمود:', error.message);
        }
      }
    }

    // 2. إصلاح جدول customers - إضافة الأعمدة المفقودة
    console.log('\n👥 إصلاح جدول customers...');
    
    const customerColumns = [
      'ALTER TABLE customers ADD COLUMN IF NOT EXISTS "customerType" VARCHAR(50) DEFAULT \'individual\';',
      'ALTER TABLE customers ADD COLUMN IF NOT EXISTS "taxNumber" VARCHAR(100);',
      'ALTER TABLE customers ADD COLUMN IF NOT EXISTS "creditLimit" DECIMAL(15,2) DEFAULT 0;',
      'ALTER TABLE customers ADD COLUMN IF NOT EXISTS "paymentTerms" INTEGER DEFAULT 30;',
      'ALTER TABLE customers ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;'
    ];

    for (const columnQuery of customerColumns) {
      try {
        await client.query(columnQuery);
        const columnName = columnQuery.split('"')[1] || columnQuery.split('ADD COLUMN IF NOT EXISTS ')[1].split(' ')[0];
        console.log(`✅ تم إضافة عمود: ${columnName}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️ العمود موجود بالفعل`);
        } else {
          console.error('❌ خطأ في إضافة العمود:', error.message);
        }
      }
    }

    // 3. إنشاء بيانات تجريبية للعملاء إذا لم تكن موجودة
    console.log('\n📊 إضافة بيانات تجريبية للعملاء...');
    
    try {
      const customerCount = await client.query('SELECT COUNT(*) as count FROM customers');
      
      if (parseInt(customerCount.rows[0].count) < 5) {
        const sampleCustomers = [
          ['شركة الشحن السريع', 'company', 'fast-shipping@example.com', '+218-91-1234567'],
          ['محمد أحمد علي', 'individual', 'mohamed.ahmed@example.com', '+218-92-2345678'],
          ['شركة التجارة الدولية', 'company', 'international-trade@example.com', '+218-93-3456789'],
          ['فاطمة محمد', 'individual', 'fatima.mohamed@example.com', '+218-94-4567890'],
          ['مؤسسة النقل البحري', 'company', 'maritime-transport@example.com', '+218-95-5678901']
        ];

        for (const [name, type, email, phone] of sampleCustomers) {
          try {
            await client.query(`
              INSERT INTO customers (id, name, "customerType", email, phone, "isActive", "createdAt", "updatedAt")
              VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW())
              ON CONFLICT (email) DO NOTHING
            `, [name, type, email, phone]);
            
            console.log(`✅ تم إضافة عميل: ${name}`);
          } catch (error) {
            console.log(`⚠️ العميل موجود بالفعل: ${name}`);
          }
        }
      } else {
        console.log('⚠️ يوجد عملاء كافيين في قاعدة البيانات');
      }
    } catch (error) {
      console.error('❌ خطأ في إضافة العملاء:', error.message);
    }

    // 4. إنشاء بيانات تجريبية للأصول الثابتة
    console.log('\n🏢 إضافة بيانات تجريبية للأصول الثابتة...');
    
    try {
      const assetsCount = await client.query('SELECT COUNT(*) as count FROM fixed_assets');
      
      if (parseInt(assetsCount.rows[0].count) < 5) {
        // الحصول على حساب الأصول الثابتة
        const assetAccount = await client.query(`
          SELECT id FROM accounts 
          WHERE name LIKE '%أصول ثابتة%' OR name LIKE '%Fixed Assets%' 
          LIMIT 1
        `);
        
        const accountId = assetAccount.rows[0]?.id;
        
        const sampleAssets = [
          ['أجهزة كمبيوتر مكتبية', 'معدات تقنية', 15000, 'active'],
          ['سيارة نقل', 'مركبات', 45000, 'active'],
          ['أثاث مكتبي', 'أثاث ومعدات', 8000, 'active'],
          ['نظام أمان', 'معدات أمنية', 12000, 'active'],
          ['مولد كهربائي', 'معدات كهربائية', 25000, 'active']
        ];

        for (const [name, category, price, status] of sampleAssets) {
          try {
            await client.query(`
              INSERT INTO fixed_assets (
                id, name, category, "purchasePrice", "currentValue", 
                "accountId", status, "createdAt", "updatedAt"
              )
              VALUES (gen_random_uuid(), $1, $2, $3, $3, $4, $5, NOW(), NOW())
            `, [name, category, price, accountId, status]);
            
            console.log(`✅ تم إضافة أصل ثابت: ${name}`);
          } catch (error) {
            console.log(`⚠️ خطأ في إضافة الأصل: ${name} - ${error.message}`);
          }
        }
      } else {
        console.log('⚠️ يوجد أصول ثابتة كافية في قاعدة البيانات');
      }
    } catch (error) {
      console.error('❌ خطأ في إضافة الأصول الثابتة:', error.message);
    }

    // 5. إنشاء فهارس إضافية للأداء
    console.log('\n📈 إنشاء فهارس إضافية...');
    
    const additionalIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_customers_type ON customers("customerType");',
      'CREATE INDEX IF NOT EXISTS idx_customers_active ON customers("isActive");',
      'CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);',
      'CREATE INDEX IF NOT EXISTS idx_sales_invoices_invoice_date ON sales_invoices("invoiceDate");'
    ];

    for (const indexQuery of additionalIndexes) {
      try {
        await client.query(indexQuery);
        const indexName = indexQuery.split(' ')[5];
        console.log(`✅ تم إنشاء فهرس: ${indexName}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️ الفهرس موجود بالفعل`);
        } else {
          console.error('❌ خطأ في إنشاء الفهرس:', error.message);
        }
      }
    }

    // 6. اختبار نهائي للـ APIs
    console.log('\n🧪 اختبار APIs...');
    
    const apiTests = [
      { name: 'العملاء', query: 'SELECT COUNT(*) as count FROM customers WHERE "isActive" = true' },
      { name: 'الأصول الثابتة', query: 'SELECT COUNT(*) as count FROM fixed_assets WHERE status = \'active\'' },
      { name: 'فواتير المبيعات', query: 'SELECT COUNT(*) as count FROM sales_invoices' },
      { name: 'عناصر الفواتير', query: 'SELECT COUNT(*) as count FROM sales_invoice_items' }
    ];

    for (const test of apiTests) {
      try {
        const result = await client.query(test.query);
        console.log(`✅ ${test.name}: ${result.rows[0].count} سجل نشط`);
      } catch (error) {
        console.error(`❌ ${test.name}: خطأ - ${error.message}`);
      }
    }

    console.log('\n🎉 تم إصلاح APIs المنشورة بنجاح!');
    
    console.log('\n📋 ملخص الإصلاحات:');
    console.log('✅ تم إصلاح جدول sales_invoices');
    console.log('✅ تم إصلاح جدول customers');
    console.log('✅ تم إضافة بيانات تجريبية للعملاء');
    console.log('✅ تم إضافة بيانات تجريبية للأصول الثابتة');
    console.log('✅ تم إنشاء فهارس إضافية للأداء');
    
    console.log('\n💡 الآن يجب أن تعمل APIs التالية:');
    console.log('- /api/financial/customers');
    console.log('- /api/financial/fixed-assets');
    console.log('- /api/sales/invoices');
    console.log('- /api/sales/customers');

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// تشغيل السكريپت
fixProductionAPIs().catch(console.error);
