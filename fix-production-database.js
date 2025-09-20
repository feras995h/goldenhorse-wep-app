import pkg from 'pg';
const { Client } = pkg;

// قاعدة البيانات المنشورة على Coolify
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

async function fixProductionDatabase() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات المنشورة بنجاح');

    console.log('\n🔧 إصلاح قاعدة البيانات المنشورة...\n');

    // 1. إنشاء جدول company_logo
    console.log('🎨 إنشاء جدول company_logo...');
    
    const createLogoTableQuery = `
      CREATE TABLE IF NOT EXISTS company_logo (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mimetype VARCHAR(100) NOT NULL,
        size INTEGER NOT NULL,
        data BYTEA NOT NULL,
        upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;

    try {
      await client.query(createLogoTableQuery);
      console.log('✅ تم إنشاء جدول company_logo');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ جدول company_logo موجود بالفعل');
      } else {
        console.error('❌ خطأ في إنشاء جدول company_logo:', error.message);
      }
    }

    // 2. إنشاء جدول fixed_assets إذا كان مفقوداً
    console.log('\n🏢 التحقق من جدول fixed_assets...');
    
    const createFixedAssetsQuery = `
      CREATE TABLE IF NOT EXISTS fixed_assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        "purchaseDate" DATE,
        "purchasePrice" DECIMAL(15,2) DEFAULT 0,
        "currentValue" DECIMAL(15,2) DEFAULT 0,
        "depreciationRate" DECIMAL(5,2) DEFAULT 0,
        "depreciationMethod" VARCHAR(50) DEFAULT 'straight-line',
        "usefulLife" INTEGER DEFAULT 0,
        "salvageValue" DECIMAL(15,2) DEFAULT 0,
        "accountId" UUID,
        status VARCHAR(50) DEFAULT 'active',
        "serialNumber" VARCHAR(100),
        location VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        FOREIGN KEY ("accountId") REFERENCES accounts(id)
      );
    `;

    try {
      await client.query(createFixedAssetsQuery);
      console.log('✅ تم التحقق من جدول fixed_assets');
    } catch (error) {
      console.error('❌ خطأ في جدول fixed_assets:', error.message);
    }

    // 3. التحقق من جداول المبيعات
    console.log('\n💰 التحقق من جداول المبيعات...');
    
    const salesTables = [
      {
        name: 'sales_invoices',
        query: `
          CREATE TABLE IF NOT EXISTS sales_invoices (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "invoiceNumber" VARCHAR(50) UNIQUE NOT NULL,
            "customerId" UUID NOT NULL,
            "invoiceDate" DATE NOT NULL,
            "dueDate" DATE,
            "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
            "taxAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
            "discountAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
            "totalAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
            status VARCHAR(50) NOT NULL DEFAULT 'draft',
            notes TEXT,
            "createdBy" UUID,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            FOREIGN KEY ("customerId") REFERENCES customers(id),
            FOREIGN KEY ("createdBy") REFERENCES users(id)
          );
        `
      },
      {
        name: 'sales_invoice_items',
        query: `
          CREATE TABLE IF NOT EXISTS sales_invoice_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "salesInvoiceId" UUID NOT NULL,
            description VARCHAR(255) NOT NULL,
            quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
            "unitPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
            "totalPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            FOREIGN KEY ("salesInvoiceId") REFERENCES sales_invoices(id) ON DELETE CASCADE
          );
        `
      }
    ];

    for (const table of salesTables) {
      try {
        await client.query(table.query);
        console.log(`✅ تم التحقق من جدول ${table.name}`);
      } catch (error) {
        console.error(`❌ خطأ في جدول ${table.name}:`, error.message);
      }
    }

    // 4. إضافة الشعار الافتراضي
    console.log('\n🎨 إضافة الشعار الافتراضي...');
    
    try {
      const existingLogo = await client.query('SELECT COUNT(*) as count FROM company_logo');
      
      if (parseInt(existingLogo.rows[0].count) === 0) {
        const defaultLogoSVG = `<svg width="200" height="80" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#B8860B;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="200" height="80" fill="url(#goldGradient)" rx="10"/>
          <text x="100" y="30" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#2C3E50" text-anchor="middle">Golden Horse</text>
          <text x="100" y="50" font-family="Arial, sans-serif" font-size="12" fill="#34495E" text-anchor="middle">Shipping Services</text>
          <text x="100" y="65" font-family="Arial, sans-serif" font-size="8" fill="#7F8C8D" text-anchor="middle">خدمات الشحن الذهبية</text>
        </svg>`;
        
        const logoBuffer = Buffer.from(defaultLogoSVG, 'utf8');
        
        await client.query(`
          INSERT INTO company_logo (filename, original_name, mimetype, size, data, upload_date)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `, ['default-logo.svg', 'Golden Horse Logo.svg', 'image/svg+xml', logoBuffer.length, logoBuffer]);
        
        console.log('✅ تم إضافة الشعار الافتراضي');
      } else {
        console.log('⚠️ الشعار موجود بالفعل');
      }
    } catch (error) {
      console.error('❌ خطأ في إضافة الشعار:', error.message);
    }

    // 5. إنشاء فهارس مفقودة
    console.log('\n📈 إنشاء الفهارس المفقودة...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_company_logo_filename ON company_logo(filename);',
      'CREATE INDEX IF NOT EXISTS idx_company_logo_upload_date ON company_logo(upload_date);',
      'CREATE INDEX IF NOT EXISTS idx_fixed_assets_status ON fixed_assets(status);',
      'CREATE INDEX IF NOT EXISTS idx_fixed_assets_category ON fixed_assets(category);',
      'CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer ON sales_invoices("customerId");',
      'CREATE INDEX IF NOT EXISTS idx_sales_invoices_date ON sales_invoices("invoiceDate");',
      'CREATE INDEX IF NOT EXISTS idx_sales_invoices_status ON sales_invoices(status);'
    ];

    for (const indexQuery of indexes) {
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

    // 6. التحقق من ENUMs المطلوبة
    console.log('\n🏷️ التحقق من ENUMs...');
    
    const enumsToCheck = [
      'enum_invoices_status',
      'enum_customers_type',
      'enum_payments_paymentMethod'
    ];

    for (const enumName of enumsToCheck) {
      try {
        const enumResult = await client.query(`
          SELECT enumlabel 
          FROM pg_enum 
          WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = $1)
          ORDER BY enumlabel;
        `, [enumName]);
        
        if (enumResult.rows.length > 0) {
          console.log(`✅ ${enumName}: ${enumResult.rows.map(r => r.enumlabel).join(', ')}`);
        } else {
          console.log(`⚠️ ${enumName}: غير موجود`);
        }
      } catch (error) {
        console.log(`❌ ${enumName}: غير موجود`);
      }
    }

    // 7. اختبار نهائي
    console.log('\n🧪 اختبار نهائي...');
    
    const testQueries = [
      { name: 'العملاء', query: 'SELECT COUNT(*) as count FROM customers' },
      { name: 'الحسابات', query: 'SELECT COUNT(*) as count FROM accounts' },
      { name: 'الأصول الثابتة', query: 'SELECT COUNT(*) as count FROM fixed_assets' },
      { name: 'فواتير المبيعات', query: 'SELECT COUNT(*) as count FROM sales_invoices' },
      { name: 'الشعار', query: 'SELECT COUNT(*) as count FROM company_logo' }
    ];

    for (const test of testQueries) {
      try {
        const result = await client.query(test.query);
        console.log(`✅ ${test.name}: ${result.rows[0].count} سجل`);
      } catch (error) {
        console.error(`❌ ${test.name}: خطأ - ${error.message}`);
      }
    }

    console.log('\n🎉 تم إصلاح قاعدة البيانات المنشورة بنجاح!');
    
    console.log('\n📋 ملخص الإصلاحات:');
    console.log('✅ تم إنشاء جدول company_logo');
    console.log('✅ تم التحقق من جدول fixed_assets');
    console.log('✅ تم التحقق من جداول المبيعات');
    console.log('✅ تم إضافة الشعار الافتراضي');
    console.log('✅ تم إنشاء الفهارس المطلوبة');
    
    console.log('\n💡 الخطوات التالية:');
    console.log('1. إعادة نشر التطبيق على Coolify');
    console.log('2. اختبار APIs المختلفة');
    console.log('3. التحقق من عمل WebSocket');

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// تشغيل السكريپت
fixProductionDatabase().catch(console.error);
