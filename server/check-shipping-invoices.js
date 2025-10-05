import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

async function checkShippingInvoices() {
  try {
    await sequelize.authenticate();
    console.log('Connected\n');

    const [columns] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'shipping_invoices' ORDER BY column_name
    `);
    
    console.log('shipping_invoices columns:');
    columns.forEach(c => console.log(`  ${c.column_name}`));

    await sequelize.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkShippingInvoices();
