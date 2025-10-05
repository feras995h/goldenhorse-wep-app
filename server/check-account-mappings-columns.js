import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

async function checkColumns() {
  try {
    await sequelize.authenticate();
    console.log('Connected\n');

    const [columns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'account_mappings'
      ORDER BY ordinal_position
    `);

    console.log('account_mappings columns:');
    console.log('='.repeat(50));
    columns.forEach(col => {
      console.log(`${col.column_name.padEnd(30)} | ${col.data_type}`);
    });

    const hasSalesTax = columns.some(c => c.column_name === 'salesTaxAccount' || c.column_name === 'salestaxaccount');
    console.log('\nsalesTaxAccount exists:', hasSalesTax);

    await sequelize.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkColumns();
