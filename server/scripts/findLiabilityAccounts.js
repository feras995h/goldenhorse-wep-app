import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function findLiabilityAccounts() {
  try {
    await sequelize.authenticate();
    console.log('🔍 البحث عن حسابات الخصوم...');
    
    const [accounts] = await sequelize.query(`
      SELECT id, code, name, type, level, "parentId"
      FROM accounts 
      WHERE name LIKE '%خصوم%' OR name LIKE '%خصم%' OR type = 'liability'
      ORDER BY code
    `);
    
    console.log('📊 الحسابات الموجودة:');
    accounts.forEach(acc => {
      console.log(`   ${acc.code}: ${acc.name} (نوع: ${acc.type}, مستوى: ${acc.level})`);
    });
    
    if (accounts.length === 0) {
      console.log('❌ لم يتم العثور على حسابات خصوم');
      
      // البحث في جميع الحسابات التي قد تكون خصوم
      console.log('\n🔍 البحث في جميع حسابات النوع liability:');
      const [allLiabilities] = await sequelize.query(`
        SELECT id, code, name, type, level
        FROM accounts 
        WHERE type = 'liability'
        ORDER BY code
      `);
      
      allLiabilities.forEach(acc => {
        console.log(`   ${acc.code}: ${acc.name} (مستوى: ${acc.level})`);
      });
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await sequelize.close();
  }
}

findLiabilityAccounts();
