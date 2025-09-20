#!/usr/bin/env node

/**
 * إنشاء جداول قاعدة البيانات
 */

import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Create SQLite connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database/development.sqlite',
  logging: false
});

async function createTables() {
  try {
    console.log('🔧 بدء إنشاء جداول قاعدة البيانات...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // Create basic tables manually
    console.log('📋 إنشاء الجداول الأساسية...');
    
    // Create customers table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        accountId TEXT,
        name TEXT NOT NULL,
        nameEn TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        taxNumber TEXT,
        creditLimit DECIMAL(15,2) DEFAULT 0.00,
        isActive BOOLEAN DEFAULT 1,
        balance DECIMAL(15,2) DEFAULT 0.00,
        contactPerson TEXT,
        type TEXT DEFAULT 'individual',
        paymentTerms INTEGER DEFAULT 30,
        currency TEXT DEFAULT 'LYD',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create invoices table with outstandingAmount
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        invoiceNumber TEXT UNIQUE NOT NULL,
        customerId TEXT NOT NULL,
        date DATE NOT NULL,
        dueDate DATE NOT NULL,
        subtotal DECIMAL(15,2) DEFAULT 0.00,
        discountAmount DECIMAL(15,2) DEFAULT 0.00,
        taxAmount DECIMAL(15,2) DEFAULT 0.00,
        total DECIMAL(15,2) DEFAULT 0.00,
        paidAmount DECIMAL(15,2) DEFAULT 0.00,
        outstandingAmount DECIMAL(15,2) DEFAULT 0.00,
        currency TEXT DEFAULT 'LYD',
        status TEXT DEFAULT 'draft',
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customerId) REFERENCES customers(id)
      )
    `);
    
    // Create shipments table with category
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        id TEXT PRIMARY KEY,
        trackingNumber TEXT UNIQUE NOT NULL,
        customerId TEXT NOT NULL,
        customerName TEXT NOT NULL,
        customerPhone TEXT,
        itemDescription TEXT NOT NULL,
        itemDescriptionEn TEXT,
        category TEXT DEFAULT 'other',
        quantity INTEGER DEFAULT 1,
        weight DECIMAL(10,3) DEFAULT 0.000,
        length DECIMAL(10,2),
        width DECIMAL(10,2),
        height DECIMAL(10,2),
        volume DECIMAL(15,3),
        volumeOverride DECIMAL(15,3),
        declaredValue DECIMAL(15,2) DEFAULT 0.00,
        shippingCost DECIMAL(15,2) DEFAULT 0.00,
        originLocation TEXT,
        destinationLocation TEXT,
        status TEXT DEFAULT 'received_china',
        receivedDate DATE,
        estimatedDelivery DATE,
        actualDeliveryDate DATE,
        notes TEXT,
        isFragile BOOLEAN DEFAULT 0,
        requiresSpecialHandling BOOLEAN DEFAULT 0,
        customsDeclaration TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customerId) REFERENCES customers(id)
      )
    `);
    
    console.log('✅ تم إنشاء الجداول الأساسية بنجاح');
    
    // Test the tables
    console.log('🧪 اختبار الجداول...');
    const tables = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('📋 الجداول الموجودة:', tables[0].map(t => t.name));
    
    console.log('🎉 تم إنشاء قاعدة البيانات بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء الجداول:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔒 تم إغلاق الاتصال بقاعدة البيانات');
  }
}

// Run the creation
createTables();
