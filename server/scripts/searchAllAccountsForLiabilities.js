import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function searchAllAccountsForLiabilities() {
  try {
    await sequelize.authenticate();
    console.log('🔍 البحث الشامل عن حسابات الخصوم والالتزامات...');
    
    // البحث عن كلمة "خصوم"
    const [liabilityAccounts] = await sequelize.query(`
      SELECT id, code, name, type, level
      FROM accounts 
      WHERE name ILIKE '%خصوم%' OR name ILIKE '%خصم%'
      ORDER BY code
    `);
    
    console.log('\n📊 الحسابات التي تحتوي على "خصوم":');
    if (liabilityAccounts.length > 0) {
      liabilityAccounts.forEach(acc => {
        console.log(`   ${acc.code}: ${acc.name} (نوع: ${acc.type}, مستوى: ${acc.level})`);
      });
    } else {
      console.log('   ✅ لا توجد حسابات تحتوي على كلمة "خصوم"');
    }
    
    // البحث عن كلمة "التزام"
    const [commitmentAccounts] = await sequelize.query(`
      SELECT id, code, name, type, level
      FROM accounts 
      WHERE name ILIKE '%التزام%' OR name ILIKE '%التزامات%'
      ORDER BY code
    `);
    
    console.log('\n📊 الحسابات التي تحتوي على "التزام":');
    if (commitmentAccounts.length > 0) {
      commitmentAccounts.forEach(acc => {
        console.log(`   ${acc.code}: ${acc.name} (نوع: ${acc.type}, مستوى: ${acc.level})`);
      });
    } else {
      console.log('   ❌ لا توجد حسابات تحتوي على كلمة "التزام"');
    }
    
    // عرض جميع حسابات النوع liability
    const [allLiabilities] = await sequelize.query(`
      SELECT id, code, name, type, level
      FROM accounts 
      WHERE type = 'liability'
      ORDER BY code
    `);
    
    console.log('\n📊 جميع الحسابات من نوع liability:');
    allLiabilities.forEach(acc => {
      console.log(`   ${acc.code}: ${acc.name} (مستوى: ${acc.level})`);
    });
    
    console.log('\n🎯 الخلاصة:');
    console.log(`   📈 عدد حسابات تحتوي على "خصوم": ${liabilityAccounts.length}`);
    console.log(`   📈 عدد حسابات تحتوي على "التزام": ${commitmentAccounts.length}`);
    console.log(`   📈 إجمالي حسابات liability: ${allLiabilities.length}`);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await sequelize.close();
  }
}

searchAllAccountsForLiabilities();
