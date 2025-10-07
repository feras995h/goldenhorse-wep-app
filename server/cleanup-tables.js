import { sequelize } from './src/models/index.js';
import { QueryTypes } from 'sequelize';

async function cleanupTables() {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');

    // Drop the accounting_periods_fiscal_year index if it exists
    console.log('Attempting to drop index accounting_periods_fiscal_year...');
    await sequelize.query(
      `DROP INDEX IF EXISTS "accounting_periods_fiscal_year";`,
      { type: QueryTypes.RAW }
    );
    console.log('Index accounting_periods_fiscal_year drop command executed (may or may not have existed).');

    // Drop the accounting_periods table if it exists
    console.log('Attempting to drop table accounting_periods...');
    await sequelize.query(
      `DROP TABLE IF EXISTS "accounting_periods" CASCADE;`,
      { type: QueryTypes.RAW }
    );
    console.log('Table accounting_periods drop command executed (may or may not have existed).');

    // Drop the audit_logs_user_id index if it exists
    console.log('Attempting to drop index audit_logs_user_id...');
    await sequelize.query(
      `DROP INDEX IF EXISTS "audit_logs_user_id";`,
      { type: QueryTypes.RAW }
    );
    console.log('Index audit_logs_user_id drop command executed (may or may not have existed).');

    // Drop the audit_logs table if it exists
    console.log('Attempting to drop table audit_logs...');
    await sequelize.query(
      `DROP TABLE IF EXISTS "audit_logs" CASCADE;`,
      { type: QueryTypes.RAW }
    );
    console.log('Table audit_logs drop command executed (may or may not have existed).');

     // Drop purchase_invoice_payments_purchase_invoice_id index
     console.log('Attempting to drop index purchase_invoice_payments_purchase_invoice_id...');
     await sequelize.query(
       `DROP INDEX IF EXISTS "purchase_invoice_payments_purchase_invoice_id";`,
       { type: QueryTypes.RAW }
     );
     console.log('Index purchase_invoice_payments_purchase_invoice_id drop command executed (may or may not have existed).');

     // Drop purchase_invoice_payments table
     console.log('Attempting to drop table purchase_invoice_payments...');
     await sequelize.query(
       `DROP TABLE IF EXISTS "purchase_invoice_payments" CASCADE;`,
       { type: QueryTypes.RAW }
     );
     console.log('Table purchase_invoice_payments drop command executed (may or may not have existed).');

     // Drop sales_invoice_items_sales_invoice_id index
     console.log('Attempting to drop index sales_invoice_items_sales_invoice_id...');
     await sequelize.query(
       `DROP INDEX IF EXISTS "sales_invoice_items_sales_invoice_id";`,
       { type: QueryTypes.RAW }
     );
     console.log('Index sales_invoice_items_sales_invoice_id drop command executed (may or may not have existed).');

     // Drop sales_invoice_items table
     console.log('Attempting to drop table sales_invoice_items...');
     await sequelize.query(
       `DROP TABLE IF EXISTS "sales_invoice_items" CASCADE;`,
       { type: QueryTypes.RAW }
     );
     console.log('Table sales_invoice_items drop command executed (may or may not have existed).');

     // Drop sales_invoice_payments_sales_invoice_id index
     console.log('Attempting to drop index sales_invoice_payments_sales_invoice_id...');
     await sequelize.query(
       `DROP INDEX IF EXISTS "sales_invoice_payments_sales_invoice_id";`,
       { type: QueryTypes.RAW }
     );
     console.log('Index sales_invoice_payments_sales_invoice_id drop command executed (may or may not have existed).');

     // Drop sales_invoice_payments table
     console.log('Attempting to drop table sales_invoice_payments...');
     await sequelize.query(
       `DROP TABLE IF EXISTS "sales_invoice_payments" CASCADE;`,
       { type: QueryTypes.RAW }
     );

     // Drop sales_returns_sales_invoice_id index
     console.log('Attempting to drop index sales_returns_sales_invoice_id...');
     await sequelize.query(
       `DROP INDEX IF EXISTS "sales_returns_sales_invoice_id";`,
       { type: QueryTypes.RAW }
     );
     console.log('Index sales_returns_sales_invoice_id drop command executed (may or may not have existed).');

     // Drop sales_returns table
     console.log('Attempting to drop table sales_returns...');
     await sequelize.query(
       `DROP TABLE IF EXISTS "sales_returns" CASCADE;`,
       { type: QueryTypes.RAW }
     );

     // Drop stock_movements_warehouse_id index
     console.log('Attempting to drop index stock_movements_warehouse_id...');
     await sequelize.query(
       `DROP INDEX IF EXISTS "stock_movements_warehouse_id";`
     );
     console.log('Index stock_movements_warehouse_id drop command executed (may or may not have existed).');

     // Drop stock_movements table
     console.log('Attempting to drop table stock_movements...');
     await sequelize.query(
       `DROP TABLE IF EXISTS "stock_movements" CASCADE;`
     );

     // Drop warehouse_release_orders_warehouse_id index
     console.log('Attempting to drop index warehouse_release_orders_warehouse_id...');
     await sequelize.query(
       `DROP INDEX IF EXISTS "warehouse_release_orders_warehouse_id";`,
       { type: QueryTypes.RAW }
     );
     console.log('Index warehouse_release_orders_warehouse_id drop command executed (may or may not have existed).');

     // Drop warehouse_release_orders table
     console.log('Attempting to drop table warehouse_release_orders...');
     await sequelize.query(
       `DROP TABLE IF EXISTS "warehouse_release_orders" CASCADE;`,
       { type: QueryTypes.RAW }
     );
     console.log('Table warehouse_release_orders drop command executed (may or may not have existed).');
     console.log('Table stock_movements drop command executed (may or may not have existed).');
     console.log('Table sales_returns drop command executed (may or may not have existed).');
     console.log('Table sales_invoice_payments drop command executed (may or may not have existed).');

     // Drop SequelizeMeta table
     console.log('Attempting to drop table SequelizeMeta...');
     await sequelize.query(
       `DROP TABLE IF EXISTS "SequelizeMeta" CASCADE;`,
       { type: QueryTypes.RAW }
     );
     console.log('Table SequelizeMeta drop command executed (may or may not have existed).');

   } catch (error) {
    console.error('Unable to connect to the database or perform cleanup:', error);
  } finally {
    await sequelize.close();
  }
}

cleanupTables();