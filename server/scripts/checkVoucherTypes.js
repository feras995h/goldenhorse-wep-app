import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function checkVoucherTypes() {
  try {
    await sequelize.authenticate();
    console.log('✅ متصل بقاعدة البيانات');
    
    const [voucherTypes] = await sequelize.query(`
      SELECT enumlabel as voucher_type
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'enum_gl_entries_voucherType'
      )
      ORDER BY enumsortorder
    `);
    
    console.log('📋 أنواع القسائم المسموحة:');
    voucherTypes.forEach(type => {
      console.log(`   - ${type.voucher_type}`);
    });
    
    // Check existing GL entries
    const [existingTypes] = await sequelize.query(`
      SELECT DISTINCT "voucherType", COUNT(*) as count
      FROM gl_entries
      GROUP BY "voucherType"
      ORDER BY count DESC
    `);
    
    console.log('\n📊 أنواع القسائم الموجودة:');
    existingTypes.forEach(type => {
      console.log(`   - ${type.voucherType}: ${type.count} قيد`);
    });
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkVoucherTypes();
