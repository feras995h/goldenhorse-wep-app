require('dotenv').config();
const { Client } = require('pg');
const { sequelize } = require('./src/models/index.js');

const main = async () => {
  const dbName = sequelize.config.database;

  const client = new Client({
    host: sequelize.config.host,
    port: sequelize.config.port,
    user: sequelize.config.username,
    password: sequelize.config.password,
    database: 'template1' // Connect to a maintenance database
  });

  try {
    await client.connect();
    console.log(`Dropping database ${dbName}...`);
    await client.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
    console.log(`Database ${dbName} dropped.`);
    console.log(`Creating database ${dbName}...`);
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Database ${dbName} created.`);
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await client.end();
  }
};

main();