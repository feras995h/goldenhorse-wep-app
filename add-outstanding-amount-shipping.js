import { Sequelize } from 'sequelize';

async function addOutstandingAmountToShipping() {
  console.log('🔧 إضافة عمود outstandingAmount إلى جدول shipping_invoices...');

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
      WHERE table_name = 'shipping_invoices' 
      AND column_name = 'outstandingamount'
    `);

    if (results.length > 0) {
      console.log('ℹ️ عمود outstandingamount موجود بالفعل');
    } else {
      // Add outstandingAmount column
      await sequelize.query(`
        ALTER TABLE shipping_invoices 
        ADD COLUMN outstandingamount DECIMAL(15,2) DEFAULT 0.00 NOT NULL
      `);

      console.log('✅ تم إضافة عمود outstandingamount بنجاح');

      // Add index
      await sequelize.query(`
        CREATE INDEX idx_shipping_invoices_outstanding_amount ON shipping_invoices(outstandingamount)
      `);

      console.log('✅ تم إضافة index للعمود');
    }

    // Update existing records
    await sequelize.query(`
      UPDATE shipping_invoices 
      SET outstandingamount = GREATEST(0, total - "paidAmount")
    `);

    console.log('✅ تم تحديث السجلات الموجودة');

    // Check some sample data
    const [sample] = await sequelize.query(`
      SELECT "invoiceNumber", total, "paidAmount", outstandingamount 
      FROM shipping_invoices 
      LIMIT 5
    `);

    console.log('📊 عينة من البيانات:');
    sample.forEach(row => {
      console.log(`  ${row.invoiceNumber}: total=${row.total}, paid=${row.paidAmount}, outstanding=${row.outstandingamount}`);
    });

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await sequelize.close();
  }
}

addOutstandingAmountToShipping();
