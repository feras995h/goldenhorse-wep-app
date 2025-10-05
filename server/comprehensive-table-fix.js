import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

async function comprehensiveFix() {
  try {
    await sequelize.authenticate();
    console.log('✅ متصل بقاعدة البيانات\n');

    const queryInterface = sequelize.getQueryInterface();

    console.log('🔧 بدء الفحص الشامل والإصلاح...\n');
    console.log('='.repeat(70));

    // 1. Fix receipt_vouchers if needed
    console.log('\n📋 فحص جدول: receipt_vouchers');
    try {
      const receiptColumns = await queryInterface.describeTable('receipt_vouchers');
      const receiptColumnNames = Object.keys(receiptColumns);
      
      const requiredReceiptColumns = {
        customerId: { type: Sequelize.UUID, allowNull: true, references: { model: 'customers', key: 'id' } },
        customerName: { type: Sequelize.STRING(200), allowNull: true },
        shipmentId: { type: Sequelize.UUID, allowNull: true, references: { model: 'shipments', key: 'id' } },
        purpose: { type: Sequelize.STRING(500), allowNull: true },
        purposeDescription: { type: Sequelize.STRING(500), allowNull: true }
      };

      for (const [col, def] of Object.entries(requiredReceiptColumns)) {
        if (!receiptColumnNames.includes(col)) {
          console.log(`   ➕ إضافة عمود: ${col}`);
          await queryInterface.addColumn('receipt_vouchers', col, def);
        }
      }
      console.log('   ✅ receipt_vouchers جاهز');
    } catch (err) {
      console.log(`   ⚠️  خطأ: ${err.message}`);
    }

    // 2. Fix payment_vouchers if needed
    console.log('\n📋 فحص جدول: payment_vouchers');
    try {
      const paymentColumns = await queryInterface.describeTable('payment_vouchers');
      const paymentColumnNames = Object.keys(paymentColumns);
      
      const requiredPaymentColumns = {
        beneficiaryId: { type: Sequelize.UUID, allowNull: true, references: { model: 'suppliers', key: 'id' } },
        beneficiaryName: { type: Sequelize.STRING(200), allowNull: true },
        purpose: { type: Sequelize.STRING(500), allowNull: true },
        purposeDescription: { type: Sequelize.STRING(500), allowNull: true }
      };

      for (const [col, def] of Object.entries(requiredPaymentColumns)) {
        if (!paymentColumnNames.includes(col)) {
          console.log(`   ➕ إضافة عمود: ${col}`);
          await queryInterface.addColumn('payment_vouchers', col, def);
        }
      }
      console.log('   ✅ payment_vouchers جاهز');
    } catch (err) {
      console.log(`   ⚠️  خطأ: ${err.message}`);
    }

    // 3. Fix sales_invoices if needed
    console.log('\n📋 فحص جدول: sales_invoices');
    try {
      const salesColumns = await queryInterface.describeTable('sales_invoices');
      const salesColumnNames = Object.keys(salesColumns);
      
      const requiredSalesColumns = {
        customerId: { type: Sequelize.UUID, allowNull: true, references: { model: 'customers', key: 'id' } },
        total: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        subtotal: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        taxAmount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        status: { type: Sequelize.STRING(50), defaultValue: 'draft' }
      };

      for (const [col, def] of Object.entries(requiredSalesColumns)) {
        if (!salesColumnNames.includes(col)) {
          console.log(`   ➕ إضافة عمود: ${col}`);
          await queryInterface.addColumn('sales_invoices', col, def);
        }
      }
      console.log('   ✅ sales_invoices جاهز');
    } catch (err) {
      console.log(`   ⚠️  خطأ: ${err.message}`);
    }

    // 4. Fix shipments if needed
    console.log('\n📋 فحص جدول: shipments');
    try {
      const shipmentColumns = await queryInterface.describeTable('shipments');
      const shipmentColumnNames = Object.keys(shipmentColumns);
      
      const requiredShipmentColumns = {
        estimatedArrival: { type: Sequelize.DATE, allowNull: true },
        actualArrival: { type: Sequelize.DATE, allowNull: true },
        status: { type: Sequelize.STRING(50), defaultValue: 'pending' }
      };

      for (const [col, def] of Object.entries(requiredShipmentColumns)) {
        if (!shipmentColumnNames.includes(col)) {
          console.log(`   ➕ إضافة عمود: ${col}`);
          await queryInterface.addColumn('shipments', col, def);
        }
      }
      console.log('   ✅ shipments جاهز');
    } catch (err) {
      console.log(`   ⚠️  خطأ: ${err.message}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ اكتمل الفحص والإصلاح الشامل!');
    console.log('='.repeat(70));

    await sequelize.close();
  } catch (err) {
    console.error('\n❌ خطأ:', err.message);
    console.error(err);
    await sequelize.close();
    process.exit(1);
  }
}

comprehensiveFix();
