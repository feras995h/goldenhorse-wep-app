import pkg from 'pg';
const { Client } = pkg;

// استخدام نفس قاعدة البيانات التي يستخدمها الخادم
const dbConfig = {
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden_horse_dev'
};

async function createLogoTableProduction() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات الإنتاجية بنجاح');
    console.log('🔗 قاعدة البيانات:', dbConfig.connectionString.split('@')[1]);

    console.log('\n🔧 إنشاء جدول company_logo في قاعدة البيانات الإنتاجية...\n');

    // 1. إنشاء جدول company_logo
    console.log('📊 إنشاء جدول company_logo...');
    
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
      console.log('✅ تم إنشاء جدول company_logo بنجاح');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ جدول company_logo موجود بالفعل');
      } else {
        console.error('❌ خطأ في إنشاء جدول company_logo:', error.message);
        throw error;
      }
    }

    // 2. إنشاء فهارس للأداء
    console.log('\n📈 إنشاء فهارس للأداء...');
    
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_company_logo_filename ON company_logo(filename);',
      'CREATE INDEX IF NOT EXISTS idx_company_logo_upload_date ON company_logo(upload_date);'
    ];

    for (const indexQuery of indexQueries) {
      try {
        await client.query(indexQuery);
        console.log(`✅ تم إنشاء فهرس: ${indexQuery.split(' ')[5]}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️ الفهرس موجود بالفعل`);
        } else {
          console.error('❌ خطأ في إنشاء الفهرس:', error.message);
        }
      }
    }

    // 3. إضافة إعداد current_logo_id
    console.log('\n⚙️ إضافة إعداد current_logo_id...');
    
    try {
      // التحقق من وجود إعداد current_logo_id
      const existingLogoId = await client.query('SELECT id FROM settings WHERE key = $1', ['current_logo_id']);
      
      if (existingLogoId.rows.length === 0) {
        await client.query(`
          INSERT INTO settings (id, key, value, type, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), 'current_logo_id', NULL, 'text', NOW(), NOW())
        `);
        console.log('✅ تم إضافة إعداد current_logo_id');
      } else {
        console.log('⚠️ إعداد current_logo_id موجود بالفعل');
      }
    } catch (error) {
      console.error('❌ خطأ في إضافة إعدادات الشعار:', error.message);
    }

    // 4. إنشاء شعار افتراضي
    console.log('\n🎨 إنشاء شعار افتراضي...');
    
    try {
      // التحقق من وجود شعار في جدول company_logo
      const existingLogo = await client.query('SELECT COUNT(*) as count FROM company_logo');
      
      if (parseInt(existingLogo.rows[0].count) === 0) {
        // إنشاء شعار SVG افتراضي
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
        
        const insertResult = await client.query(`
          INSERT INTO company_logo (filename, original_name, mimetype, size, data, upload_date)
          VALUES ($1, $2, $3, $4, $5, NOW())
          RETURNING id;
        `, ['default-logo.svg', 'Golden Horse Logo.svg', 'image/svg+xml', logoBuffer.length, logoBuffer]);
        
        const logoId = insertResult.rows[0].id;
        
        // تحديث current_logo_id
        await client.query(`
          UPDATE settings 
          SET value = $1, "updatedAt" = NOW()
          WHERE key = 'current_logo_id'
        `, [logoId]);
        
        console.log('✅ تم إنشاء وحفظ الشعار الافتراضي');
        console.log(`📋 معرف الشعار: ${logoId}`);
      } else {
        console.log('⚠️ يوجد شعار محفوظ بالفعل في الجدول');
      }
      
    } catch (error) {
      console.error('❌ خطأ في إنشاء الشعار الافتراضي:', error.message);
    }

    // 5. اختبار النظام
    console.log('\n🧪 اختبار النظام...');
    
    try {
      const logoTest = await client.query(`
        SELECT filename, original_name, mimetype, size, upload_date,
               LENGTH(data) as data_size
        FROM company_logo 
        ORDER BY upload_date DESC 
        LIMIT 1;
      `);
      
      if (logoTest.rows.length > 0) {
        const logo = logoTest.rows[0];
        console.log('✅ تم العثور على الشعار:');
        console.log(`- اسم الملف: ${logo.filename}`);
        console.log(`- الاسم الأصلي: ${logo.original_name}`);
        console.log(`- نوع الملف: ${logo.mimetype}`);
        console.log(`- الحجم المسجل: ${logo.size} bytes`);
        console.log(`- حجم البيانات الفعلي: ${logo.data_size} bytes`);
        console.log(`- تاريخ الرفع: ${logo.upload_date}`);
      } else {
        console.log('❌ لم يتم العثور على أي شعار');
      }
      
    } catch (error) {
      console.error('❌ خطأ في اختبار النظام:', error.message);
    }

    console.log('\n🎉 تم إنشاء جدول الشعار في قاعدة البيانات الإنتاجية بنجاح!');
    
    console.log('\n📋 ملخص العمليات:');
    console.log('✅ تم إنشاء جدول company_logo');
    console.log('✅ تم إنشاء فهارس للأداء');
    console.log('✅ تم إضافة إعداد current_logo_id');
    console.log('✅ تم إنشاء شعار افتراضي');
    console.log('✅ تم اختبار النظام');
    
    console.log('\n💡 الآن يمكن اختبار API الشعار:');
    console.log('- GET http://localhost:5001/api/settings/logo');
    console.log('- GET http://localhost:5001/api/settings');

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// تشغيل السكريپت
createLogoTableProduction().catch(console.error);
