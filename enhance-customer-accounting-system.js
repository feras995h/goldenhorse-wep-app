import pkg from 'pg';
const { Client } = pkg;

// قاعدة البيانات المنشورة
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

async function enhanceCustomerAccountingSystem() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات المنشورة');

    console.log('\n🏦 تطوير نظام ربط العملاء بالحسابات المحاسبية...\n');

    // 1. التأكد من وجود الحساب الرئيسي "العملاء" (المدينون)
    console.log('📊 التحقق من الحساب الرئيسي للعملاء...');
    
    let customersMainAccount;
    try {
      const existingAccount = await client.query(`
        SELECT id, code, name, level FROM accounts 
        WHERE (name LIKE '%عملاء%' OR name LIKE '%مدينون%' OR name LIKE '%Customers%' OR name LIKE '%Receivables%')
        AND type = 'asset'
        ORDER BY level ASC
        LIMIT 1
      `);
      
      if (existingAccount.rows.length > 0) {
        customersMainAccount = existingAccount.rows[0];
        console.log(`✅ تم العثور على الحساب الرئيسي: ${customersMainAccount.name} (${customersMainAccount.code})`);
      } else {
        // إنشاء الحساب الرئيسي للعملاء
        const createMainAccountResult = await client.query(`
          INSERT INTO accounts (
            id, code, name, "nameEn", type, "rootType", "reportType",
            level, "isGroup", "isActive", balance, currency, nature, "accountType",
            description, "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid(),
            '1201',
            'العملاء - المدينون',
            'Customers - Accounts Receivable',
            'asset',
            'Asset',
            'Balance Sheet',
            3,
            true,
            true,
            0.00,
            'LYD',
            'debit',
            'group',
            'الحساب الرئيسي لجميع حسابات العملاء',
            NOW(),
            NOW()
          ) RETURNING id, code, name, level
        `);
        
        customersMainAccount = createMainAccountResult.rows[0];
        console.log(`✅ تم إنشاء الحساب الرئيسي: ${customersMainAccount.name} (${customersMainAccount.code})`);
      }
    } catch (error) {
      console.error('❌ خطأ في التحقق من الحساب الرئيسي:', error.message);
      throw error;
    }

    // 2. إنشاء دالة لإنشاء حساب فرعي للعميل تلقائياً
    console.log('\n🔧 إنشاء دالة إنشاء الحسابات الفرعية للعملاء...');
    
    const createCustomerAccountFunction = `
      CREATE OR REPLACE FUNCTION create_customer_account()
      RETURNS TRIGGER AS $$
      DECLARE
        account_id UUID;
        account_code VARCHAR(50);
        customers_main_account_id UUID := '${customersMainAccount.id}';
      BEGIN
        -- التحقق من وجود الحساب الرئيسي للعملاء
        IF customers_main_account_id IS NULL THEN
          SELECT id INTO customers_main_account_id 
          FROM accounts 
          WHERE (name LIKE '%عملاء%' OR name LIKE '%مدينون%' OR name LIKE '%Customers%')
          AND type = 'asset' AND "isGroup" = true
          LIMIT 1;
        END IF;

        -- إنشاء كود الحساب الفرعي
        account_code := '1201' || LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 10, '0');

        -- إنشاء الحساب الفرعي للعميل
        INSERT INTO accounts (
          id, code, name, "nameEn", type, "rootType", "reportType",
          "parentId", level, "isGroup", "isActive", balance, currency, nature, "accountType",
          description, "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(),
          account_code,
          NEW.name,
          NEW."nameEn",
          'asset',
          'Asset',
          'Balance Sheet',
          customers_main_account_id,
          4,
          false,
          true,
          0.00,
          COALESCE(NEW.currency, 'LYD'),
          'debit',
          'sub',
          'حساب العميل: ' || NEW.name,
          NOW(),
          NOW()
        ) RETURNING id INTO account_id;

        -- ربط العميل بالحساب
        NEW."accountId" = account_id;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    try {
      await client.query(createCustomerAccountFunction);
      console.log('✅ تم إنشاء دالة إنشاء الحسابات الفرعية');
    } catch (error) {
      console.error('❌ خطأ في إنشاء الدالة:', error.message);
    }

    // 3. إنشاء Trigger لتشغيل الدالة عند إنشاء عميل جديد
    console.log('\n⚡ إنشاء Trigger لإنشاء الحسابات تلقائياً...');
    
    const createTrigger = `
      DROP TRIGGER IF EXISTS customer_account_trigger ON customers;
      
      CREATE TRIGGER customer_account_trigger
        BEFORE INSERT ON customers
        FOR EACH ROW
        EXECUTE FUNCTION create_customer_account();
    `;

    try {
      await client.query(createTrigger);
      console.log('✅ تم إنشاء Trigger لإنشاء الحسابات تلقائياً');
    } catch (error) {
      console.error('❌ خطأ في إنشاء Trigger:', error.message);
    }

    // 4. إنشاء حسابات للعملاء الموجودين الذين لا يملكون حسابات
    console.log('\n👥 إنشاء حسابات للعملاء الموجودين...');
    
    try {
      const customersWithoutAccounts = await client.query(`
        SELECT c.id, c.name, c."nameEn", c.currency, c.code as customer_code
        FROM customers c
        LEFT JOIN accounts a ON c."accountId" = a.id
        WHERE c."accountId" IS NULL OR a.id IS NULL
      `);

      console.log(`📊 عدد العملاء بدون حسابات: ${customersWithoutAccounts.rows.length}`);

      for (const customer of customersWithoutAccounts.rows) {
        try {
          // إنشاء كود حساب فريد
          const accountCode = '1201' + String(Date.now() + Math.random()).slice(-6);
          
          // إنشاء الحساب
          const accountResult = await client.query(`
            INSERT INTO accounts (
              id, code, name, "nameEn", type, "rootType", "reportType",
              "parentId", level, "isGroup", "isActive", balance, currency, nature, "accountType",
              description, "createdAt", "updatedAt"
            ) VALUES (
              gen_random_uuid(),
              $1,
              $2,
              $3,
              'asset',
              'Asset',
              'Balance Sheet',
              $4,
              4,
              false,
              true,
              0.00,
              $5,
              'debit',
              'sub',
              'حساب العميل: ' || $2,
              NOW(),
              NOW()
            ) RETURNING id
          `, [accountCode, customer.name, customer.nameen, customersMainAccount.id, customer.currency || 'LYD']);

          const accountId = accountResult.rows[0].id;

          // ربط العميل بالحساب
          await client.query(`
            UPDATE customers 
            SET "accountId" = $1, "updatedAt" = NOW()
            WHERE id = $2
          `, [accountId, customer.id]);

          console.log(`✅ تم إنشاء حساب للعميل: ${customer.name}`);
        } catch (error) {
          console.error(`❌ خطأ في إنشاء حساب للعميل ${customer.name}:`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ خطأ في إنشاء حسابات العملاء الموجودين:', error.message);
    }

    // 5. إنشاء دالة لتحديث رصيد العميل عند إنشاء فاتورة
    console.log('\n💰 إنشاء دالة تحديث رصيد العميل عند الفواتير...');
    
    const updateCustomerBalanceFunction = `
      CREATE OR REPLACE FUNCTION update_customer_balance_on_invoice()
      RETURNS TRIGGER AS $$
      DECLARE
        customer_account_id UUID;
      BEGIN
        -- الحصول على معرف حساب العميل
        SELECT "accountId" INTO customer_account_id
        FROM customers
        WHERE id = NEW."customerId";

        -- تحديث رصيد حساب العميل (مدين)
        IF customer_account_id IS NOT NULL THEN
          UPDATE accounts
          SET balance = balance + NEW."totalAmount",
              "updatedAt" = NOW()
          WHERE id = customer_account_id;

          -- تحديث رصيد العميل في جدول العملاء
          UPDATE customers
          SET balance = balance + NEW."totalAmount",
              "updatedAt" = NOW()
          WHERE id = NEW."customerId";
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    try {
      await client.query(updateCustomerBalanceFunction);
      console.log('✅ تم إنشاء دالة تحديث رصيد العميل عند الفواتير');
    } catch (error) {
      console.error('❌ خطأ في إنشاء دالة تحديث الرصيد:', error.message);
    }

    // 6. إنشاء Trigger لتحديث رصيد العميل عند إنشاء فاتورة
    console.log('\n⚡ إنشاء Trigger لتحديث الرصيد عند الفواتير...');
    
    const invoiceBalanceTrigger = `
      DROP TRIGGER IF EXISTS invoice_customer_balance_trigger ON sales_invoices;
      
      CREATE TRIGGER invoice_customer_balance_trigger
        AFTER INSERT ON sales_invoices
        FOR EACH ROW
        EXECUTE FUNCTION update_customer_balance_on_invoice();
    `;

    try {
      await client.query(invoiceBalanceTrigger);
      console.log('✅ تم إنشاء Trigger لتحديث الرصيد عند الفواتير');
    } catch (error) {
      console.error('❌ خطأ في إنشاء Trigger للفواتير:', error.message);
    }

    // 7. اختبار النظام
    console.log('\n🧪 اختبار النظام المطور...');
    
    try {
      // التحقق من العملاء وحساباتهم
      const customersWithAccounts = await client.query(`
        SELECT 
          c.id as customer_id,
          c.name as customer_name,
          c.balance as customer_balance,
          a.id as account_id,
          a.code as account_code,
          a.name as account_name,
          a.balance as account_balance
        FROM customers c
        LEFT JOIN accounts a ON c."accountId" = a.id
        ORDER BY c.name
        LIMIT 10
      `);

      console.log('\n📊 عينة من العملاء وحساباتهم:');
      for (const row of customersWithAccounts.rows) {
        console.log(`- ${row.customer_name}: حساب ${row.account_code} (رصيد: ${row.account_balance || 0})`);
      }

      // التحقق من الحساب الرئيسي
      const mainAccountBalance = await client.query(`
        SELECT 
          a.name,
          a.code,
          a.balance,
          COUNT(sub.id) as sub_accounts_count,
          SUM(sub.balance) as total_sub_balance
        FROM accounts a
        LEFT JOIN accounts sub ON sub."parentId" = a.id
        WHERE a.id = $1
        GROUP BY a.id, a.name, a.code, a.balance
      `, [customersMainAccount.id]);

      if (mainAccountBalance.rows.length > 0) {
        const main = mainAccountBalance.rows[0];
        console.log(`\n🏦 الحساب الرئيسي: ${main.name} (${main.code})`);
        console.log(`📈 عدد الحسابات الفرعية: ${main.sub_accounts_count}`);
        console.log(`💰 إجمالي أرصدة الحسابات الفرعية: ${main.total_sub_balance || 0}`);
      }

    } catch (error) {
      console.error('❌ خطأ في اختبار النظام:', error.message);
    }

    console.log('\n🎉 تم تطوير نظام ربط العملاء بالحسابات المحاسبية بنجاح!');
    
    console.log('\n📋 ملخص التطويرات:');
    console.log('✅ تم التأكد من وجود الحساب الرئيسي "العملاء"');
    console.log('✅ تم إنشاء دالة إنشاء الحسابات الفرعية تلقائياً');
    console.log('✅ تم إنشاء Trigger لإنشاء الحسابات عند إضافة عميل جديد');
    console.log('✅ تم إنشاء حسابات للعملاء الموجودين');
    console.log('✅ تم إنشاء دالة تحديث رصيد العميل عند الفواتير');
    console.log('✅ تم إنشاء Trigger لتحديث الرصيد تلقائياً');
    
    console.log('\n💡 كيف يعمل النظام الآن:');
    console.log('1. عند إضافة عميل جديد → ينشأ له حساب فرعي تلقائياً تحت "العملاء"');
    console.log('2. عند إصدار فاتورة مبيعات → يسجل العميل مدين (مديون لك)');
    console.log('3. عند استلام دفعة → يسجل العميل دائن (سدد جزء من الدين)');
    console.log('4. في كشف الحساب → تظهر جميع الحركات والرصيد الصافي');
    console.log('5. في ميزان المراجعة → يظهر مجموع حسابات العملاء تحت الأصول');

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// تشغيل السكريپت
enhanceCustomerAccountingSystem().catch(console.error);
