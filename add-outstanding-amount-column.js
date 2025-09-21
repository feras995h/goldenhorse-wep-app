import { Sequelize } from 'sequelize';

async function addOutstandingAmountColumn() {
  console.log('🔧 إضافة عمود outstandingAmount إلى جدول sales_invoices...');

  const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping', {
    dialect: 'postgres',
    logging: false
  });

  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // Check if column exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sales_invoices' 
      AND column_name = 'outstandingAmount'
    `);

    if (results.length > 0) {
      console.log('ℹ️ عمود outstandingAmount موجود بالفعل');
      return;
    }

    // Add outstandingAmount column
    await sequelize.query(`
      ALTER TABLE sales_invoices 
      ADD COLUMN outstandingAmount DECIMAL(15,2) DEFAULT 0.00 NOT NULL
    `);

    console.log('✅ تم إضافة عمود outstandingAmount بنجاح');

    // Add index
    await sequelize.query(`
      CREATE INDEX idx_sales_invoices_outstanding_amount ON sales_invoices(outstandingAmount)
    `);

    console.log('✅ تم إضافة index للعمود');

    // Update existing records
    await sequelize.query(`
      UPDATE sales_invoices 
      SET outstandingAmount = GREATEST(0, total - "paidAmount") 
      WHERE outstandingAmount IS NULL OR outstandingAmount = 0
    `);

    console.log('✅ تم تحديث السجلات الموجودة');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await sequelize.close();
  }
}

addOutstandingAmountColumn();
