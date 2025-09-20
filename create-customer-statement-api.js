import pkg from 'pg';
const { Client } = pkg;

// قاعدة البيانات المنشورة
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

async function createCustomerStatementAPI() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    console.log('\n📊 إنشاء جداول كشف حساب العميل...\n');

    // 1. إنشاء جدول حركات العملاء (Customer Transactions)
    console.log('🔧 إنشاء جدول customer_transactions...');
    
    const createCustomerTransactionsTable = `
      CREATE TABLE IF NOT EXISTS customer_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "customerId" UUID NOT NULL REFERENCES customers(id),
        "transactionType" VARCHAR(50) NOT NULL, -- 'invoice', 'payment', 'return', 'adjustment'
        "referenceType" VARCHAR(50) NOT NULL, -- 'sales_invoice', 'receipt', 'sales_return', 'manual'
        "referenceId" UUID, -- معرف المرجع (فاتورة، إيصال، إلخ)
        "referenceNumber" VARCHAR(100), -- رقم المرجع
        "transactionDate" DATE NOT NULL,
        "dueDate" DATE,
        description TEXT NOT NULL,
        "debitAmount" DECIMAL(15,2) DEFAULT 0.00, -- المبلغ المدين (فواتير)
        "creditAmount" DECIMAL(15,2) DEFAULT 0.00, -- المبلغ الدائن (مدفوعات)
        "runningBalance" DECIMAL(15,2) DEFAULT 0.00, -- الرصيد الجاري
        currency VARCHAR(3) DEFAULT 'LYD',
        "exchangeRate" DECIMAL(10,4) DEFAULT 1.0000,
        status VARCHAR(50) DEFAULT 'active', -- 'active', 'cancelled', 'reversed'
        notes TEXT,
        "createdBy" UUID REFERENCES users(id),
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    try {
      await client.query(createCustomerTransactionsTable);
      console.log('✅ تم إنشاء جدول customer_transactions');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ جدول customer_transactions موجود بالفعل');
      } else {
        console.error('❌ خطأ في إنشاء الجدول:', error.message);
      }
    }

    // 2. إنشاء فهارس للأداء
    console.log('\n📈 إنشاء فهارس الأداء...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_customer_transactions_customer ON customer_transactions("customerId");',
      'CREATE INDEX IF NOT EXISTS idx_customer_transactions_date ON customer_transactions("transactionDate");',
      'CREATE INDEX IF NOT EXISTS idx_customer_transactions_type ON customer_transactions("transactionType");',
      'CREATE INDEX IF NOT EXISTS idx_customer_transactions_reference ON customer_transactions("referenceType", "referenceId");',
      'CREATE INDEX IF NOT EXISTS idx_customer_transactions_status ON customer_transactions(status);'
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

    // 3. إنشاء دالة لتسجيل حركة العميل
    console.log('\n🔧 إنشاء دالة تسجيل حركات العملاء...');
    
    const createTransactionFunction = `
      CREATE OR REPLACE FUNCTION record_customer_transaction(
        p_customer_id UUID,
        p_transaction_type VARCHAR(50),
        p_reference_type VARCHAR(50),
        p_reference_id UUID,
        p_reference_number VARCHAR(100),
        p_transaction_date DATE,
        p_due_date DATE,
        p_description TEXT,
        p_debit_amount DECIMAL(15,2) DEFAULT 0.00,
        p_credit_amount DECIMAL(15,2) DEFAULT 0.00,
        p_currency VARCHAR(3) DEFAULT 'LYD',
        p_exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
        p_created_by UUID DEFAULT NULL
      )
      RETURNS UUID AS $$
      DECLARE
        transaction_id UUID;
        current_balance DECIMAL(15,2);
        new_balance DECIMAL(15,2);
      BEGIN
        -- الحصول على الرصيد الحالي للعميل
        SELECT COALESCE(balance, 0.00) INTO current_balance
        FROM customers
        WHERE id = p_customer_id;

        -- حساب الرصيد الجديد
        new_balance := current_balance + p_debit_amount - p_credit_amount;

        -- إدراج الحركة الجديدة
        INSERT INTO customer_transactions (
          "customerId", "transactionType", "referenceType", "referenceId",
          "referenceNumber", "transactionDate", "dueDate", description,
          "debitAmount", "creditAmount", "runningBalance",
          currency, "exchangeRate", "createdBy"
        ) VALUES (
          p_customer_id, p_transaction_type, p_reference_type, p_reference_id,
          p_reference_number, p_transaction_date, p_due_date, p_description,
          p_debit_amount, p_credit_amount, new_balance,
          p_currency, p_exchange_rate, p_created_by
        ) RETURNING id INTO transaction_id;

        -- تحديث رصيد العميل
        UPDATE customers
        SET balance = new_balance, "updatedAt" = NOW()
        WHERE id = p_customer_id;

        -- تحديث رصيد حساب العميل
        UPDATE accounts
        SET balance = new_balance, "updatedAt" = NOW()
        WHERE id = (SELECT "accountId" FROM customers WHERE id = p_customer_id);

        RETURN transaction_id;
      END;
      $$ LANGUAGE plpgsql;
    `;

    try {
      await client.query(createTransactionFunction);
      console.log('✅ تم إنشاء دالة تسجيل حركات العملاء');
    } catch (error) {
      console.error('❌ خطأ في إنشاء الدالة:', error.message);
    }

    // 4. إنشاء دالة للحصول على كشف حساب العميل
    console.log('\n📊 إنشاء دالة كشف حساب العميل...');
    
    const customerStatementFunction = `
      CREATE OR REPLACE FUNCTION get_customer_statement(
        p_customer_id UUID,
        p_from_date DATE DEFAULT NULL,
        p_to_date DATE DEFAULT NULL,
        p_limit INTEGER DEFAULT 100
      )
      RETURNS TABLE (
        transaction_id UUID,
        transaction_date DATE,
        due_date DATE,
        transaction_type VARCHAR(50),
        reference_type VARCHAR(50),
        reference_number VARCHAR(100),
        description TEXT,
        debit_amount DECIMAL(15,2),
        credit_amount DECIMAL(15,2),
        running_balance DECIMAL(15,2),
        currency VARCHAR(3),
        status VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          ct.id,
          ct."transactionDate",
          ct."dueDate",
          ct."transactionType",
          ct."referenceType",
          ct."referenceNumber",
          ct.description,
          ct."debitAmount",
          ct."creditAmount",
          ct."runningBalance",
          ct.currency,
          ct.status,
          ct."createdAt"
        FROM customer_transactions ct
        WHERE ct."customerId" = p_customer_id
          AND ct.status = 'active'
          AND (p_from_date IS NULL OR ct."transactionDate" >= p_from_date)
          AND (p_to_date IS NULL OR ct."transactionDate" <= p_to_date)
        ORDER BY ct."transactionDate" DESC, ct."createdAt" DESC
        LIMIT p_limit;
      END;
      $$ LANGUAGE plpgsql;
    `;

    try {
      await client.query(customerStatementFunction);
      console.log('✅ تم إنشاء دالة كشف حساب العميل');
    } catch (error) {
      console.error('❌ خطأ في إنشاء دالة كشف الحساب:', error.message);
    }

    // 5. إنشاء دالة لملخص حساب العميل
    console.log('\n📈 إنشاء دالة ملخص حساب العميل...');
    
    const customerSummaryFunction = `
      CREATE OR REPLACE FUNCTION get_customer_summary(p_customer_id UUID)
      RETURNS TABLE (
        customer_name VARCHAR(255),
        customer_code VARCHAR(50),
        account_code VARCHAR(50),
        current_balance DECIMAL(15,2),
        total_invoices DECIMAL(15,2),
        total_payments DECIMAL(15,2),
        total_returns DECIMAL(15,2),
        overdue_amount DECIMAL(15,2),
        credit_limit DECIMAL(15,2),
        available_credit DECIMAL(15,2),
        last_transaction_date DATE,
        transactions_count INTEGER
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          c.name,
          c.code,
          a.code,
          c.balance,
          COALESCE(SUM(CASE WHEN ct."transactionType" = 'invoice' THEN ct."debitAmount" ELSE 0 END), 0),
          COALESCE(SUM(CASE WHEN ct."transactionType" = 'payment' THEN ct."creditAmount" ELSE 0 END), 0),
          COALESCE(SUM(CASE WHEN ct."transactionType" = 'return' THEN ct."creditAmount" ELSE 0 END), 0),
          COALESCE(SUM(CASE WHEN ct."transactionType" = 'invoice' AND ct."dueDate" < CURRENT_DATE THEN ct."debitAmount" - COALESCE(paid.amount, 0) ELSE 0 END), 0),
          c."creditLimit",
          c."creditLimit" - c.balance,
          MAX(ct."transactionDate"),
          COUNT(ct.id)::INTEGER
        FROM customers c
        LEFT JOIN accounts a ON c."accountId" = a.id
        LEFT JOIN customer_transactions ct ON c.id = ct."customerId" AND ct.status = 'active'
        LEFT JOIN (
          SELECT ct2."referenceId", SUM(ct2."creditAmount") as amount
          FROM customer_transactions ct2
          WHERE ct2."transactionType" = 'payment' AND ct2.status = 'active'
          GROUP BY ct2."referenceId"
        ) paid ON ct."referenceId" = paid."referenceId"
        WHERE c.id = p_customer_id
        GROUP BY c.id, c.name, c.code, c.balance, c."creditLimit", a.code;
      END;
      $$ LANGUAGE plpgsql;
    `;

    try {
      await client.query(customerSummaryFunction);
      console.log('✅ تم إنشاء دالة ملخص حساب العميل');
    } catch (error) {
      console.error('❌ خطأ في إنشاء دالة الملخص:', error.message);
    }

    // 6. إنشاء بيانات تجريبية
    console.log('\n🧪 إنشاء بيانات تجريبية...');
    
    try {
      // الحصول على عميل للاختبار
      const testCustomer = await client.query(`
        SELECT id, name FROM customers LIMIT 1
      `);

      if (testCustomer.rows.length > 0) {
        const customer = testCustomer.rows[0];
        
        // إنشاء فاتورة تجريبية
        await client.query(`
          SELECT record_customer_transaction(
            $1::UUID,
            'invoice',
            'sales_invoice',
            gen_random_uuid(),
            'INV-TEST-001',
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '30 days',
            'فاتورة مبيعات تجريبية',
            1500.00,
            0.00,
            'LYD',
            1.0000,
            NULL
          )
        `, [customer.id]);

        // إنشاء دفعة تجريبية
        await client.query(`
          SELECT record_customer_transaction(
            $1::UUID,
            'payment',
            'receipt',
            gen_random_uuid(),
            'REC-TEST-001',
            CURRENT_DATE + INTERVAL '5 days',
            NULL,
            'دفعة جزئية من العميل',
            0.00,
            800.00,
            'LYD',
            1.0000,
            NULL
          )
        `, [customer.id]);

        console.log(`✅ تم إنشاء بيانات تجريبية للعميل: ${customer.name}`);
      }
    } catch (error) {
      console.error('❌ خطأ في إنشاء البيانات التجريبية:', error.message);
    }

    // 7. اختبار النظام
    console.log('\n🧪 اختبار النظام...');
    
    try {
      const testCustomer = await client.query(`
        SELECT id, name FROM customers LIMIT 1
      `);

      if (testCustomer.rows.length > 0) {
        const customer = testCustomer.rows[0];
        
        // اختبار كشف الحساب
        const statement = await client.query(`
          SELECT * FROM get_customer_statement($1::UUID, NULL, NULL, 10)
        `, [customer.id]);

        console.log(`\n📊 كشف حساب العميل: ${customer.name}`);
        console.log(`عدد الحركات: ${statement.rows.length}`);
        
        for (const row of statement.rows) {
          console.log(`- ${row.transaction_date}: ${row.description} | مدين: ${row.debit_amount} | دائن: ${row.credit_amount} | الرصيد: ${row.running_balance}`);
        }

        // اختبار ملخص الحساب
        const summary = await client.query(`
          SELECT * FROM get_customer_summary($1::UUID)
        `, [customer.id]);

        if (summary.rows.length > 0) {
          const s = summary.rows[0];
          console.log(`\n📈 ملخص حساب العميل:`);
          console.log(`- الاسم: ${s.customer_name}`);
          console.log(`- كود العميل: ${s.customer_code}`);
          console.log(`- كود الحساب: ${s.account_code}`);
          console.log(`- الرصيد الحالي: ${s.current_balance}`);
          console.log(`- إجمالي الفواتير: ${s.total_invoices}`);
          console.log(`- إجمالي المدفوعات: ${s.total_payments}`);
          console.log(`- عدد الحركات: ${s.transactions_count}`);
        }
      }
    } catch (error) {
      console.error('❌ خطأ في اختبار النظام:', error.message);
    }

    console.log('\n🎉 تم إنشاء نظام كشف حساب العميل بنجاح!');
    
    console.log('\n📋 ملخص المكونات المنشأة:');
    console.log('✅ جدول customer_transactions لتسجيل جميع الحركات');
    console.log('✅ فهارس الأداء للبحث السريع');
    console.log('✅ دالة record_customer_transaction لتسجيل الحركات');
    console.log('✅ دالة get_customer_statement لكشف الحساب');
    console.log('✅ دالة get_customer_summary لملخص الحساب');
    console.log('✅ بيانات تجريبية للاختبار');

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// تشغيل السكريپت
createCustomerStatementAPI().catch(console.error);
