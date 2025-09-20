import { Sequelize, DataTypes, Op } from 'sequelize';

/**
 * إصلاح أعمدة جداول المبيعات المفقودة
 * Fix Missing Sales Tables Columns Script
 */

console.log('🔧 بدء إصلاح أعمدة جداول المبيعات المفقودة...\n');

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

async function fixMissingColumns() {
  try {
    console.log('📊 فحص الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ الاتصال بقاعدة البيانات ناجح\n');

    // فحص وإصلاح جدول العملاء
    console.log('👥 فحص وإصلاح جدول العملاء...');
    
    // فحص الأعمدة الموجودة في جدول العملاء
    const customerColumns = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      ORDER BY column_name
    `, { type: sequelize.QueryTypes.SELECT });
    
    const existingCustomerColumns = customerColumns.map(col => col.column_name);
    console.log('📋 الأعمدة الموجودة في جدول العملاء:', existingCustomerColumns.join(', '));
    
    // الأعمدة المطلوبة
    const requiredCustomerColumns = [
      { name: 'isActive', type: 'BOOLEAN', default: 'true' },
      { name: 'category', type: 'VARCHAR(50)', default: "'wholesale'" },
      { name: 'balance', type: 'DECIMAL(15,2)', default: '0' },
      { name: 'phone', type: 'VARCHAR(20)', default: 'NULL' },
      { name: 'email', type: 'VARCHAR(100)', default: 'NULL' },
      { name: 'address', type: 'TEXT', default: 'NULL' }
    ];
    
    for (const column of requiredCustomerColumns) {
      if (!existingCustomerColumns.includes(column.name)) {
        console.log(`📋 إضافة عمود ${column.name} لجدول العملاء...`);
        await sequelize.query(`
          ALTER TABLE customers 
          ADD COLUMN "${column.name}" ${column.type} DEFAULT ${column.default}
        `);
        console.log(`✅ تم إضافة عمود ${column.name}`);
      }
    }

    // فحص وإصلاح جدول فواتير المبيعات
    console.log('\n📄 فحص وإصلاح جدول فواتير المبيعات...');
    
    const salesInvoiceColumns = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sales_invoices' 
      ORDER BY column_name
    `, { type: sequelize.QueryTypes.SELECT });
    
    const existingSalesColumns = salesInvoiceColumns.map(col => col.column_name);
    console.log('📋 الأعمدة الموجودة في جدول فواتير المبيعات:', existingSalesColumns.join(', '));
    
    // الأعمدة المطلوبة لفواتير المبيعات
    const requiredSalesColumns = [
      { name: 'isActive', type: 'BOOLEAN', default: 'true' },
      { name: 'totalAmount', type: 'DECIMAL(15,2)', default: '0' },
      { name: 'paidAmount', type: 'DECIMAL(15,2)', default: '0' },
      { name: 'status', type: 'VARCHAR(20)', default: "'pending'" },
      { name: 'notes', type: 'TEXT', default: 'NULL' },
      { name: 'dueDate', type: 'DATE', default: 'NULL' }
    ];
    
    for (const column of requiredSalesColumns) {
      if (!existingSalesColumns.includes(column.name)) {
        console.log(`📋 إضافة عمود ${column.name} لجدول فواتير المبيعات...`);
        await sequelize.query(`
          ALTER TABLE sales_invoices 
          ADD COLUMN "${column.name}" ${column.type} DEFAULT ${column.default}
        `);
        console.log(`✅ تم إضافة عمود ${column.name}`);
      }
    }

    // إضافة بيانات تجريبية للعملاء
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

    // إضافة بيانات تجريبية لفواتير المبيعات
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

    // اختبار حساب ملخص المبيعات
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

    console.log('\n🎉 تم إصلاح جميع أعمدة جداول المبيعات بنجاح!');
    console.log('\n📋 الملخص النهائي:');
    console.log('  ✅ جدول العملاء - جميع الأعمدة مُضافة');
    console.log('  ✅ جدول فواتير المبيعات - جميع الأعمدة مُضافة');
    console.log('  ✅ بيانات تجريبية - مُضافة ومُختبرة');
    console.log('  ✅ ملخص المبيعات - يعمل بنجاح');
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح أعمدة جداول المبيعات:', error.message);
    console.error('📋 تفاصيل الخطأ:', error);
  } finally {
    await sequelize.close();
  }
}

// تشغيل الإصلاح
fixMissingColumns();
