#!/usr/bin/env node

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: false
  }
});

async function checkInvoiceColumns() {
  try {
    await sequelize.authenticate();
    
    const [columns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' 
      ORDER BY column_name
    `);
    
    console.log('أعمدة جدول الفواتير:');
    console.log(JSON.stringify(columns.map(c => c.column_name), null, 2));
    
  } catch (error) {
    console.error('خطأ:', error);
  } finally {
    await sequelize.close();
  }
}

checkInvoiceColumns();
