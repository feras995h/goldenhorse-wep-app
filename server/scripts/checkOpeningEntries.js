import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function checkOpeningEntries() {
  try {
    await sequelize.authenticate();
    console.log('✅ متصل بقاعدة البيانات');
    
    const [entries] = await sequelize.query(`
      SELECT remarks, debit, credit, "postingDate"
      FROM gl_entries 
      WHERE remarks LIKE '%افتتاحي%' OR remarks LIKE '%Opening%'
      ORDER BY "createdAt" DESC
      LIMIT 10
    `);
    
    console.log('📋 القيود الافتتاحية الموجودة:');
    entries.forEach(entry => {
      console.log(`   - ${entry.remarks}: مدين ${entry.debit} - دائن ${entry.credit}`);
    });
    
    if (entries.length === 0) {
      console.log('❌ لا توجد قيود افتتاحية');
      
      // Let's check all entries
      const [allEntries] = await sequelize.query(`
        SELECT remarks, debit, credit, "postingDate", "voucherType"
        FROM gl_entries 
        ORDER BY "createdAt" DESC
        LIMIT 5
      `);
      
      console.log('\n📋 آخر 5 قيود:');
      allEntries.forEach(entry => {
        console.log(`   - ${entry.voucherType}: ${entry.remarks} - مدين ${entry.debit} - دائن ${entry.credit}`);
      });
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkOpeningEntries();
