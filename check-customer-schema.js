import sequelize from './server/src/models/index.js';

async function checkCustomerSchema() {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');

    const [results] = await sequelize.query(
      `SELECT column_name, data_type, character_maximum_length, numeric_precision, numeric_scale
       FROM information_schema.columns
       WHERE table_schema = CURRENT_SCHEMA() AND table_name = 'customers' AND column_name = 'accountId';`
    );

    if (results.length > 0) {
      console.log('\n"accountId" column in "customers" table:');
      console.log(results[0]);
      console.log('\n"accountId" column exists in the "customers" table.');
    } else {
      console.log('\n"accountId" column does NOT exist in the "customers" table.');
    }

    await sequelize.close();
  } catch (error) {
    console.error('Unable to connect to the database or check schema:', error);
  }
}

checkCustomerSchema();