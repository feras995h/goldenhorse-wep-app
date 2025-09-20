import pkg from 'pg';
const { Client } = pkg;

// إعدادات قاعدة البيانات
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

async function fixDatabaseDataIssues() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    console.log('\n🔧 إصلاح مشاكل البيانات في قاعدة البيانات...\n');

    // 1. إضافة الحسابات الرئيسية الأساسية
    console.log('📊 إضافة الحسابات الرئيسية الأساسية...');
    
    const mainAccounts = [
      { code: '1000', name: 'الأصول', type: 'asset', level: 1, parentId: null },
      { code: '1100', name: 'الأصول المتداولة', type: 'asset', level: 2, parentCode: '1000' },
      { code: '1110', name: 'النقدية والبنوك', type: 'asset', level: 3, parentCode: '1100' },
      { code: '1120', name: 'العملاء', type: 'asset', level: 3, parentCode: '1100' },
      { code: '1130', name: 'المخزون', type: 'asset', level: 3, parentCode: '1100' },
      
      { code: '2000', name: 'الالتزامات', type: 'liability', level: 1, parentId: null },
      { code: '2100', name: 'الالتزامات المتداولة', type: 'liability', level: 2, parentCode: '2000' },
      { code: '2110', name: 'الموردين', type: 'liability', level: 3, parentCode: '2100' },
      { code: '2120', name: 'مصاريف مستحقة', type: 'liability', level: 3, parentCode: '2100' },
      
      { code: '3000', name: 'حقوق الملكية', type: 'equity', level: 1, parentId: null },
      { code: '3100', name: 'رأس المال', type: 'equity', level: 2, parentCode: '3000' },
      { code: '3200', name: 'الأرباح المحتجزة', type: 'equity', level: 2, parentCode: '3000' },
      
      { code: '4000', name: 'الإيرادات', type: 'revenue', level: 1, parentId: null },
      { code: '4100', name: 'إيرادات المبيعات', type: 'revenue', level: 2, parentCode: '4000' },
      { code: '4200', name: 'إيرادات أخرى', type: 'revenue', level: 2, parentCode: '4000' },
      
      { code: '5000', name: 'المصروفات', type: 'expense', level: 1, parentId: null },
      { code: '5100', name: 'تكلفة البضاعة المباعة', type: 'expense', level: 2, parentCode: '5000' },
      { code: '5200', name: 'مصروفات تشغيلية', type: 'expense', level: 2, parentCode: '5000' }
    ];

    // إنشاء map للحسابات الأب
    const accountsMap = new Map();

    for (const account of mainAccounts) {
      try {
        // البحث عن الحساب الأب إذا كان موجوداً
        let parentId = account.parentId;
        if (account.parentCode) {
          const parentResult = await client.query('SELECT id FROM accounts WHERE code = $1', [account.parentCode]);
          if (parentResult.rows.length > 0) {
            parentId = parentResult.rows[0].id;
          }
        }

        // التحقق من وجود الحساب
        const existingAccount = await client.query('SELECT id FROM accounts WHERE code = $1', [account.code]);
        
        if (existingAccount.rows.length === 0) {
          const insertResult = await client.query(`
            INSERT INTO accounts (code, name, type, level, "parentId", "isActive", balance, "debitBalance", "creditBalance", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, true, 0, 0, 0, NOW(), NOW())
            RETURNING id
          `, [account.code, account.name, account.type, account.level, parentId]);
          
          accountsMap.set(account.code, insertResult.rows[0].id);
          console.log(`✅ تم إضافة الحساب: ${account.code} - ${account.name}`);
        } else {
          accountsMap.set(account.code, existingAccount.rows[0].id);
          console.log(`⚠️ الحساب موجود بالفعل: ${account.code} - ${account.name}`);
        }
      } catch (error) {
        console.error(`❌ خطأ في إضافة الحساب ${account.code}:`, error.message);
      }
    }

    // 2. إضافة عميل افتراضي
    console.log('\n👤 إضافة عميل افتراضي...');
    try {
      const existingCustomer = await client.query('SELECT id FROM customers WHERE code = $1', ['CUST001']);
      
      if (existingCustomer.rows.length === 0) {
        await client.query(`
          INSERT INTO customers (code, name, type, email, phone, address, "isActive", "createdAt", "updatedAt")
          VALUES ('CUST001', 'عميل افتراضي', 'individual', 'default@example.com', '123456789', 'العنوان الافتراضي', true, NOW(), NOW())
        `);
        console.log('✅ تم إضافة العميل الافتراضي');
      } else {
        console.log('⚠️ العميل الافتراضي موجود بالفعل');
      }
    } catch (error) {
      console.error('❌ خطأ في إضافة العميل الافتراضي:', error.message);
    }

    // 3. إضافة مورد افتراضي
    console.log('\n🏪 إضافة مورد افتراضي...');
    try {
      const existingSupplier = await client.query('SELECT id FROM suppliers WHERE code = $1', ['SUPP001']);
      
      if (existingSupplier.rows.length === 0) {
        await client.query(`
          INSERT INTO suppliers (code, name, email, phone, address, "isActive", "createdAt", "updatedAt")
          VALUES ('SUPP001', 'مورد افتراضي', 'supplier@example.com', '987654321', 'عنوان المورد', true, NOW(), NOW())
        `);
        console.log('✅ تم إضافة المورد الافتراضي');
      } else {
        console.log('⚠️ المورد الافتراضي موجود بالفعل');
      }
    } catch (error) {
      console.error('❌ خطأ في إضافة المورد الافتراضي:', error.message);
    }

    // 4. تحديث أرصدة الحسابات
    console.log('\n💰 تحديث أرصدة الحسابات...');
    try {
      await client.query(`
        UPDATE accounts 
        SET 
          "debitBalance" = CASE 
            WHEN type IN ('asset', 'expense') THEN ABS(balance)
            ELSE 0 
          END,
          "creditBalance" = CASE 
            WHEN type IN ('liability', 'equity', 'revenue') THEN ABS(balance)
            ELSE 0 
          END,
          "updatedAt" = NOW()
      `);
      console.log('✅ تم تحديث أرصدة الحسابات');
    } catch (error) {
      console.error('❌ خطأ في تحديث أرصدة الحسابات:', error.message);
    }

    // 5. إضافة إعدادات النظام الأساسية
    console.log('\n⚙️ إضافة إعدادات النظام الأساسية...');
    
    const systemSettings = [
      { key: 'company_name', value: 'Golden Horse Shipping Services', type: 'text' },
      { key: 'company_address', value: 'ليبيا - طرابلس', type: 'text' },
      { key: 'company_phone', value: '+218-XX-XXXXXXX', type: 'text' },
      { key: 'company_email', value: 'info@goldenhorse.ly', type: 'text' },
      { key: 'default_currency', value: 'LYD', type: 'text' },
      { key: 'tax_rate', value: '0.00', type: 'number' },
      { key: 'invoice_prefix', value: 'INV-', type: 'text' },
      { key: 'receipt_prefix', value: 'REC-', type: 'text' },
      { key: 'payment_prefix', value: 'PAY-', type: 'text' }
    ];

    for (const setting of systemSettings) {
      try {
        const existingSetting = await client.query('SELECT id FROM settings WHERE key = $1', [setting.key]);
        
        if (existingSetting.rows.length === 0) {
          await client.query(`
            INSERT INTO settings (key, value, type, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, NOW(), NOW())
          `, [setting.key, setting.value, setting.type]);
          console.log(`✅ تم إضافة الإعداد: ${setting.key}`);
        } else {
          console.log(`⚠️ الإعداد موجود بالفعل: ${setting.key}`);
        }
      } catch (error) {
        console.error(`❌ خطأ في إضافة الإعداد ${setting.key}:`, error.message);
      }
    }

    // 6. إنشاء فهارس لتحسين الأداء
    console.log('\n📈 إنشاء فهارس لتحسين الأداء...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_accounts_code ON accounts(code);',
      'CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);',
      'CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(code);',
      'CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(code);',
      'CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices("customerId");',
      'CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);',
      'CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments("customerId");',
      'CREATE INDEX IF NOT EXISTS idx_receipts_supplier ON receipts("supplierId");',
      'CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer ON sales_invoices("customerId");',
      'CREATE INDEX IF NOT EXISTS idx_sales_invoices_date ON sales_invoices(date);',
      'CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date);',
      'CREATE INDEX IF NOT EXISTS idx_journal_entry_details_account ON journal_entry_details("accountId");'
    ];

    for (const indexQuery of indexes) {
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

    console.log('\n🎉 تم إصلاح جميع مشاكل البيانات بنجاح!');

    // 7. عرض إحصائيات نهائية
    console.log('\n📊 إحصائيات قاعدة البيانات النهائية:');
    
    const stats = await Promise.all([
      client.query('SELECT COUNT(*) as count FROM accounts'),
      client.query('SELECT COUNT(*) as count FROM customers'),
      client.query('SELECT COUNT(*) as count FROM suppliers'),
      client.query('SELECT COUNT(*) as count FROM invoices'),
      client.query('SELECT COUNT(*) as count FROM sales_invoices'),
      client.query('SELECT COUNT(*) as count FROM payments'),
      client.query('SELECT COUNT(*) as count FROM receipts'),
      client.query('SELECT COUNT(*) as count FROM settings')
    ]);

    console.log(`- الحسابات: ${stats[0].rows[0].count}`);
    console.log(`- العملاء: ${stats[1].rows[0].count}`);
    console.log(`- الموردين: ${stats[2].rows[0].count}`);
    console.log(`- الفواتير: ${stats[3].rows[0].count}`);
    console.log(`- فواتير المبيعات: ${stats[4].rows[0].count}`);
    console.log(`- المدفوعات: ${stats[5].rows[0].count}`);
    console.log(`- الإيصالات: ${stats[6].rows[0].count}`);
    console.log(`- الإعدادات: ${stats[7].rows[0].count}`);

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// تشغيل السكريپت
fixDatabaseDataIssues().catch(console.error);
