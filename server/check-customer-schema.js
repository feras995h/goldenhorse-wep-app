import { sequelize } from './src/models/index.js';
import { DataTypes } from 'sequelize';

async function checkCustomerSchema() {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');

    const queryResult = await sequelize.query(
      `SELECT column_name, data_type, character_maximum_length, numeric_precision, numeric_scale
       FROM information_schema.columns
       WHERE table_schema = CURRENT_SCHEMA() AND table_name = 'customers' AND column_name = 'accountId';`,
      { type: sequelize.QueryTypes.SELECT }
    );

    if (queryResult.length > 0) {
      console.log('Column \'accountId\' exists in \'customers\' table:', queryResult[0]);
    } else {
      console.log('Column \'accountId\' does NOT exist in \'customers\' table.');
    }

  } catch (error) {
    console.error('Unable to connect to the database or query schema:', error);
  } finally {
    await sequelize.close();
  }
}

checkCustomerSchema();