import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

async function auditAccountingRoutes() {
  try {
    await sequelize.authenticate();
    console.log('✅ متصل بقاعدة البيانات\n');

    console.log('🔍 تدقيق شامل لجداول المحاسبة\n');
    console.log('='.repeat(80));

    // الجداول المستخدمة في routes المحاسبة
    const accountingTables = [
      'accounts',
      'gl_journals',
      'posting_journal_entries',
      'journal_entries',
      'journal_entry_details',
      'account_mappings'
    ];

    for (const tableName of accountingTables) {
      console.log(`\n📋 جدول: ${tableName}`);
      console.log('-'.repeat(80));
      
      try {
        // Check if table exists
        const [exists] = await sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${tableName}'
          );
        `);
        
        if (!exists[0].exists) {
          console.log('   ❌ الجدول غير موجود!');
          continue;
        }

        // Get columns
        const [columns] = await sequelize.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = '${tableName}'
          ORDER BY ordinal_position
        `);

        console.log(`   ✅ الجدول موجود (${columns.length} عمود)`);
        
        // Check for common problematic columns
        const columnNames = columns.map(c => c.column_name);
        const problematicPatterns = [
          { snake: 'account_id', camel: 'accountId' },
          { snake: 'customer_id', camel: 'customerId' },
          { snake: 'supplier_id', camel: 'supplierId' },
          { snake: 'user_id', camel: 'userId' },
          { snake: 'created_by', camel: 'createdBy' },
          { snake: 'updated_by', camel: 'updatedBy' },
          { snake: 'is_active', camel: 'isActive' },
          { snake: 'journal_id', camel: 'journalId' },
          { snake: 'debit_amount', camel: 'debitAmount' },
          { snake: 'credit_amount', camel: 'creditAmount' }
        ];

        console.log('   🔍 فحص أسماء الأعمدة الحساسة:');
        
        for (const pattern of problematicPatterns) {
          const hasSnake = columnNames.includes(pattern.snake);
          const hasCamel = columnNames.includes(pattern.camel);
          
          if (hasSnake && hasCamel) {
            console.log(`      ⚠️  ${pattern.snake} و ${pattern.camel} موجودان معاً!`);
          } else if (hasSnake) {
            console.log(`      📌 ${pattern.snake} (snake_case)`);
          } else if (hasCamel) {
            console.log(`      📌 ${pattern.camel} (camelCase)`);
          }
        }

        // Get row count
        const [count] = await sequelize.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        console.log(`   📊 عدد الصفوف: ${count[0].count}`);

      } catch (err) {
        console.log(`   ❌ خطأ: ${err.message}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n🧪 اختبار استعلامات المحاسبة الحرجة:\n');

    // Test 1: GL Journals query
    console.log('1️⃣ اختبار استعلام GL Journals:');
    try {
      const [result] = await sequelize.query(`
        SELECT 
          j.id,
          j.journal_no,
          j.journal_date,
          j.description,
          e.account_id,
          a.name as account_name,
          e.debit_amount,
          e.credit_amount
        FROM gl_journals j
        LEFT JOIN posting_journal_entries e ON j.id = e.journal_id
        LEFT JOIN accounts a ON e.account_id = a.id
        LIMIT 1
      `);
      console.log('   ✅ الاستعلام نجح (snake_case)');
    } catch (err) {
      console.log('   ❌ فشل:', err.message);
      
      // Try with camelCase
      try {
        const [result2] = await sequelize.query(`
          SELECT 
            j.id,
            j."journalNo",
            j."journalDate",
            j.description,
            e."accountId",
            a.name as account_name,
            e."debitAmount",
            e."creditAmount"
          FROM gl_journals j
          LEFT JOIN posting_journal_entries e ON j.id = e."journalId"
          LEFT JOIN accounts a ON e."accountId" = a.id
          LIMIT 1
        `);
        console.log('   ✅ الاستعلام نجح (camelCase)');
      } catch (err2) {
        console.log('   ❌ فشل أيضاً:', err2.message);
      }
    }

    // Test 2: Accounts query
    console.log('\n2️⃣ اختبار استعلام Accounts:');
    try {
      const [result] = await sequelize.query(`
        SELECT id, code, name, "accountType", "isActive"
        FROM accounts
        WHERE "isActive" = true
        LIMIT 5
      `);
      console.log('   ✅ الاستعلام نجح');
      console.log(`   📊 وجد ${result.length} حسابات نشطة`);
    } catch (err) {
      console.log('   ❌ فشل:', err.message);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ اكتمل التدقيق\n');

    await sequelize.close();
  } catch (err) {
    console.error('❌ خطأ:', err.message);
    await sequelize.close();
    process.exit(1);
  }
}

auditAccountingRoutes();
