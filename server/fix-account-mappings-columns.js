import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

async function fixAccountMappingsColumns() {
  try {
    await sequelize.authenticate();
    console.log('✅ متصل بقاعدة البيانات\n');

    const queryInterface = sequelize.getQueryInterface();

    // Get existing columns
    const [existingColumns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'account_mappings'
    `);
    
    const existing = existingColumns.map(c => c.column_name);
    console.log('الأعمدة الموجودة حالياً:', existing.length);

    // Define all required columns
    const requiredColumns = {
      salesRevenueAccount: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'accounts', key: 'id' }
      },
      localCustomersAccount: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'accounts', key: 'id' }
      },
      foreignCustomersAccount: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'accounts', key: 'id' }
      },
      discountAccount: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'accounts', key: 'id' }
      },
      shippingRevenueAccount: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'accounts', key: 'id' }
      },
      handlingFeeAccount: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'accounts', key: 'id' }
      },
      customsClearanceAccount: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'accounts', key: 'id' }
      },
      insuranceAccount: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'accounts', key: 'id' }
      },
      storageAccount: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'accounts', key: 'id' }
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' }
      },
      updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' }
      }
    };

    console.log('\n🔨 إضافة الأعمدة الناقصة...\n');
    console.log('='.repeat(60));

    let addedCount = 0;
    for (const [columnName, columnDef] of Object.entries(requiredColumns)) {
      if (!existing.includes(columnName.toLowerCase())) {
        console.log(`\n➕ إضافة عمود: ${columnName}`);
        try {
          await queryInterface.addColumn('account_mappings', columnName, columnDef);
          console.log(`   ✅ تم بنجاح`);
          addedCount++;
        } catch (err) {
          console.log(`   ⚠️  خطأ: ${err.message}`);
        }
      } else {
        console.log(`⏭️  ${columnName} موجود بالفعل`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ تم إضافة ${addedCount} عمود جديد`);
    console.log('='.repeat(60));

    // Verify final columns
    const [finalColumns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'account_mappings'
      ORDER BY column_name
    `);

    console.log(`\n📊 إجمالي الأعمدة بعد التحديث: ${finalColumns.length}`);
    console.log('\nجميع الأعمدة:');
    finalColumns.forEach((c, i) => {
      console.log(`  ${(i + 1).toString().padStart(2)}. ${c.column_name}`);
    });

    await sequelize.close();
    console.log('\n✅ اكتمل بنجاح!');
  } catch (err) {
    console.error('\n❌ خطأ:', err.message);
    console.error(err);
    await sequelize.close();
    process.exit(1);
  }
}

fixAccountMappingsColumns();
