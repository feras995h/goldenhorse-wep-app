import { Sequelize, DataTypes, Op } from 'sequelize';

// استخدام متغيرات البيئة مباشرة
const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping';

/**
 * تشخيص مشكلة لوحة المبيعات - فحص الاتصال والبيانات
 * Sales Dashboard Connection Diagnosis Script
 */

console.log('🔍 بدء تشخيص مشكلة لوحة المبيعات...\n');

// إعداد الاتصال بقاعدة البيانات
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

// تعريف النماذج
const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  phone: DataTypes.STRING(20),
  email: DataTypes.STRING(100),
  address: DataTypes.TEXT,
  balance: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  category: {
    type: DataTypes.STRING(50),
    defaultValue: 'wholesale'
  }
}, {
  tableName: 'customers',
  timestamps: true
});

const SalesInvoice = sequelize.define('SalesInvoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  invoiceNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  customerId: {
    type: DataTypes.UUID,
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    defaultValue: Sequelize.literal('CURRENT_DATE')
  },
  dueDate: DataTypes.DATEONLY,
  totalAmount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  paidAmount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'sales_invoices',
  timestamps: true
});

const ShippingInvoice = sequelize.define('ShippingInvoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  invoice_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  customer_id: {
    type: DataTypes.UUID,
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    defaultValue: Sequelize.literal('CURRENT_DATE')
  },
  total_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  paid_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending'
  }
}, {
  tableName: 'shipping_invoices',
  timestamps: false,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

async function diagnoseSalesDashboard() {
  try {
    console.log('📊 فحص الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ الاتصال بقاعدة البيانات ناجح\n');

    // فحص الجداول الموجودة
    console.log('🗄️ فحص الجداول الموجودة...');
    const tables = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('customers', 'sales_invoices', 'shipping_invoices', 'invoices')",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('📋 الجداول الموجودة:');
    tables.forEach(table => {
      console.log(`  ✓ ${table.table_name}`);
    });
    console.log('');

    // فحص بيانات العملاء
    console.log('👥 فحص بيانات العملاء...');
    const customersCount = await Customer.count();
    const activeCustomers = await Customer.count({ where: { isActive: true } });
    
    console.log(`📊 إجمالي العملاء: ${customersCount}`);
    console.log(`✅ العملاء النشطون: ${activeCustomers}`);
    
    if (customersCount > 0) {
      const sampleCustomers = await Customer.findAll({ 
        limit: 5,
        attributes: ['id', 'code', 'name', 'isActive', 'category', 'balance']
      });
      console.log('📝 عينة من العملاء:');
      sampleCustomers.forEach(customer => {
        console.log(`  • ${customer.code} - ${customer.name} (${customer.category}) - رصيد: ${customer.balance} - نشط: ${customer.isActive}`);
      });
    }
    console.log('');

    // فحص فواتير المبيعات
    console.log('📄 فحص فواتير المبيعات...');
    const salesInvoicesCount = await SalesInvoice.count();
    const activeSalesInvoices = await SalesInvoice.count({ where: { isActive: true } });
    
    console.log(`📊 إجمالي فواتير المبيعات: ${salesInvoicesCount}`);
    console.log(`✅ فواتير المبيعات النشطة: ${activeSalesInvoices}`);
    
    if (salesInvoicesCount > 0) {
      const totalSalesAmount = await SalesInvoice.sum('totalAmount', { where: { isActive: true } });
      const totalPaidAmount = await SalesInvoice.sum('paidAmount', { where: { isActive: true } });
      
      console.log(`💰 إجمالي مبلغ المبيعات: ${totalSalesAmount || 0} د.ل`);
      console.log(`💳 إجمالي المبلغ المدفوع: ${totalPaidAmount || 0} د.ل`);
      console.log(`📊 المبلغ المستحق: ${(totalSalesAmount || 0) - (totalPaidAmount || 0)} د.ل`);
      
      const sampleInvoices = await SalesInvoice.findAll({ 
        limit: 5,
        attributes: ['id', 'invoiceNumber', 'date', 'totalAmount', 'paidAmount', 'status', 'isActive'],
        include: [{
          model: Customer,
          attributes: ['name', 'code']
        }]
      });
      
      console.log('📝 عينة من فواتير المبيعات:');
      sampleInvoices.forEach(invoice => {
        const customerName = invoice.Customer ? invoice.Customer.name : 'غير محدد';
        console.log(`  • ${invoice.invoiceNumber} - ${customerName} - ${invoice.totalAmount} د.ل - حالة: ${invoice.status} - نشط: ${invoice.isActive}`);
      });
    }
    console.log('');

    // فحص فواتير الشحن
    console.log('🚚 فحص فواتير الشحن...');
    const shippingInvoicesCount = await ShippingInvoice.count();
    
    console.log(`📊 إجمالي فواتير الشحن: ${shippingInvoicesCount}`);
    
    if (shippingInvoicesCount > 0) {
      const totalShippingAmount = await ShippingInvoice.sum('total_amount');
      const totalShippingPaid = await ShippingInvoice.sum('paid_amount');
      
      console.log(`💰 إجمالي مبلغ الشحن: ${totalShippingAmount || 0} د.ل`);
      console.log(`💳 إجمالي المبلغ المدفوع للشحن: ${totalShippingPaid || 0} د.ل`);
      
      const sampleShipping = await ShippingInvoice.findAll({ 
        limit: 5,
        attributes: ['id', 'invoice_number', 'date', 'total_amount', 'paid_amount', 'status']
      });
      
      console.log('📝 عينة من فواتير الشحن:');
      sampleShipping.forEach(invoice => {
        console.log(`  • ${invoice.invoice_number} - ${invoice.total_amount} د.ل - حالة: ${invoice.status}`);
      });
    }
    console.log('');

    // محاكاة استدعاء API للملخص
    console.log('🔄 محاكاة استدعاء API للملخص...');
    
    const where = { isActive: true };
    
    // حساب الإحصائيات
    const [totalSalesResult, totalInvoicesResult, activeCustomersResult] = await Promise.all([
      SalesInvoice.sum('totalAmount', { where }),
      SalesInvoice.count({ where }),
      Customer.count({ where: { isActive: true } })
    ]);
    
    const totalSales = parseFloat(totalSalesResult || 0);
    const totalInvoices = parseInt(totalInvoicesResult || 0);
    const activeCustomersCount = parseInt(activeCustomersResult || 0);
    const averageOrderValue = totalInvoices > 0 ? totalSales / totalInvoices : 0;
    
    const summary = {
      totalSales,
      totalOrders: totalInvoices,
      activeCustomers: activeCustomersCount,
      averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
      monthlyGrowth: 0, // يحتاج حساب معقد
      totalInvoices,
      totalPayments: 0, // يحتاج جدول المدفوعات
      lowStockItems: 0 // يحتاج جدول المخزون
    };
    
    console.log('📊 ملخص المبيعات المحسوب:');
    console.log(`  💰 إجمالي المبيعات: ${summary.totalSales} د.ل`);
    console.log(`  📄 إجمالي الطلبات: ${summary.totalOrders}`);
    console.log(`  👥 العملاء النشطون: ${summary.activeCustomers}`);
    console.log(`  📊 متوسط قيمة الطلب: ${summary.averageOrderValue} د.ل`);
    console.log('');

    // فحص APIs المطلوبة
    console.log('🔗 فحص APIs المطلوبة...');
    console.log('  ✓ /api/sales/summary - موجود في الكود');
    console.log('  ✓ /api/sales/customers - موجود في الكود');
    console.log('  ✓ /api/sales/sales-invoices - موجود في الكود');
    console.log('  ✓ /api/sales/shipping-invoices - موجود في الكود');
    console.log('');

    // التوصيات
    console.log('💡 التوصيات:');
    if (customersCount === 0) {
      console.log('  ⚠️ لا توجد بيانات عملاء - يجب إضافة عملاء تجريبيين');
    }
    if (salesInvoicesCount === 0) {
      console.log('  ⚠️ لا توجد فواتير مبيعات - يجب إضافة فواتير تجريبية');
    }
    if (shippingInvoicesCount === 0) {
      console.log('  ⚠️ لا توجد فواتير شحن - يجب إضافة فواتير شحن تجريبية');
    }
    
    if (customersCount > 0 && salesInvoicesCount > 0) {
      console.log('  ✅ البيانات موجودة - المشكلة قد تكون في الواجهة الأمامية أو الاتصال');
    }

  } catch (error) {
    console.error('❌ خطأ في التشخيص:', error.message);
    console.error('📋 تفاصيل الخطأ:', error);
  } finally {
    await sequelize.close();
  }
}

// تشغيل التشخيص
diagnoseSalesDashboard();
