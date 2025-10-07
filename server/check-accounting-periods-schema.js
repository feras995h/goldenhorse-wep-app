import { sequelize } from './src/models/index.js';
import { QueryTypes } from 'sequelize';

async function checkAccountingPeriodsSchema() {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');

    const [accountingPeriodsExists] = await sequelize.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE  table_schema = 'public'
        AND    table_name   = 'accounting_periods'
      );`,
      { type: QueryTypes.SELECT }
    );

    if (accountingPeriodsExists && accountingPeriodsExists.exists) {
      console.log('accounting_periods table exists.');
    } else {
      console.log('accounting_periods table does not exist or query failed.');
    }

    const [auditLogsExists] = await sequelize.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE  table_schema = 'public'
        AND    table_name   = 'audit_logs'
      );`,
      { type: QueryTypes.SELECT }
    );

    if (auditLogsExists && auditLogsExists.exists) {
      console.log('audit_logs table exists.');
    }
    else {
      console.log('audit_logs table does not exist or query failed.');
    }

    const [sequelizeMetaExists] = await sequelize.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE  table_schema = 'public'
        AND    table_name   = 'SequelizeMeta'
      );`,
      { type: QueryTypes.SELECT }
    );

    if (sequelizeMetaExists && sequelizeMetaExists.exists) {
      console.log('SequelizeMeta table exists.');
    } else {
      console.log('SequelizeMeta table does not exist or query failed.');
    }

  } catch (error) {
    console.error('Unable to connect to the database or check schema:', error);
  } finally {
    await sequelize.close();
  }
}

checkAccountingPeriodsSchema();