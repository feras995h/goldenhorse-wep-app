import { Sequelize } from 'sequelize';

async function checkOutstandingColumn() {
  console.log('🔍 فحص عمود outstandingAmount...');

  const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping', {
    dialect: 'postgres',
    logging: false
  });

  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // Check if column exists
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'sales_invoices' 
      AND column_name = 'outstandingAmount'
    `);

    if (results.length > 0) {
      console.log('✅ عمود outstandingAmount موجود:');
      console.log(results[0]);
    } else {
      console.log('❌ عمود outstandingAmount غير موجود');
    }

    // Check table structure
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'sales_invoices' 
      ORDER BY ordinal_position
    `);

    console.log('\n📋 جميع أعمدة جدول sales_invoices:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkOutstandingColumn();
