import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

async function test019() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    const queryInterface = sequelize.getQueryInterface();

    console.log('Testing migration 019: Add salesTaxAccount to account_mappings\n');

    // Check if column already exists
    const [columns] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'account_mappings' AND column_name = 'salesTaxAccount'
    `);

    if (columns.length > 0) {
      console.log('⚠️  Column salesTaxAccount already exists');
      await sequelize.close();
      return;
    }

    console.log('Adding salesTaxAccount column...');
    
    await queryInterface.addColumn('account_mappings', 'salesTaxAccount', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      },
      comment: 'Account for sales tax payable'
    });

    console.log('✅ Column added successfully');

    console.log('\nAdding index...');
    await queryInterface.addIndex('account_mappings', ['salesTaxAccount']);
    console.log('✅ Index added successfully');

    await sequelize.close();
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error('\nError name:', err.name);
    if (err.sql) console.error('\nSQL:', err.sql);
    if (err.original) {
      console.error('\nOriginal error:', err.original.message);
    }
    await sequelize.close();
    process.exit(1);
  }
}

test019();
