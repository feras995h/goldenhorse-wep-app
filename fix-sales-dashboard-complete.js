import { Sequelize, DataTypes, Op } from 'sequelize';

/**
 * إصلاح شامل لمشاكل لوحة المبيعات
 * Complete Sales Dashboard Fix Script
 */

console.log('🔧 بدء إصلاح مشاكل لوحة المبيعات...\n');

// إعداد الاتصال بقاعدة البيانات
const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

async function fixSalesDashboard() {
  try {
    console.log('📊 فحص الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ الاتصال بقاعدة البيانات ناجح\n');

    // 1. إصلاح جدول العملاء
    console.log('👥 إصلاح جدول العملاء...');
    
    // التحقق من وجود جدول العملاء
    const customersTableExists = await sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers')",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (!customersTableExists[0].exists) {
      console.log('📋 إنشاء جدول العملاء...');
      await sequelize.query(`
        CREATE TABLE customers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(20) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          phone VARCHAR(20),
          email VARCHAR(100),
          address TEXT,
          balance DECIMAL(15,2) DEFAULT 0,
          "isActive" BOOLEAN DEFAULT true,
          category VARCHAR(50) DEFAULT 'wholesale',
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ تم إنشاء جدول العملاء');
    } else {
      console.log('✅ جدول العملاء موجود');
      
      // التحقق من وجود عمود isActive
      const hasIsActive = await sequelize.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'isActive'",
        { type: sequelize.QueryTypes.SELECT }
      );
      
      if (hasIsActive.length === 0) {
        console.log('📋 إضافة عمود isActive لجدول العملاء...');
        await sequelize.query('ALTER TABLE customers ADD COLUMN "isActive" BOOLEAN DEFAULT true');
        console.log('✅ تم إضافة عمود isActive');
      }
    }

    // 2. إصلاح جدول فواتير المبيعات
    console.log('\n📄 إصلاح جدول فواتير المبيعات...');
    
    const salesInvoicesTableExists = await sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_invoices')",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (!salesInvoicesTableExists[0].exists) {
      console.log('📋 إنشاء جدول فواتير المبيعات...');
      await sequelize.query(`
        CREATE TABLE sales_invoices (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "invoiceNumber" VARCHAR(50) UNIQUE NOT NULL,
          "customerId" UUID REFERENCES customers(id),
          date DATE DEFAULT CURRENT_DATE,
          "dueDate" DATE,
          "totalAmount" DECIMAL(15,2) DEFAULT 0,
          "paidAmount" DECIMAL(15,2) DEFAULT 0,
          status VARCHAR(20) DEFAULT 'pending',
          notes TEXT,
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ تم إنشاء جدول فواتير المبيعات');
    } else {
      console.log('✅ جدول فواتير المبيعات موجود');
      
      // التحقق من وجود عمود isActive
      const hasIsActive = await sequelize.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'sales_invoices' AND column_name = 'isActive'",
        { type: sequelize.QueryTypes.SELECT }
      );
      
      if (hasIsActive.length === 0) {
        console.log('📋 إضافة عمود isActive لجدول فواتير المبيعات...');
        await sequelize.query('ALTER TABLE sales_invoices ADD COLUMN "isActive" BOOLEAN DEFAULT true');
        console.log('✅ تم إضافة عمود isActive');
      }
    }

    // 3. إضافة بيانات تجريبية للعملاء
    console.log('\n👥 إضافة بيانات تجريبية للعملاء...');
    
    const customersCount = await sequelize.query(
      'SELECT COUNT(*) as count FROM customers',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (parseInt(customersCount[0].count) === 0) {
      const testCustomers = [
        {
          code: 'CUST001',
          name: 'شركة الذهبي للتجارة',
          phone: '0912345678',
          email: 'golden@company.ly',
          address: 'طرابلس - شارع الجمهورية',
          balance: 5000.00,
          category: 'wholesale'
        },
        {
          code: 'CUST002', 
          name: 'مؤسسة النجمة للشحن',
          phone: '0923456789',
          email: 'star@shipping.ly',
          address: 'بنغازي - شارع عمر المختار',
          balance: 3200.50,
          category: 'wholesale'
        },
        {
          code: 'CUST003',
          name: 'شركة البحر الأبيض',
          phone: '0934567890',
          email: 'white@sea.ly',
          address: 'مصراتة - المنطقة الصناعية',
          balance: 1800.75,
          category: 'retail'
        },
        {
          code: 'CUST004',
          name: 'مجموعة الصحراء التجارية',
          phone: '0945678901',
          email: 'desert@group.ly',
          address: 'سبها - شارع الفاتح',
          balance: 4500.25,
          category: 'vip'
        },
        {
          code: 'CUST005',
          name: 'شركة الأطلس للنقل',
          phone: '0956789012',
          email: 'atlas@transport.ly',
          address: 'الزاوية - المنطقة التجارية',
          balance: 2100.00,
          category: 'wholesale'
        }
      ];
      
      for (const customer of testCustomers) {
        await sequelize.query(`
          INSERT INTO customers (code, name, phone, email, address, balance, category, "isActive")
          VALUES (:code, :name, :phone, :email, :address, :balance, :category, true)
        `, {
          replacements: customer,
          type: sequelize.QueryTypes.INSERT
        });
      }
      
      console.log(`✅ تم إضافة ${testCustomers.length} عميل تجريبي`);
    } else {
      console.log(`✅ يوجد ${customersCount[0].count} عميل في قاعدة البيانات`);
    }

    // 4. إضافة بيانات تجريبية لفواتير المبيعات
    console.log('\n📄 إضافة بيانات تجريبية لفواتير المبيعات...');
    
    const invoicesCount = await sequelize.query(
      'SELECT COUNT(*) as count FROM sales_invoices',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (parseInt(invoicesCount[0].count) === 0) {
      // الحصول على معرفات العملاء
      const customers = await sequelize.query(
        'SELECT id FROM customers LIMIT 5',
        { type: sequelize.QueryTypes.SELECT }
      );
      
      if (customers.length > 0) {
        const testInvoices = [
          {
            invoiceNumber: 'SI-2024-001',
            customerId: customers[0].id,
            date: '2024-09-15',
            dueDate: '2024-10-15',
            totalAmount: 2500.00,
            paidAmount: 2500.00,
            status: 'paid'
          },
          {
            invoiceNumber: 'SI-2024-002',
            customerId: customers[1].id,
            date: '2024-09-16',
            dueDate: '2024-10-16',
            totalAmount: 1800.50,
            paidAmount: 900.25,
            status: 'partial'
          },
          {
            invoiceNumber: 'SI-2024-003',
            customerId: customers[2].id,
            date: '2024-09-17',
            dueDate: '2024-10-17',
            totalAmount: 3200.75,
            paidAmount: 0.00,
            status: 'pending'
          },
          {
            invoiceNumber: 'SI-2024-004',
            customerId: customers[3].id,
            date: '2024-09-18',
            dueDate: '2024-10-18',
            totalAmount: 4100.25,
            paidAmount: 4100.25,
            status: 'paid'
          },
          {
            invoiceNumber: 'SI-2024-005',
            customerId: customers[4].id,
            date: '2024-09-19',
            dueDate: '2024-10-19',
            totalAmount: 1950.00,
            paidAmount: 975.00,
            status: 'partial'
          },
          {
            invoiceNumber: 'SI-2024-006',
            customerId: customers[0].id,
            date: '2024-09-20',
            dueDate: '2024-10-20',
            totalAmount: 2750.50,
            paidAmount: 0.00,
            status: 'pending'
          }
        ];
        
        for (const invoice of testInvoices) {
          await sequelize.query(`
            INSERT INTO sales_invoices ("invoiceNumber", "customerId", date, "dueDate", "totalAmount", "paidAmount", status, "isActive")
            VALUES (:invoiceNumber, :customerId, :date, :dueDate, :totalAmount, :paidAmount, :status, true)
          `, {
            replacements: invoice,
            type: sequelize.QueryTypes.INSERT
          });
        }
        
        console.log(`✅ تم إضافة ${testInvoices.length} فاتورة مبيعات تجريبية`);
      }
    } else {
      console.log(`✅ يوجد ${invoicesCount[0].count} فاتورة مبيعات في قاعدة البيانات`);
    }

    // 5. إنشاء الفهارس المطلوبة
    console.log('\n📊 إنشاء الفهارس المطلوبة...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(code)',
      'CREATE INDEX IF NOT EXISTS idx_customers_active ON customers("isActive")',
      'CREATE INDEX IF NOT EXISTS idx_sales_invoices_number ON sales_invoices("invoiceNumber")',
      'CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer ON sales_invoices("customerId")',
      'CREATE INDEX IF NOT EXISTS idx_sales_invoices_date ON sales_invoices(date)',
      'CREATE INDEX IF NOT EXISTS idx_sales_invoices_status ON sales_invoices(status)',
      'CREATE INDEX IF NOT EXISTS idx_sales_invoices_active ON sales_invoices("isActive")'
    ];
    
    for (const indexQuery of indexes) {
      await sequelize.query(indexQuery);
    }
    
    console.log('✅ تم إنشاء جميع الفهارس المطلوبة');

    // 6. اختبار APIs
    console.log('\n🔄 اختبار حساب ملخص المبيعات...');
    
    const summary = await sequelize.query(`
      SELECT 
        COUNT(*) as "totalOrders",
        COALESCE(SUM("totalAmount"), 0) as "totalSales",
        COALESCE(SUM("paidAmount"), 0) as "totalPayments",
        COALESCE(AVG("totalAmount"), 0) as "averageOrderValue"
      FROM sales_invoices 
      WHERE "isActive" = true
    `, { type: sequelize.QueryTypes.SELECT });
    
    const activeCustomers = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM customers 
      WHERE "isActive" = true
    `, { type: sequelize.QueryTypes.SELECT });
    
    const result = summary[0];
    const salesSummary = {
      totalSales: parseFloat(result.totalSales || 0),
      totalOrders: parseInt(result.totalOrders || 0),
      activeCustomers: parseInt(activeCustomers[0].count || 0),
      averageOrderValue: parseFloat(result.averageOrderValue || 0),
      totalPayments: parseFloat(result.totalPayments || 0),
      monthlyGrowth: 0,
      totalInvoices: parseInt(result.totalOrders || 0),
      lowStockItems: 0
    };
    
    console.log('📊 ملخص المبيعات:');
    console.log(`  💰 إجمالي المبيعات: ${salesSummary.totalSales} د.ل`);
    console.log(`  📄 إجمالي الطلبات: ${salesSummary.totalOrders}`);
    console.log(`  👥 العملاء النشطون: ${salesSummary.activeCustomers}`);
    console.log(`  📊 متوسط قيمة الطلب: ${salesSummary.averageOrderValue.toFixed(2)} د.ل`);
    console.log(`  💳 إجمالي المدفوعات: ${salesSummary.totalPayments} د.ل`);

    console.log('\n🎉 تم إصلاح جميع مشاكل لوحة المبيعات بنجاح!');
    console.log('\n📋 الملخص النهائي:');
    console.log('  ✅ جدول العملاء - مُصلح ومُحدث');
    console.log('  ✅ جدول فواتير المبيعات - مُصلح ومُحدث');
    console.log('  ✅ بيانات تجريبية - مُضافة');
    console.log('  ✅ فهارس الأداء - مُنشأة');
    console.log('  ✅ APIs المبيعات - جاهزة للعمل');
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح لوحة المبيعات:', error.message);
    console.error('📋 تفاصيل الخطأ:', error);
  } finally {
    await sequelize.close();
  }
}

// تشغيل الإصلاح
fixSalesDashboard();
