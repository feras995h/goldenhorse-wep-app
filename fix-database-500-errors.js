import pkg from 'pg';
const { Client } = pkg;

// إعدادات قاعدة البيانات
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

async function fixDatabaseErrors() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // إنشاء الـ ENUMs المطلوبة أولاً
    console.log('\n🔧 إنشاء الـ ENUMs المطلوبة...');
    
    const enumQueries = [
      `DO $$ BEGIN
        CREATE TYPE party_type_enum AS ENUM ('supplier', 'customer', 'employee', 'account');
      EXCEPTION
        WHEN duplicate_object THEN 
          RAISE NOTICE 'party_type_enum already exists, skipping';
      END $$;`,
      
      `DO $$ BEGIN
        CREATE TYPE voucher_type_enum AS ENUM ('receipt', 'payment');
      EXCEPTION
        WHEN duplicate_object THEN 
          RAISE NOTICE 'voucher_type_enum already exists, skipping';
      END $$;`
    ];

    for (const query of enumQueries) {
      try {
        await client.query(query);
        console.log('✅ تم إنشاء ENUM بنجاح');
      } catch (error) {
        console.log('⚠️ ENUM موجود بالفعل أو خطأ:', error.message);
      }
    }

    // إصلاح جدول receipts
    console.log('\n📊 إصلاح جدول receipts...');
    await fixTable(client, 'receipts', 'receipt');

    // إصلاح جدول payments
    console.log('\n📊 إصلاح جدول payments...');
    await fixTable(client, 'payments', 'payment');

    console.log('\n🎉 تم إصلاح جميع مشاكل قاعدة البيانات بنجاح!');

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function fixTable(client, tableName, defaultVoucherType) {
  try {
    // فحص بنية الجدول الحالية
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position;
    `, [tableName]);
    
    console.log(`الأعمدة الموجودة في ${tableName}:`);
    columnsResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // التحقق من وجود الأعمدة المطلوبة
    const existingColumns = columnsResult.rows.map(row => row.column_name);
    const requiredColumns = ['accountId', 'partyType', 'partyId', 'voucherType'];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length === 0) {
      console.log(`✅ جميع الأعمدة المطلوبة موجودة في ${tableName}!`);
      return;
    }

    console.log(`🔧 إضافة الأعمدة المفقودة في ${tableName}: ${missingColumns.join(', ')}`);

    // إضافة الأعمدة المفقودة
    const alterQueries = [];

    if (missingColumns.includes('accountId')) {
      alterQueries.push(`ALTER TABLE ${tableName} ADD COLUMN "accountId" UUID;`);
      alterQueries.push(`ALTER TABLE ${tableName} ADD CONSTRAINT fk_${tableName}_account FOREIGN KEY ("accountId") REFERENCES accounts(id);`);
    }

    if (missingColumns.includes('partyType')) {
      alterQueries.push(`ALTER TABLE ${tableName} ADD COLUMN "partyType" party_type_enum DEFAULT 'supplier';`);
    }

    if (missingColumns.includes('partyId')) {
      alterQueries.push(`ALTER TABLE ${tableName} ADD COLUMN "partyId" UUID;`);
    }

    if (missingColumns.includes('voucherType')) {
      alterQueries.push(`ALTER TABLE ${tableName} ADD COLUMN "voucherType" voucher_type_enum DEFAULT '${defaultVoucherType}';`);
    }

    // تنفيذ الاستعلامات
    for (const query of alterQueries) {
      try {
        await client.query(query);
        console.log(`✅ تم تنفيذ: ${query.substring(0, 50)}...`);
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log('⚠️ العمود أو القيد موجود بالفعل، تم التخطي');
        } else {
          console.error('❌ خطأ في تنفيذ الاستعلام:', error.message);
        }
      }
    }

    // التحقق من النتيجة النهائية
    const finalResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position;
    `, [tableName]);
    
    console.log(`الأعمدة النهائية في ${tableName}:`);
    finalResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

  } catch (error) {
    console.error(`❌ خطأ في إصلاح جدول ${tableName}:`, error.message);
  }
}

// تشغيل السكريپت
fixDatabaseErrors().catch(console.error);
