import pkg from 'pg';
const { Client } = pkg;

// إعدادات قاعدة البيانات
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

// تعريف الجداول المطلوبة مع أعمدتها
const requiredTables = {
  accounts: [
    { name: 'id', type: 'uuid', nullable: false },
    { name: 'code', type: 'character varying', nullable: false },
    { name: 'name', type: 'character varying', nullable: false },
    { name: 'type', type: 'USER-DEFINED', nullable: false },
    { name: 'parentId', type: 'uuid', nullable: true },
    { name: 'level', type: 'integer', nullable: false },
    { name: 'isActive', type: 'boolean', nullable: false },
    { name: 'balance', type: 'numeric', nullable: false },
    { name: 'debitBalance', type: 'numeric', nullable: false },
    { name: 'creditBalance', type: 'numeric', nullable: false }
  ],
  customers: [
    { name: 'id', type: 'uuid', nullable: false },
    { name: 'code', type: 'character varying', nullable: false },
    { name: 'name', type: 'character varying', nullable: false },
    { name: 'type', type: 'USER-DEFINED', nullable: false },
    { name: 'email', type: 'character varying', nullable: true },
    { name: 'phone', type: 'character varying', nullable: true },
    { name: 'address', type: 'text', nullable: true },
    { name: 'isActive', type: 'boolean', nullable: false }
  ],
  suppliers: [
    { name: 'id', type: 'uuid', nullable: false },
    { name: 'code', type: 'character varying', nullable: false },
    { name: 'name', type: 'character varying', nullable: false },
    { name: 'email', type: 'character varying', nullable: true },
    { name: 'phone', type: 'character varying', nullable: true },
    { name: 'address', type: 'text', nullable: true },
    { name: 'isActive', type: 'boolean', nullable: false }
  ],
  invoices: [
    { name: 'id', type: 'uuid', nullable: false },
    { name: 'invoiceNumber', type: 'character varying', nullable: false },
    { name: 'customerId', type: 'uuid', nullable: false },
    { name: 'date', type: 'date', nullable: false },
    { name: 'dueDate', type: 'date', nullable: true },
    { name: 'subtotal', type: 'numeric', nullable: false },
    { name: 'taxAmount', type: 'numeric', nullable: false },
    { name: 'total', type: 'numeric', nullable: false },
    { name: 'paidAmount', type: 'numeric', nullable: false },
    { name: 'status', type: 'USER-DEFINED', nullable: false },
    { name: 'currency', type: 'character varying', nullable: false }
  ],
  receipts: [
    { name: 'id', type: 'uuid', nullable: false },
    { name: 'receiptNo', type: 'character varying', nullable: false },
    { name: 'supplierId', type: 'uuid', nullable: false },
    { name: 'receiptDate', type: 'date', nullable: false },
    { name: 'amount', type: 'numeric', nullable: false },
    { name: 'paymentMethod', type: 'USER-DEFINED', nullable: false },
    { name: 'status', type: 'USER-DEFINED', nullable: true },
    { name: 'accountId', type: 'uuid', nullable: true },
    { name: 'partyType', type: 'USER-DEFINED', nullable: true },
    { name: 'partyId', type: 'uuid', nullable: true },
    { name: 'voucherType', type: 'USER-DEFINED', nullable: true }
  ],
  payments: [
    { name: 'id', type: 'uuid', nullable: false },
    { name: 'paymentNumber', type: 'character varying', nullable: false },
    { name: 'customerId', type: 'uuid', nullable: false },
    { name: 'date', type: 'date', nullable: false },
    { name: 'amount', type: 'numeric', nullable: false },
    { name: 'paymentMethod', type: 'USER-DEFINED', nullable: false },
    { name: 'status', type: 'USER-DEFINED', nullable: true },
    { name: 'accountId', type: 'uuid', nullable: true },
    { name: 'partyType', type: 'USER-DEFINED', nullable: true },
    { name: 'partyId', type: 'uuid', nullable: true },
    { name: 'voucherType', type: 'USER-DEFINED', nullable: true }
  ],
  sales_invoices: [
    { name: 'id', type: 'uuid', nullable: false },
    { name: 'invoiceNumber', type: 'character varying', nullable: false },
    { name: 'customerId', type: 'uuid', nullable: false },
    { name: 'date', type: 'date', nullable: false },
    { name: 'subtotal', type: 'numeric', nullable: false },
    { name: 'taxAmount', type: 'numeric', nullable: false },
    { name: 'total', type: 'numeric', nullable: false },
    { name: 'paidAmount', type: 'numeric', nullable: false },
    { name: 'status', type: 'USER-DEFINED', nullable: false }
  ],
  journal_entries: [
    { name: 'id', type: 'uuid', nullable: false },
    { name: 'entryNumber', type: 'character varying', nullable: false },
    { name: 'date', type: 'date', nullable: false },
    { name: 'description', type: 'text', nullable: false },
    { name: 'totalDebit', type: 'numeric', nullable: false },
    { name: 'totalCredit', type: 'numeric', nullable: false },
    { name: 'status', type: 'USER-DEFINED', nullable: false }
  ],
  journal_entry_details: [
    { name: 'id', type: 'uuid', nullable: false },
    { name: 'journalEntryId', type: 'uuid', nullable: false },
    { name: 'accountId', type: 'uuid', nullable: false },
    { name: 'debit', type: 'numeric', nullable: false },
    { name: 'credit', type: 'numeric', nullable: false },
    { name: 'description', type: 'text', nullable: true }
  ]
};

// ENUMs المطلوبة
const requiredEnums = [
  'account_type_enum',
  'customer_type_enum', 
  'invoice_status_enum',
  'payment_method_enum',
  'receipt_status_enum',
  'payment_status_enum',
  'party_type_enum',
  'voucher_type_enum',
  'journal_entry_status_enum'
];

async function comprehensiveDatabaseAudit() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    console.log('\n🔍 بدء المراجعة الشاملة لقاعدة البيانات...\n');

    // 1. فحص الجداول الموجودة
    console.log('📊 فحص الجداول الموجودة...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    console.log(`الجداول الموجودة (${existingTables.length}):`, existingTables.join(', '));

    // 2. فحص ENUMs الموجودة
    console.log('\n🏷️ فحص ENUMs الموجودة...');
    const enumsResult = await client.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' 
      ORDER BY typname;
    `);
    
    const existingEnums = enumsResult.rows.map(row => row.typname);
    console.log(`ENUMs الموجودة (${existingEnums.length}):`, existingEnums.join(', '));

    // 3. إنشاء ENUMs المفقودة
    console.log('\n🔧 إنشاء ENUMs المفقودة...');
    const missingEnums = requiredEnums.filter(enumName => !existingEnums.includes(enumName));
    
    for (const enumName of missingEnums) {
      try {
        let enumQuery = '';
        switch (enumName) {
          case 'account_type_enum':
            enumQuery = `CREATE TYPE account_type_enum AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');`;
            break;
          case 'customer_type_enum':
            enumQuery = `CREATE TYPE customer_type_enum AS ENUM ('individual', 'company');`;
            break;
          case 'invoice_status_enum':
            enumQuery = `CREATE TYPE invoice_status_enum AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');`;
            break;
          case 'payment_method_enum':
            enumQuery = `CREATE TYPE payment_method_enum AS ENUM ('cash', 'bank_transfer', 'check', 'credit_card');`;
            break;
          case 'receipt_status_enum':
            enumQuery = `CREATE TYPE receipt_status_enum AS ENUM ('pending', 'completed', 'cancelled');`;
            break;
          case 'payment_status_enum':
            enumQuery = `CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'cancelled');`;
            break;
          case 'party_type_enum':
            enumQuery = `CREATE TYPE party_type_enum AS ENUM ('supplier', 'customer', 'employee', 'account');`;
            break;
          case 'voucher_type_enum':
            enumQuery = `CREATE TYPE voucher_type_enum AS ENUM ('receipt', 'payment');`;
            break;
          case 'journal_entry_status_enum':
            enumQuery = `CREATE TYPE journal_entry_status_enum AS ENUM ('draft', 'posted', 'cancelled');`;
            break;
        }
        
        if (enumQuery) {
          await client.query(enumQuery);
          console.log(`✅ تم إنشاء ${enumName}`);
        }
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️ ${enumName} موجود بالفعل`);
        } else {
          console.error(`❌ خطأ في إنشاء ${enumName}:`, error.message);
        }
      }
    }

    // 4. فحص وإصلاح كل جدول
    console.log('\n📋 فحص وإصلاح الجداول...');
    
    for (const [tableName, requiredColumns] of Object.entries(requiredTables)) {
      if (!existingTables.includes(tableName)) {
        console.log(`⚠️ الجدول ${tableName} غير موجود - سيتم تخطيه`);
        continue;
      }

      console.log(`\n🔍 فحص جدول ${tableName}...`);
      
      // جلب أعمدة الجدول الحالية
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position;
      `, [tableName]);
      
      const existingColumns = columnsResult.rows.map(row => ({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES'
      }));

      // العثور على الأعمدة المفقودة
      const missingColumns = requiredColumns.filter(reqCol => 
        !existingColumns.some(existCol => existCol.name === reqCol.name)
      );

      if (missingColumns.length > 0) {
        console.log(`🔧 إضافة أعمدة مفقودة في ${tableName}: ${missingColumns.map(c => c.name).join(', ')}`);
        
        for (const column of missingColumns) {
          try {
            let columnType = column.type;
            if (column.type === 'USER-DEFINED') {
              // تحديد نوع ENUM المناسب حسب اسم العمود
              if (column.name === 'type' && tableName === 'accounts') columnType = 'account_type_enum';
              else if (column.name === 'type' && tableName === 'customers') columnType = 'customer_type_enum';
              else if (column.name === 'status' && tableName === 'invoices') columnType = 'invoice_status_enum';
              else if (column.name === 'paymentMethod') columnType = 'payment_method_enum';
              else if (column.name === 'status' && tableName === 'receipts') columnType = 'receipt_status_enum';
              else if (column.name === 'status' && tableName === 'payments') columnType = 'payment_status_enum';
              else if (column.name === 'partyType') columnType = 'party_type_enum';
              else if (column.name === 'voucherType') columnType = 'voucher_type_enum';
              else if (column.name === 'status' && tableName === 'journal_entries') columnType = 'journal_entry_status_enum';
              else columnType = 'character varying';
            }

            const nullableClause = column.nullable ? '' : ' NOT NULL';
            const defaultClause = getDefaultValue(column.name, columnType);
            
            const alterQuery = `ALTER TABLE ${tableName} ADD COLUMN "${column.name}" ${columnType}${nullableClause}${defaultClause};`;
            await client.query(alterQuery);
            console.log(`✅ تم إضافة العمود ${column.name} إلى ${tableName}`);
          } catch (error) {
            if (error.message.includes('already exists')) {
              console.log(`⚠️ العمود ${column.name} موجود بالفعل في ${tableName}`);
            } else {
              console.error(`❌ خطأ في إضافة العمود ${column.name} إلى ${tableName}:`, error.message);
            }
          }
        }
      } else {
        console.log(`✅ جميع الأعمدة المطلوبة موجودة في ${tableName}`);
      }
    }

    console.log('\n🎉 تمت المراجعة الشاملة لقاعدة البيانات بنجاح!');

  } catch (error) {
    console.error('❌ خطأ في المراجعة الشاملة:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

function getDefaultValue(columnName, columnType) {
  // إضافة قيم افتراضية للأعمدة المطلوبة
  if (columnName === 'balance' || columnName === 'debitBalance' || columnName === 'creditBalance') {
    return ' DEFAULT 0';
  }
  if (columnName === 'isActive') {
    return ' DEFAULT true';
  }
  if (columnName === 'level') {
    return ' DEFAULT 1';
  }
  if (columnName === 'currency') {
    return " DEFAULT 'LYD'";
  }
  if (columnName === 'paidAmount' || columnName === 'subtotal' || columnName === 'taxAmount' || columnName === 'total') {
    return ' DEFAULT 0';
  }
  if (columnType === 'account_type_enum') {
    return " DEFAULT 'asset'";
  }
  if (columnType === 'customer_type_enum') {
    return " DEFAULT 'individual'";
  }
  if (columnType === 'invoice_status_enum') {
    return " DEFAULT 'draft'";
  }
  if (columnType === 'payment_method_enum') {
    return " DEFAULT 'cash'";
  }
  if (columnType === 'receipt_status_enum' || columnType === 'payment_status_enum') {
    return " DEFAULT 'pending'";
  }
  if (columnType === 'party_type_enum') {
    return " DEFAULT 'supplier'";
  }
  if (columnType === 'voucher_type_enum') {
    return " DEFAULT 'receipt'";
  }
  if (columnType === 'journal_entry_status_enum') {
    return " DEFAULT 'draft'";
  }
  return '';
}

// تشغيل المراجعة الشاملة
comprehensiveDatabaseAudit().catch(console.error);
