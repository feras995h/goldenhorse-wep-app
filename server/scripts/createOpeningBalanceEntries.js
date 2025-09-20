import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function createOpeningBalanceEntries() {
  try {
    await sequelize.authenticate();
    console.log('✅ متصل بقاعدة البيانات');

    // Get some accounts
    const [accounts] = await sequelize.query(`
      SELECT id, code, name, type 
      FROM accounts 
      WHERE "isActive" = true 
      ORDER BY code 
      LIMIT 5
    `);

    console.log(`📋 وجدت ${accounts.length} حساب للأرصدة الافتتاحية`);

    // Create opening balance entries
    const openingEntries = [
      {
        accountId: accounts[0].id,
        debit: 15000,
        credit: 0,
        remarks: 'رصيد افتتاحي - ' + accounts[0].name
      },
      {
        accountId: accounts[1].id,
        debit: 0,
        credit: 5000,
        remarks: 'رصيد افتتاحي - ' + accounts[1].name
      },
      {
        accountId: accounts[2].id,
        debit: 0,
        credit: 10000,
        remarks: 'رصيد افتتاحي - ' + accounts[2].name
      }
    ];

    console.log('\n💾 إنشاء قيود الأرصدة الافتتاحية...');

    for (const entry of openingEntries) {
      await sequelize.query(`
        INSERT INTO gl_entries (
          id, "accountId", debit, credit, "postingDate",
          "voucherType", "voucherNo", remarks, "isCancelled",
          "createdBy", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), :accountId, :debit, :credit, '2025-01-01',
          'Journal Entry', 'OB-001', :remarks, false,
          'system', NOW(), NOW()
        )
      `, {
        replacements: entry
      });

      console.log(`   ✅ ${entry.remarks}: مدين ${entry.debit} - دائن ${entry.credit}`);
    }

    console.log('\n🎉 تم إنشاء الأرصدة الافتتاحية بنجاح!');

    // Test the opening trial balance
    console.log('\n🧪 اختبار ميزان المراجعة الافتتاحي...');
    
    const response = await fetch('http://localhost:5001/api/financial/reports/opening-trial-balance?asOfDate=2025-12-31&currency=LYD');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ ميزان المراجعة الافتتاحي يعمل');
      console.log(`   📊 عدد الحسابات: ${data.data.accounts.length}`);
      console.log(`   💰 إجمالي المدين: ${data.data.totals.totalDebit} د.ل`);
      console.log(`   💰 إجمالي الدائن: ${data.data.totals.totalCredit} د.ل`);
      console.log(`   ⚖️ متوازن: ${data.data.totals.isBalanced ? 'نعم' : 'لا'}`);
    } else {
      console.log('❌ فشل في اختبار ميزان المراجعة الافتتاحي');
    }

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await sequelize.close();
  }
}

createOpeningBalanceEntries();
