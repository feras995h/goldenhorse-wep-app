import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function createTestReceivablesData() {
  try {
    await sequelize.authenticate();
    console.log('✅ متصل بقاعدة البيانات');

    // Get receivable accounts
    const [receivableAccounts] = await sequelize.query(`
      SELECT id, code, name FROM accounts 
      WHERE (
        name LIKE '%مدين%' OR 
        name LIKE '%عميل%' OR 
        name LIKE '%receivable%' OR 
        name LIKE '%عملاء%' OR
        code LIKE 'AR-%'
      ) AND "isActive" = true
      LIMIT 3
    `);

    console.log(`📊 تم العثور على ${receivableAccounts.length} حساب مدين`);
    receivableAccounts.forEach(acc => {
      console.log(`   ${acc.code}: ${acc.name}`);
    });

    if (receivableAccounts.length === 0) {
      console.log('❌ لا توجد حسابات مدينة');
      return;
    }

    // Create test GL entries for today
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    console.log(`\n📝 إنشاء قيود تجريبية لتاريخ: ${todayStr}`);

    for (let i = 0; i < receivableAccounts.length; i++) {
      const account = receivableAccounts[i];
      const amount = (i + 1) * 500; // 500, 1000, 1500

      // Create GL entry
      const [result] = await sequelize.query(`
        INSERT INTO gl_entries (
          id, "accountId", "postingDate", description, "voucherType",
          debit, credit, "isCancelled", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), :accountId, :postingDate, :description, :voucherType,
          :debit, 0, false, NOW(), NOW()
        ) RETURNING id, description, debit
      `, {
        replacements: {
          accountId: account.id,
          postingDate: todayStr,
          description: `فاتورة مبيعات تجريبية ${i + 1} - ${todayStr}`,
          voucherType: 'Sales Invoice',
          debit: amount
        }
      });

      console.log(`   ✅ تم إنشاء قيد: ${result[0].description} - ${result[0].debit} د.ل`);
    }

    console.log('\n🧪 اختبار endpoint المدينون...');
    
    // Test the endpoint
    const response = await fetch('http://localhost:5001/api/financial/receivables-details?period=today&limit=10');
    const data = await response.json();
    
    console.log('📊 نتائج الاختبار:');
    console.log(`   عدد السجلات: ${data.total || 0}`);
    console.log(`   إجمالي المدين: ${data.summary?.totalDebit || 0} د.ل`);
    console.log(`   إجمالي الدائن: ${data.summary?.totalCredit || 0} د.ل`);
    console.log(`   صافي الرصيد: ${data.summary?.netBalance || 0} د.ل`);

    if (data.data && data.data.length > 0) {
      console.log('\n📋 أول سجل:');
      const first = data.data[0];
      console.log(`   التاريخ: ${first.date}`);
      console.log(`   الحساب: ${first.account?.code} - ${first.account?.name}`);
      console.log(`   الوصف: ${first.description}`);
      console.log(`   نوع السند: ${first.voucherType}`);
      console.log(`   مدين: ${first.debit} د.ل`);
    }

    console.log('\n🎉 تم إنشاء البيانات التجريبية بنجاح!');
    console.log('💡 يمكنك الآن اختبار تقرير المدينون في الواجهة الأمامية');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await sequelize.close();
  }
}

createTestReceivablesData();
