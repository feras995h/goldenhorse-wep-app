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

async function checkColumnNames() {
  try {
    await sequelize.authenticate();
    
    console.log('فحص أعمدة جدول exchange_rates:');
    const [cols1] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'exchange_rates' 
      ORDER BY column_name
    `);
    console.log(cols1.map(c => c.column_name));
    
    console.log('\nفحص أعمدة جدول depreciation_schedules:');
    const [cols2] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'depreciation_schedules'
      ORDER BY column_name
    `);
    console.log(cols2.map(c => c.column_name));

    console.log('\nفحص أعمدة جدول fixed_assets:');
    const [cols3] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'fixed_assets'
      ORDER BY column_name
    `);
    console.log(cols3.map(c => c.column_name));
    
  } catch (error) {
    console.error('خطأ:', error);
  } finally {
    await sequelize.close();
  }
}

checkColumnNames();
