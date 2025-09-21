import { Sequelize } from 'sequelize';

async function updateOutstandingAmounts() {
  console.log('🔧 تحديث outstandingAmount لجميع الفواتير...');

  const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping', {
    dialect: 'postgres',
    logging: false
  });

  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // Update all sales invoices
    const [results] = await sequelize.query(`
      UPDATE sales_invoices 
      SET outstandingamount = GREATEST(0, total - "paidAmount")
    `);

    console.log(`✅ تم تحديث ${results[1] || 0} فاتورة مبيعات`);

    // Update all shipping invoices (if outstandingAmount column exists)
    try {
      const [shippingResults] = await sequelize.query(`
        UPDATE shipping_invoices 
        SET outstandingAmount = GREATEST(0, total - "paidAmount") 
        WHERE outstandingAmount IS NULL OR outstandingAmount = 0
      `);
      console.log(`✅ تم تحديث ${shippingResults[1] || 0} فاتورة شحن`);
    } catch (error) {
      console.log('ℹ️ جدول shipping_invoices لا يحتوي على عمود outstandingAmount');
    }

    // Check some sample data
    const [sample] = await sequelize.query(`
      SELECT "invoiceNumber", total, "paidAmount", outstandingamount 
      FROM sales_invoices 
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

updateOutstandingAmounts();
