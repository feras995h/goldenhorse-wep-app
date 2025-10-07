import { sequelize } from '../models/index.js';

const verifySchema = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    const queryInterface = sequelize.getQueryInterface();
    console.log('Describing table: accounts');
    const tableDefinition = await queryInterface.describeTable('accounts');
    console.log('accounts table definition:', tableDefinition);

  } catch (error) {
    console.error('Unable to connect to the database or describe table:', error);
  } finally {
    await sequelize.close();
  }
};

verifySchema();