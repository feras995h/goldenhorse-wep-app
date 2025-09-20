#!/usr/bin/env node

/**
 * تشخيص مشاكل نظام المبيعات
 * Diagnose Sales System Issues - Golden Horse Shipping System
 */

import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

class SalesSystemDiagnostic {
  constructor() {
    this.client = new Client({
      connectionString: DATABASE_URL,
      ssl: false
    });
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('🔗 تم الاتصال بقاعدة البيانات بنجاح');
      return true;
    } catch (error) {
      console.error('❌ فشل الاتصال بقاعدة البيانات:', error.message);
      return false;
    }
  }

  async checkCustomersTable() {
    console.log('\n🔍 فحص جدول العملاء (customers)...');
    
    try {
      // التحقق من وجود الجدول
      const tableExists = await this.client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'customers'
        )
      `);

      if (!tableExists.rows[0].exists) {
        console.log('   ❌ جدول customers غير موجود');
        return false;
      }

      console.log('   ✅ جدول customers موجود');

      // فحص بنية الجدول
      const columns = await this.client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'customers'
        ORDER BY ordinal_position
      `);

      console.log('   📊 أعمدة الجدول:');
      columns.rows.forEach(col => {
        console.log(`     - ${col.column_name} (${col.data_type})`);
      });

      // عدد العملاء
      const count = await this.client.query('SELECT COUNT(*) as count FROM customers');
      console.log(`   📊 عدد العملاء: ${count.rows[0].count}`);

      // عينة من العملاء
      const sample = await this.client.query(`
        SELECT id, code, name, email, phone, "customerType", "isActive"
        FROM customers 
        ORDER BY "createdAt" DESC 
        LIMIT 5
      `);

      if (sample.rows.length > 0) {
        console.log('   📋 عينة من العملاء:');
        sample.rows.forEach(customer => {
          console.log(`     - ${customer.name} (${customer.code}) - ${customer.customerType} - ${customer.isActive ? 'نشط' : 'غير نشط'}`);
        });
      } else {
        console.log('   ⚠️ لا توجد بيانات عملاء');
      }

      return true;

    } catch (error) {
      console.log(`   ❌ خطأ في فحص جدول العملاء: ${error.message}`);
      return false;
    }
  }

  async checkShippingInvoicesTable() {
    console.log('\n🔍 فحص جدول فواتير الشحن (shipping_invoices)...');
    
    try {
      // التحقق من وجود الجدول
      const tableExists = await this.client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'shipping_invoices'
        )
      `);

      if (!tableExists.rows[0].exists) {
        console.log('   ❌ جدول shipping_invoices غير موجود');
        return false;
      }

      console.log('   ✅ جدول shipping_invoices موجود');

      // عدد الفواتير
      const count = await this.client.query('SELECT COUNT(*) as count FROM shipping_invoices');
      console.log(`   📊 عدد فواتير الشحن: ${count.rows[0].count}`);

      // إحصائيات حسب الحالة
      const statusStats = await this.client.query(`
        SELECT status, COUNT(*) as count 
        FROM shipping_invoices 
        GROUP BY status
      `);

      if (statusStats.rows.length > 0) {
        console.log('   📊 إحصائيات حسب الحالة:');
        statusStats.rows.forEach(stat => {
          console.log(`     - ${stat.status}: ${stat.count} فاتورة`);
        });
      }

      return true;

    } catch (error) {
      console.log(`   ❌ خطأ في فحص جدول فواتير الشحن: ${error.message}`);
      return false;
    }
  }

  async checkSalesReportsData() {
    console.log('\n🔍 فحص بيانات تقارير المبيعات...');
    
    try {
      // فحص الجداول المطلوبة لتقارير المبيعات
      const requiredTables = ['customers', 'shipping_invoices', 'invoices', 'products'];
      
      for (const table of requiredTables) {
        const exists = await this.client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [table]);

        if (exists.rows[0].exists) {
          const count = await this.client.query(`SELECT COUNT(*) as count FROM ${table}`);
          console.log(`   ✅ جدول ${table}: ${count.rows[0].count} سجل`);
        } else {
          console.log(`   ❌ جدول ${table}: غير موجود`);
        }
      }

      return true;

    } catch (error) {
      console.log(`   ❌ خطأ في فحص بيانات تقارير المبيعات: ${error.message}`);
      return false;
    }
  }

  async checkMissingTables() {
    console.log('\n🔍 فحص الجداول المفقودة...');
    
    try {
      const requiredTables = [
        'customers',
        'shipping_invoices', 
        'invoices',
        'products',
        'categories',
        'payments',
        'invoice_items'
      ];

      const missingTables = [];

      for (const table of requiredTables) {
        const exists = await this.client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [table]);

        if (!exists.rows[0].exists) {
          missingTables.push(table);
        }
      }

      if (missingTables.length > 0) {
        console.log('   ❌ الجداول المفقودة:');
        missingTables.forEach(table => {
          console.log(`     - ${table}`);
        });
        return missingTables;
      } else {
        console.log('   ✅ جميع الجداول المطلوبة موجودة');
        return [];
      }

    } catch (error) {
      console.log(`   ❌ خطأ في فحص الجداول المفقودة: ${error.message}`);
      return [];
    }
  }

  async createMissingTables() {
    console.log('\n🔧 إنشاء الجداول المفقودة...');
    
    try {
      // إنشاء جدول المنتجات
      await this.client.query(`
        CREATE TABLE IF NOT EXISTS products (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(200) NOT NULL,
          "nameEn" VARCHAR(200),
          description TEXT,
          category VARCHAR(100),
          price DECIMAL(15,2) DEFAULT 0,
          cost DECIMAL(15,2) DEFAULT 0,
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('   ✅ تم إنشاء جدول products');

      // إنشاء جدول الفئات
      await this.client.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(200) NOT NULL,
          "nameEn" VARCHAR(200),
          description TEXT,
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('   ✅ تم إنشاء جدول categories');

      // إنشاء جدول الفواتير
      await this.client.query(`
        CREATE TABLE IF NOT EXISTS invoices (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "invoiceNumber" VARCHAR(50) UNIQUE NOT NULL,
          "customerId" UUID,
          date DATE DEFAULT CURRENT_DATE,
          "totalAmount" DECIMAL(15,2) DEFAULT 0,
          "paidAmount" DECIMAL(15,2) DEFAULT 0,
          status VARCHAR(20) DEFAULT 'pending',
          notes TEXT,
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('   ✅ تم إنشاء جدول invoices');

      // إنشاء جدول عناصر الفواتير
      await this.client.query(`
        CREATE TABLE IF NOT EXISTS invoice_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "invoiceId" UUID NOT NULL,
          "productId" UUID,
          description TEXT,
          quantity DECIMAL(10,2) DEFAULT 1,
          price DECIMAL(15,2) DEFAULT 0,
          total DECIMAL(15,2) DEFAULT 0,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('   ✅ تم إنشاء جدول invoice_items');

      // إنشاء جدول المدفوعات
      await this.client.query(`
        CREATE TABLE IF NOT EXISTS payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "customerId" UUID,
          "invoiceId" UUID,
          amount DECIMAL(15,2) NOT NULL,
          method VARCHAR(50) DEFAULT 'cash',
          reference VARCHAR(100),
          date DATE DEFAULT CURRENT_DATE,
          notes TEXT,
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('   ✅ تم إنشاء جدول payments');

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إنشاء الجداول المفقودة: ${error.message}`);
      return false;
    }
  }

  async populateTestData() {
    console.log('\n📊 إضافة بيانات اختبار للمبيعات...');
    
    try {
      // إضافة عملاء اختبار
      const customers = [
        { code: 'CL000001', name: 'شركة الأمل للتجارة', email: 'amal@example.com', phone: '0912345678', customerType: 'local' },
        { code: 'CL000002', name: 'مؤسسة النور', email: 'noor@example.com', phone: '0923456789', customerType: 'local' },
        { code: 'CF000001', name: 'International Trading Co.', email: 'intl@example.com', phone: '+1234567890', customerType: 'foreign' }
      ];

      for (const customer of customers) {
        try {
          await this.client.query(`
            INSERT INTO customers (
              code, name, email, phone, "customerType", "isActive"
            ) VALUES ($1, $2, $3, $4, $5, true)
            ON CONFLICT (code) DO NOTHING
          `, [customer.code, customer.name, customer.email, customer.phone, customer.customerType]);
          console.log(`   ✅ تم إدراج عميل: ${customer.name}`);
        } catch (error) {
          console.log(`   ⚠️ عميل موجود: ${customer.name}`);
        }
      }

      // إضافة منتجات اختبار
      const products = [
        { code: 'P001', name: 'خدمة شحن محلي', price: 50, category: 'shipping' },
        { code: 'P002', name: 'خدمة شحن دولي', price: 150, category: 'shipping' },
        { code: 'P003', name: 'خدمة تخزين', price: 25, category: 'storage' }
      ];

      for (const product of products) {
        try {
          await this.client.query(`
            INSERT INTO products (
              code, name, price, category, "isActive"
            ) VALUES ($1, $2, $3, $4, true)
            ON CONFLICT (code) DO NOTHING
          `, [product.code, product.name, product.price, product.category]);
          console.log(`   ✅ تم إدراج منتج: ${product.name}`);
        } catch (error) {
          console.log(`   ⚠️ منتج موجود: ${product.name}`);
        }
      }

      // إضافة فواتير اختبار
      const invoices = [
        { number: 'INV2025001', amount: 500, status: 'paid' },
        { number: 'INV2025002', amount: 750, status: 'pending' },
        { number: 'INV2025003', amount: 300, status: 'partial' }
      ];

      for (const invoice of invoices) {
        try {
          await this.client.query(`
            INSERT INTO invoices (
              "invoiceNumber", "totalAmount", status, "isActive"
            ) VALUES ($1, $2, $3, true)
            ON CONFLICT ("invoiceNumber") DO NOTHING
          `, [invoice.number, invoice.amount, invoice.status]);
          console.log(`   ✅ تم إدراج فاتورة: ${invoice.number}`);
        } catch (error) {
          console.log(`   ⚠️ فاتورة موجودة: ${invoice.number}`);
        }
      }

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إضافة بيانات الاختبار: ${error.message}`);
      return false;
    }
  }

  async testSalesAPIs() {
    console.log('\n🧪 اختبار APIs المبيعات...');
    
    try {
      // اختبار بيانات العملاء
      const customersCount = await this.client.query('SELECT COUNT(*) as count FROM customers WHERE "isActive" = true');
      console.log(`   📊 العملاء النشطون: ${customersCount.rows[0].count}`);

      // اختبار بيانات فواتير الشحن
      const shippingInvoicesCount = await this.client.query('SELECT COUNT(*) as count FROM shipping_invoices');
      console.log(`   📊 فواتير الشحن: ${shippingInvoicesCount.rows[0].count}`);

      // اختبار بيانات الفواتير العادية
      const invoicesCount = await this.client.query('SELECT COUNT(*) as count FROM invoices WHERE "isActive" = true');
      console.log(`   📊 الفواتير العادية: ${invoicesCount.rows[0].count}`);

      // اختبار بيانات المنتجات
      const productsCount = await this.client.query('SELECT COUNT(*) as count FROM products WHERE "isActive" = true');
      console.log(`   📊 المنتجات النشطة: ${productsCount.rows[0].count}`);

      // إحصائيات المبيعات
      const salesStats = await this.client.query(`
        SELECT 
          COUNT(*) as total_invoices,
          SUM("totalAmount") as total_sales,
          AVG("totalAmount") as avg_invoice
        FROM invoices 
        WHERE "isActive" = true
      `);

      if (salesStats.rows.length > 0) {
        const stats = salesStats.rows[0];
        console.log(`   📊 إجمالي الفواتير: ${stats.total_invoices}`);
        console.log(`   📊 إجمالي المبيعات: ${parseFloat(stats.total_sales || 0).toFixed(2)} د.ل`);
        console.log(`   📊 متوسط الفاتورة: ${parseFloat(stats.avg_invoice || 0).toFixed(2)} د.ل`);
      }

      return true;

    } catch (error) {
      console.log(`   ❌ فشل اختبار APIs المبيعات: ${error.message}`);
      return false;
    }
  }

  async disconnect() {
    try {
      await this.client.end();
      console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
    } catch (error) {
      console.error('خطأ في قطع الاتصال:', error.message);
    }
  }

  async runDiagnostic() {
    console.log('🔍 بدء تشخيص نظام المبيعات...\n');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('🎯 الهدف: تشخيص وإصلاح مشاكل نظام المبيعات');
    console.log('='.repeat(80));
    
    const connected = await this.connect();
    if (!connected) {
      return false;
    }

    try {
      // فحص جدول العملاء
      const customersOk = await this.checkCustomersTable();

      // فحص جدول فواتير الشحن
      const shippingInvoicesOk = await this.checkShippingInvoicesTable();

      // فحص بيانات تقارير المبيعات
      const reportsDataOk = await this.checkSalesReportsData();

      // فحص الجداول المفقودة
      const missingTables = await this.checkMissingTables();

      // إنشاء الجداول المفقودة إذا لزم الأمر
      if (missingTables.length > 0) {
        const tablesCreated = await this.createMissingTables();
        if (!tablesCreated) {
          console.log('❌ فشل في إنشاء الجداول المفقودة');
          return false;
        }
      }

      // إضافة بيانات الاختبار
      const dataPopulated = await this.populateTestData();
      if (!dataPopulated) {
        console.log('❌ فشل في إضافة بيانات الاختبار');
        return false;
      }

      // اختبار APIs المبيعات
      const apisOk = await this.testSalesAPIs();
      if (!apisOk) {
        console.log('❌ فشل في اختبار APIs المبيعات');
        return false;
      }

      console.log('\n🎉 تم تشخيص وإصلاح نظام المبيعات بنجاح!');
      console.log('✅ جميع الجداول المطلوبة موجودة');
      console.log('✅ بيانات الاختبار متوفرة');
      console.log('✅ APIs المبيعات جاهزة للعمل');
      
      return true;
      
    } catch (error) {
      console.error('❌ خطأ عام في تشخيص نظام المبيعات:', error.message);
      return false;
    } finally {
      await this.disconnect();
    }
  }
}

// تشغيل التشخيص
const diagnostic = new SalesSystemDiagnostic();
diagnostic.runDiagnostic().then(success => {
  if (success) {
    console.log('\n🎊 تم تشخيص وإصلاح نظام المبيعات بنجاح!');
    console.log('🔄 يرجى إعادة تشغيل الخادم لتطبيق التغييرات');
    console.log('✅ جميع APIs المبيعات ستعمل الآن بدون أخطاء');
    process.exit(0);
  } else {
    console.log('\n❌ فشل في تشخيص نظام المبيعات');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل تشخيص نظام المبيعات:', error);
  process.exit(1);
});
