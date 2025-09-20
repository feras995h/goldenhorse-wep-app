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

async function checkTables() {
  try {
    await sequelize.authenticate();
    
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('الجداول الموجودة:');
    console.log(tables.map(t => t.table_name).join(', '));
    
  } catch (error) {
    console.error('خطأ:', error);
  } finally {
    await sequelize.close();
  }
}

checkTables();
