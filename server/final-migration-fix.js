import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

async function finalFix() {
  try {
    await sequelize.authenticate();
    console.log('✅ متصل بقاعدة البيانات\n');

    // Check current status
    const [result] = await sequelize.query(`
      SELECT filename FROM migrations_log 
      WHERE filename LIKE '%019%' OR filename LIKE '%20250115%'
      ORDER BY filename
    `);

    console.log('الترحيلات المسجلة حالياً:');
    result.forEach(r => console.log(`  - ${r.filename}`));

    // Force mark 019 as complete
    await sequelize.query(`
      DELETE FROM migrations_log WHERE filename = '019-add-sales-tax-account-to-account-mappings.js'
    `);
    
    await sequelize.query(`
      INSERT INTO migrations_log (filename, applied_at) 
      VALUES ('019-add-sales-tax-account-to-account-mappings.js', NOW())
    `);

    console.log('\n✅ تم تحديث حالة migration 019');

    // Verify
    const [check] = await sequelize.query(`
      SELECT COUNT(*) as count FROM migrations_log 
      WHERE filename = '019-add-sales-tax-account-to-account-mappings.js'
    `);

    console.log(`\nالتحقق: migration 019 مسجل ${check[0].count} مرة`);

    await sequelize.close();
    console.log('\n✅ تم بنجاح!');
  } catch (err) {
    console.error('\n❌ خطأ:', err.message);
    await sequelize.close();
    process.exit(1);
  }
}

finalFix();
