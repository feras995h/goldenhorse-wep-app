import { sequelize } from './src/models/index.js';
import { QueryTypes } from 'sequelize';

async function cleanupAccountingPeriods() {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');

    // Drop the index if it exists
    console.log('Attempting to drop index accounting_periods_fiscal_year...');
    await sequelize.query(
      `DROP INDEX IF EXISTS "accounting_periods_fiscal_year";`,
      { type: QueryTypes.RAW }
    );
    console.log('Index drop command executed (may or may not have existed).');

    // Drop the table if it exists
    console.log('Attempting to drop table accounting_periods...');
    await sequelize.query(
      `DROP TABLE IF EXISTS "accounting_periods" CASCADE;`,
      { type: QueryTypes.RAW }
    );
    console.log('Table drop command executed (may or may not have existed).');

  } catch (error) {
    console.error('Unable to connect to the database or perform cleanup:', error);
  } finally {
    await sequelize.close();
  }
}

cleanupAccountingPeriods();