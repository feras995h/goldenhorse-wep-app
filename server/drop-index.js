import { sequelize } from './src/models/index.js';
import { QueryTypes } from 'sequelize';

async function dropFiscalYearIndex() {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');

    // Check if the index exists before dropping it
    const [indexCheck] = await sequelize.query(
      `SELECT 1 FROM pg_indexes WHERE tablename = 'accounting_periods' AND indexname = 'accounting_periods_fiscal_year';`,
      { type: QueryTypes.SELECT }
    );

    if (indexCheck.length > 0) {
      console.log('Dropping index accounting_periods_fiscal_year...');
      await sequelize.query(
        `DROP INDEX IF EXISTS "accounting_periods_fiscal_year";`,
        { type: QueryTypes.RAW }
      );
      console.log('Index accounting_periods_fiscal_year dropped successfully.');
    } else {
      console.log('Index accounting_periods_fiscal_year does not exist. Skipping drop.');
    }

  } catch (error) {
    console.error('Unable to connect to the database or drop index:', error);
  } finally {
    await sequelize.close();
  }
}

dropFiscalYearIndex();