import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function checkCurrentData() {
  try {
    await sequelize.authenticate();
    console.log('✅ متصل بقاعدة البيانات');
    
    // Check GL entries
    const [glEntries] = await sequelize.query(`
      SELECT DISTINCT "voucherType", COUNT(*) as count
      FROM gl_entries
      GROUP BY "voucherType"
      ORDER BY count DESC
    `);
    
    console.log('\n📊 أنواع القسائم الموجودة في gl_entries:');
    glEntries.forEach(entry => {
      console.log(`   - ${entry.voucherType}: ${entry.count} قيد`);
    });
    
    // Check accounts with balances
    const [accountBalances] = await sequelize.query(`
      SELECT 
        type,
        COUNT(*) as total_accounts,
        COUNT(CASE WHEN balance != 0 THEN 1 END) as accounts_with_balance,
        SUM(CASE WHEN balance > 0 THEN balance ELSE 0 END) as positive_balances,
        SUM(CASE WHEN balance < 0 THEN ABS(balance) ELSE 0 END) as negative_balances
      FROM accounts
      WHERE "isActive" = true
      GROUP BY type
      ORDER BY type
    `);
    
    console.log('\n📋 تحليل أرصدة الحسابات:');
    accountBalances.forEach(balance => {
      console.log(`   ${balance.type}:`);
      console.log(`      📊 إجمالي الحسابات: ${balance.total_accounts}`);
      console.log(`      💰 حسابات لها أرصدة: ${balance.accounts_with_balance}`);
      console.log(`      📈 مجموع الأرصدة الموجبة: ${parseFloat(balance.positive_balances || 0).toFixed(2)} د.ل`);
      console.log(`      📉 مجموع الأرصدة السالبة: ${parseFloat(balance.negative_balances || 0).toFixed(2)} د.ل`);
    });
    
    // Check journal entries
    const [journalEntries] = await sequelize.query(`
      SELECT COUNT(*) as count FROM journal_entries
    `);
    
    console.log(`\n📝 عدد القيود في journal_entries: ${journalEntries[0].count}`);
    
    // Check if we need opening balances
    const [needsOpening] = await sequelize.query(`
      SELECT 
        code, name, type, balance
      FROM accounts
      WHERE "isActive" = true AND balance != 0
      ORDER BY type, code
      LIMIT 10
    `);
    
    console.log('\n💰 عينة من الحسابات التي لها أرصدة:');
    needsOpening.forEach(account => {
      console.log(`   ${account.code}: ${account.name} (${account.type}) - ${parseFloat(account.balance).toFixed(2)} د.ل`);
    });
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkCurrentData();
