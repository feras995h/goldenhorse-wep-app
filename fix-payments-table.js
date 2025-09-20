import pkg from 'pg';
const { Client } = pkg;

// إعدادات قاعدة البيانات
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
};

async function fixPaymentsTable() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // فحص بنية الجدول الحالية
    console.log('\n📊 فحص بنية جدول payments...');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      ORDER BY ordinal_position;
    `);
    
    console.log('الأعمدة الموجودة:');
    columnsResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // التحقق من وجود الأعمدة المطلوبة
    const existingColumns = columnsResult.rows.map(row => row.column_name);
    const requiredColumns = ['accountId', 'partyType', 'partyId', 'voucherType'];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length === 0) {
      console.log('\n✅ جميع الأعمدة المطلوبة موجودة!');
      return;
    }

    console.log(`\n🔧 إضافة الأعمدة المفقودة: ${missingColumns.join(', ')}`);

    // إضافة الأعمدة المفقودة
    const alterQueries = [];

    if (missingColumns.includes('accountId')) {
      alterQueries.push(`
        ALTER TABLE payments 
        ADD COLUMN "accountId" UUID REFERENCES accounts(id);
      `);
    }

    if (missingColumns.includes('partyType')) {
      alterQueries.push(`
        DO $$ BEGIN
          CREATE TYPE party_type_enum AS ENUM ('supplier', 'customer', 'employee', 'account');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      alterQueries.push(`
        ALTER TABLE payments 
        ADD COLUMN "partyType" party_type_enum DEFAULT 'supplier';
      `);
    }

    if (missingColumns.includes('partyId')) {
      alterQueries.push(`
        ALTER TABLE payments 
        ADD COLUMN "partyId" UUID;
      `);
    }

    if (missingColumns.includes('voucherType')) {
      alterQueries.push(`
        DO $$ BEGIN
          CREATE TYPE voucher_type_enum AS ENUM ('receipt', 'payment');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      alterQueries.push(`
        ALTER TABLE payments 
        ADD COLUMN "voucherType" voucher_type_enum DEFAULT 'payment';
      `);
    }

    // تنفيذ الاستعلامات
    for (const query of alterQueries) {
      try {
        await client.query(query);
        console.log('✅ تم تنفيذ الاستعلام بنجاح');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️ العمود موجود بالفعل، تم التخطي');
        } else {
          console.error('❌ خطأ في تنفيذ الاستعلام:', error.message);
        }
      }
    }

    // التحقق من النتيجة النهائية
    console.log('\n📊 فحص بنية الجدول بعد التحديث...');
    const finalResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      ORDER BY ordinal_position;
    `);
    
    console.log('الأعمدة النهائية:');
    finalResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    console.log('\n🎉 تم إصلاح جدول payments بنجاح!');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// تشغيل السكريپت
fixPaymentsTable().catch(console.error);
