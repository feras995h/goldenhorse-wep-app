import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function checkGLStructure() {
  try {
    await sequelize.authenticate();
    console.log('✅ متصل بقاعدة البيانات');
    
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'gl_entries' 
      ORDER BY ordinal_position
    `);
    
    console.log('📊 أعمدة جدول gl_entries:');
    columns.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });
    
    // Check existing data
    const [sample] = await sequelize.query(`
      SELECT * FROM gl_entries LIMIT 3
    `);
    
    console.log('\n📋 عينة من البيانات الموجودة:');
    sample.forEach((entry, index) => {
      console.log(`   ${index + 1}. ID: ${entry.id}`);
      console.log(`      Account ID: ${entry.accountId}`);
      console.log(`      Posting Date: ${entry.postingDate}`);
      console.log(`      Voucher Type: ${entry.voucherType}`);
      console.log(`      Debit: ${entry.debit}`);
      console.log(`      Credit: ${entry.credit}`);
      console.log(`      Description/Remarks: ${entry.remarks || entry.description || 'N/A'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkGLStructure();
