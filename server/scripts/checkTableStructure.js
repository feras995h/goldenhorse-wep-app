import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function checkTableStructure() {
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    // Check accounts table
    const [accounts] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'accounts' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 جدول accounts:');
    accounts.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check sample data
    const [sampleAccounts] = await sequelize.query(`
      SELECT id, code, name, type, balance 
      FROM accounts 
      LIMIT 5
    `);
    
    console.log('\n📋 عينة من البيانات:');
    sampleAccounts.forEach(acc => {
      console.log(`   ${acc.code}: ${acc.name} (${acc.type}) - ${acc.balance}`);
    });
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTableStructure();
