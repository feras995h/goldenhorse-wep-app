import pkg from 'pg';
const { Client } = pkg;

// قاعدة البيانات المنشورة
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

async function phase1PostingEngine() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    console.log('\n🚀 المرحلة 1: إنشاء محرك الترحيل...\n');

    // 1. إنشاء جدول قواعد الترحيل
    console.log('📋 إنشاء جدول قواعد الترحيل...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS posting_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_type VARCHAR(50) NOT NULL,
        rule_name VARCHAR(100) NOT NULL,
        debit_account_type VARCHAR(50),
        debit_account_id UUID REFERENCES accounts(id),
        credit_account_type VARCHAR(50),
        credit_account_id UUID REFERENCES accounts(id),
        amount_field VARCHAR(50) NOT NULL DEFAULT 'totalAmount',
        condition_field VARCHAR(50),
        condition_value VARCHAR(100),
        priority INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        description TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        UNIQUE(document_type, rule_name)
      )
    `);

    console.log('✅ تم إنشاء جدول posting_rules');

    // 2. إنشاء جدول اليومية العامة
    console.log('📊 إنشاء جدول اليومية العامة...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS gl_journals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        journal_no VARCHAR(50) NOT NULL UNIQUE,
        journal_date DATE NOT NULL,
        description TEXT NOT NULL,
        document_type VARCHAR(50) NOT NULL,
        document_id UUID NOT NULL,
        document_no VARCHAR(50),
        total_debit DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        total_credit DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'posted',
        fiscal_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
        posted_by UUID,
        posted_at TIMESTAMP DEFAULT NOW(),
        reversed_by UUID,
        reversed_at TIMESTAMP,
        reversal_reason TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ تم إنشاء جدول gl_journals');

    // 3. إنشاء جدول تفاصيل القيود
    console.log('📝 إنشاء جدول تفاصيل القيود...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS gl_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        journal_id UUID NOT NULL REFERENCES gl_journals(id) ON DELETE CASCADE,
        account_id UUID NOT NULL REFERENCES accounts(id),
        debit_amount DECIMAL(15,2) DEFAULT 0.00,
        credit_amount DECIMAL(15,2) DEFAULT 0.00,
        description TEXT,
        line_number INTEGER NOT NULL,
        currency VARCHAR(3) DEFAULT 'LYD',
        exchange_rate DECIMAL(10,6) DEFAULT 1.000000,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ تم إنشاء جدول gl_entries');

    // 4. إنشاء فهارس الأداء
    console.log('🚀 إنشاء فهارس الأداء...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_posting_rules_document_type ON posting_rules(document_type)',
      'CREATE INDEX IF NOT EXISTS idx_posting_rules_active ON posting_rules(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_gl_journals_document ON gl_journals(document_type, document_id)',
      'CREATE INDEX IF NOT EXISTS idx_gl_journals_date ON gl_journals(journal_date)',
      'CREATE INDEX IF NOT EXISTS idx_gl_journals_status ON gl_journals(status)',
      'CREATE INDEX IF NOT EXISTS idx_gl_entries_journal ON gl_entries(journal_id)',
      'CREATE INDEX IF NOT EXISTS idx_gl_entries_account ON gl_entries(account_id)',
      'CREATE INDEX IF NOT EXISTS idx_gl_entries_amounts ON gl_entries(debit_amount, credit_amount)'
    ];

    for (const indexQuery of indexes) {
      try {
        await client.query(indexQuery);
        console.log(`✅ فهرس تم إنشاؤه`);
      } catch (error) {
        console.log(`⚠️ فهرس موجود مسبقاً`);
      }
    }

    // 5. إدراج قواعد الترحيل الأساسية
    console.log('\n⚙️ إدراج قواعد الترحيل الأساسية...');
    
    // البحث عن الحسابات المطلوبة
    const accounts = await client.query(`
      SELECT 
        id,
        code,
        name,
        type
      FROM accounts 
      WHERE code IN ('1.1.1.001', '1.1.2', '4.1.1', '2.1.3.002')
      OR name IN ('الصندوق الرئيسي', 'العملاء والمدينون', 'إيرادات المبيعات', 'ضريبة القيمة المضافة')
    `);

    const accountMap = {};
    for (const account of accounts.rows) {
      if (account.code === '1.1.1.001' || account.name === 'الصندوق الرئيسي') {
        accountMap.cash = account.id;
      } else if (account.code === '1.1.2' || account.name === 'العملاء والمدينون') {
        accountMap.customers = account.id;
      } else if (account.code === '4.1.1' || account.name === 'إيرادات المبيعات') {
        accountMap.sales = account.id;
      } else if (account.code === '2.1.3.002' || account.name === 'ضريبة القيمة المضافة') {
        accountMap.vat = account.id;
      }
    }

    console.log('📊 الحسابات المتاحة:', Object.keys(accountMap));

    // قواعد فاتورة المبيعات
    const salesInvoiceRules = [
      {
        document_type: 'sales_invoice',
        rule_name: 'customer_receivable',
        debit_account_id: accountMap.customers,
        credit_account_id: null,
        amount_field: 'totalAmount',
        description: 'مدين العملاء بقيمة الفاتورة'
      },
      {
        document_type: 'sales_invoice',
        rule_name: 'sales_revenue',
        debit_account_id: null,
        credit_account_id: accountMap.sales,
        amount_field: 'subtotal',
        description: 'دائن إيرادات المبيعات'
      }
    ];

    // قواعد إيصال القبض
    const receiptRules = [
      {
        document_type: 'receipt',
        rule_name: 'cash_debit',
        debit_account_id: accountMap.cash,
        credit_account_id: null,
        amount_field: 'amount',
        description: 'مدين الصندوق بقيمة الإيصال'
      },
      {
        document_type: 'receipt',
        rule_name: 'customer_credit',
        debit_account_id: null,
        credit_account_id: accountMap.customers,
        amount_field: 'amount',
        description: 'دائن العملاء بقيمة الإيصال'
      }
    ];

    const allRules = [...salesInvoiceRules, ...receiptRules];

    for (const rule of allRules) {
      try {
        await client.query(`
          INSERT INTO posting_rules (
            document_type, rule_name, debit_account_id, credit_account_id,
            amount_field, description
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (document_type, rule_name) DO UPDATE SET
            debit_account_id = EXCLUDED.debit_account_id,
            credit_account_id = EXCLUDED.credit_account_id,
            amount_field = EXCLUDED.amount_field,
            description = EXCLUDED.description,
            "updatedAt" = NOW()
        `, [
          rule.document_type,
          rule.rule_name,
          rule.debit_account_id,
          rule.credit_account_id,
          rule.amount_field,
          rule.description
        ]);

        console.log(`✅ قاعدة ${rule.rule_name} لـ ${rule.document_type}`);
      } catch (error) {
        console.error(`❌ خطأ في إدراج قاعدة ${rule.rule_name}:`, error.message);
      }
    }

    // 6. إنشاء دالة الترحيل الرئيسية
    console.log('\n⚙️ إنشاء دالة الترحيل الرئيسية...');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION post_document(
        doc_type VARCHAR,
        doc_id UUID,
        user_id UUID
      ) RETURNS UUID AS $$
      DECLARE
        journal_id UUID;
        journal_no VARCHAR;
        doc_record RECORD;
        rule_record RECORD;
        entry_line INTEGER := 1;
        total_debit DECIMAL := 0;
        total_credit DECIMAL := 0;
        amount_value DECIMAL;
      BEGIN
        -- التحقق من عدم وجود ترحيل سابق
        SELECT id INTO journal_id FROM gl_journals 
        WHERE document_type = doc_type AND document_id = doc_id;
        
        IF journal_id IS NOT NULL THEN
          RAISE EXCEPTION 'Document already posted with journal ID: %', journal_id;
        END IF;
        
        -- الحصول على بيانات المستند
        IF doc_type = 'sales_invoice' THEN
          SELECT * INTO doc_record FROM sales_invoices WHERE id = doc_id;
          IF NOT FOUND THEN
            RAISE EXCEPTION 'Sales invoice not found: %', doc_id;
          END IF;
        ELSIF doc_type = 'receipt' THEN
          SELECT * INTO doc_record FROM receipts WHERE id = doc_id;
          IF NOT FOUND THEN
            RAISE EXCEPTION 'Receipt not found: %', doc_id;
          END IF;
        ELSE
          RAISE EXCEPTION 'Unsupported document type: %', doc_type;
        END IF;
        
        -- توليد رقم اليومية
        journal_no := 'GL-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || 
                     LPAD(NEXTVAL('gl_journal_seq')::TEXT, 6, '0');
        
        -- إنشاء اليومية
        INSERT INTO gl_journals (
          journal_no, journal_date, description, document_type, document_id,
          document_no, posted_by, fiscal_year
        ) VALUES (
          journal_no,
          COALESCE(doc_record.date, doc_record."receiptDate", CURRENT_DATE),
          'Auto posting for ' || doc_type || ' ' || COALESCE(doc_record.document_no, doc_id::TEXT),
          doc_type,
          doc_id,
          doc_record.document_no,
          user_id,
          EXTRACT(YEAR FROM COALESCE(doc_record.date, doc_record."receiptDate", CURRENT_DATE))
        ) RETURNING id INTO journal_id;
        
        -- تطبيق قواعد الترحيل
        FOR rule_record IN 
          SELECT * FROM posting_rules 
          WHERE document_type = doc_type AND is_active = true
          ORDER BY priority
        LOOP
          -- حساب المبلغ
          EXECUTE format('SELECT ($1).%I', rule_record.amount_field) 
          INTO amount_value USING doc_record;
          
          -- إدراج القيد المدين
          IF rule_record.debit_account_id IS NOT NULL THEN
            INSERT INTO gl_entries (
              journal_id, account_id, debit_amount, description, line_number
            ) VALUES (
              journal_id, rule_record.debit_account_id, amount_value,
              rule_record.description, entry_line
            );
            total_debit := total_debit + amount_value;
            entry_line := entry_line + 1;
          END IF;
          
          -- إدراج القيد الدائن
          IF rule_record.credit_account_id IS NOT NULL THEN
            INSERT INTO gl_entries (
              journal_id, account_id, credit_amount, description, line_number
            ) VALUES (
              journal_id, rule_record.credit_account_id, amount_value,
              rule_record.description, entry_line
            );
            total_credit := total_credit + amount_value;
            entry_line := entry_line + 1;
          END IF;
        END LOOP;
        
        -- تحديث إجماليات اليومية
        UPDATE gl_journals 
        SET total_debit = total_debit, total_credit = total_credit
        WHERE id = journal_id;
        
        -- التحقق من التوازن
        IF total_debit != total_credit THEN
          RAISE EXCEPTION 'Journal entry not balanced: Debit=% Credit=%', total_debit, total_credit;
        END IF;
        
        -- تحديث حالة المستند
        IF doc_type = 'sales_invoice' THEN
          UPDATE sales_invoices 
          SET posted_status = 'posted', posted_at = NOW(), posted_by = user_id
          WHERE id = doc_id;
        ELSIF doc_type = 'receipt' THEN
          UPDATE receipts 
          SET posted_status = 'posted', posted_at = NOW(), posted_by = user_id
          WHERE id = doc_id;
        END IF;
        
        RETURN journal_id;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ تم إنشاء دالة post_document');

    // 7. إنشاء sequence لأرقام اليومية
    console.log('🔢 إنشاء sequence لأرقام اليومية...');
    
    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS gl_journal_seq START 1;
    `);

    console.log('✅ تم إنشاء gl_journal_seq');

    // 8. إنشاء دالة الإلغاء
    console.log('⚙️ إنشاء دالة إلغاء الترحيل...');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION reverse_document(
        doc_type VARCHAR,
        doc_id UUID,
        user_id UUID,
        reason TEXT DEFAULT 'Manual reversal'
      ) RETURNS UUID AS $$
      DECLARE
        original_journal_id UUID;
        reversal_journal_id UUID;
        reversal_journal_no VARCHAR;
        entry_record RECORD;
        line_num INTEGER := 1;
      BEGIN
        -- البحث عن اليومية الأصلية
        SELECT id INTO original_journal_id FROM gl_journals 
        WHERE document_type = doc_type AND document_id = doc_id AND status = 'posted';
        
        IF original_journal_id IS NULL THEN
          RAISE EXCEPTION 'No posted journal found for document: % %', doc_type, doc_id;
        END IF;
        
        -- توليد رقم اليومية العكسية
        reversal_journal_no := 'REV-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || 
                              LPAD(NEXTVAL('gl_journal_seq')::TEXT, 6, '0');
        
        -- إنشاء اليومية العكسية
        INSERT INTO gl_journals (
          journal_no, journal_date, description, document_type, document_id,
          document_no, posted_by, fiscal_year, status
        ) 
        SELECT 
          reversal_journal_no,
          CURRENT_DATE,
          'Reversal of ' || description,
          document_type,
          document_id,
          document_no,
          user_id,
          EXTRACT(YEAR FROM CURRENT_DATE),
          'posted'
        FROM gl_journals WHERE id = original_journal_id
        RETURNING id INTO reversal_journal_id;
        
        -- إنشاء القيود العكسية
        FOR entry_record IN 
          SELECT * FROM gl_entries WHERE journal_id = original_journal_id
        LOOP
          INSERT INTO gl_entries (
            journal_id, account_id, debit_amount, credit_amount, 
            description, line_number
          ) VALUES (
            reversal_journal_id,
            entry_record.account_id,
            entry_record.credit_amount, -- عكس المبالغ
            entry_record.debit_amount,
            'Reversal: ' || entry_record.description,
            line_num
          );
          line_num := line_num + 1;
        END LOOP;
        
        -- تحديث إجماليات اليومية العكسية
        UPDATE gl_journals 
        SET 
          total_debit = (SELECT COALESCE(SUM(debit_amount), 0) FROM gl_entries WHERE journal_id = reversal_journal_id),
          total_credit = (SELECT COALESCE(SUM(credit_amount), 0) FROM gl_entries WHERE journal_id = reversal_journal_id)
        WHERE id = reversal_journal_id;
        
        -- تحديث اليومية الأصلية
        UPDATE gl_journals 
        SET status = 'reversed', reversed_by = user_id, reversed_at = NOW(), reversal_reason = reason
        WHERE id = original_journal_id;
        
        -- تحديث حالة المستند
        IF doc_type = 'sales_invoice' THEN
          UPDATE sales_invoices 
          SET posted_status = 'reversed', can_edit = true
          WHERE id = doc_id;
        ELSIF doc_type = 'receipt' THEN
          UPDATE receipts 
          SET posted_status = 'reversed', can_edit = true
          WHERE id = doc_id;
        END IF;
        
        RETURN reversal_journal_id;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ تم إنشاء دالة reverse_document');

    // 9. التحقق النهائي
    console.log('\n🧪 التحقق النهائي من محرك الترحيل...');
    
    const finalCheck = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM posting_rules WHERE is_active = true) as active_rules,
        (SELECT COUNT(*) FROM gl_journals) as journals_count,
        (SELECT COUNT(*) FROM gl_entries) as entries_count,
        (SELECT COUNT(*) FROM document_sequences) as sequences_count
    `);

    const stats = finalCheck.rows[0];
    console.log('📊 إحصائيات محرك الترحيل:');
    console.log(`- قواعد الترحيل النشطة: ${stats.active_rules}`);
    console.log(`- عدد اليوميات: ${stats.journals_count}`);
    console.log(`- عدد القيود: ${stats.entries_count}`);
    console.log(`- تسلسلات المستندات: ${stats.sequences_count}`);

    console.log('\n🎉 تم إكمال المرحلة 1 بنجاح!');
    
    console.log('\n📋 ملخص المرحلة 1:');
    console.log('✅ تم إنشاء جداول محرك الترحيل (posting_rules, gl_journals, gl_entries)');
    console.log('✅ تم إنشاء فهارس الأداء');
    console.log('✅ تم إدراج قواعد الترحيل الأساسية');
    console.log('✅ تم إنشاء دالة الترحيل post_document');
    console.log('✅ تم إنشاء دالة الإلغاء reverse_document');
    console.log('✅ تم إنشاء sequence لأرقام اليومية');
    
    console.log('\n💡 الخطوة التالية:');
    console.log('- إنشاء APIs للترحيل والإلغاء');
    console.log('- اختبار الترحيل على مستندات تجريبية');
    console.log('- البدء في المرحلة 2: AR Matching & Aging');

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// تشغيل السكريپت
phase1PostingEngine().catch(console.error);
