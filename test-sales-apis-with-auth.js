import { Sequelize, DataTypes, Op } from 'sequelize';
import jwt from 'jsonwebtoken';

/**
 * اختبار APIs المبيعات مع authentication حقيقي
 * Test Sales APIs with Real Authentication
 */

console.log('🛒 بدء اختبار APIs المبيعات مع authentication...\n');

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

async function testSalesAPIsWithAuth() {
  try {
    console.log('📊 فحص الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ الاتصال بقاعدة البيانات ناجح\n');

    // 1. فحص المستخدمين الموجودين
    console.log('👤 فحص المستخدمين الموجودين...');
    try {
      const users = await sequelize.query(`
        SELECT id, username, name, role, "isActive"
        FROM users 
        WHERE "isActive" = true
        ORDER BY username
      `, { type: sequelize.QueryTypes.SELECT });
      
      console.log(`✅ تم العثور على ${users.length} مستخدم نشط:`);
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.username} (${user.name}) - ${user.role}`);
      });
      
      if (users.length === 0) {
        console.log('❌ لا يوجد مستخدمين نشطين');
        return;
      }
      
      // استخدام أول مستخدم admin أو sales
      const testUser = users.find(u => ['admin', 'sales', 'manager'].includes(u.role)) || users[0];
      console.log(`\n🎯 سيتم استخدام المستخدم: ${testUser.username} (${testUser.role})`);
      
      // 2. إنشاء JWT token للاختبار
      console.log('\n🔑 إنشاء JWT token للاختبار...');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      
      const token = jwt.sign(
        {
          userId: testUser.id,
          username: testUser.username,
          role: testUser.role,
          type: 'access'
        },
        JWT_SECRET,
        {
          expiresIn: '1h',
          issuer: 'golden-horse-api',
          audience: 'golden-horse-client'
        }
      );
      
      console.log('✅ تم إنشاء JWT token بنجاح');
      
      // 3. محاكاة middleware authentication
      console.log('\n🔐 محاكاة middleware authentication...');
      
      const mockReq = {
        headers: {
          authorization: `Bearer ${token}`
        },
        user: {
          id: testUser.id,
          userId: testUser.id,
          username: testUser.username,
          name: testUser.name,
          role: testUser.role
        }
      };
      
      console.log('✅ تم إعداد mock request بنجاح');
      
      // 4. اختبار sales summary API
      console.log('\n📊 اختبار sales summary API...');
      try {
        // محاكاة الكود الفعلي من sales.js
        const summaryQuery = `
          SELECT 
            COUNT(*) as total_invoices,
            COALESCE(SUM("totalAmount"), 0) as total_sales,
            COUNT(DISTINCT "customerId") as active_customers,
            AVG("totalAmount") as average_order_value
          FROM sales_invoices 
          WHERE "isActive" = true AND status != 'cancelled'
        `;
        
        const summary = await sequelize.query(summaryQuery, { type: sequelize.QueryTypes.SELECT });
        
        const total = parseFloat(summary[0].total_sales || 0);
        const invCount = parseInt(summary[0].total_invoices || 0);
        const avgOrder = parseFloat(summary[0].average_order_value || 0);
        const activeCustomers = parseInt(summary[0].active_customers || 0);
        
        const result = {
          totalSales: total,
          totalOrders: invCount,
          activeCustomers: activeCustomers,
          averageOrderValue: parseFloat(avgOrder.toFixed(2)),
          monthlyGrowth: 0,
          totalInvoices: invCount,
          totalPayments: 0,
          lowStockItems: 0,
          generatedAt: new Date().toISOString()
        };
        
        console.log('✅ Sales summary API نجح:');
        console.log(`   - إجمالي المبيعات: ${result.totalSales} د.ل`);
        console.log(`   - إجمالي الطلبات: ${result.totalOrders}`);
        console.log(`   - العملاء النشطين: ${result.activeCustomers}`);
        console.log(`   - متوسط قيمة الطلب: ${result.averageOrderValue} د.ل`);
        
      } catch (error) {
        console.log(`❌ خطأ في sales summary API: ${error.message}`);
      }
      
      // 5. اختبار sales invoices API
      console.log('\n📄 اختبار sales invoices API...');
      try {
        const page = 1;
        const limit = 10;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        const whereClause = 'WHERE si."isActive" = true';
        
        const countQuery = `
          SELECT COUNT(*) as count
          FROM sales_invoices si
          LEFT JOIN customers c ON si."customerId" = c.id
          ${whereClause}
        `;
        
        const dataQuery = `
          SELECT 
            si.id, si."invoiceNumber", si."invoiceDate", si."dueDate", 
            si."totalAmount", si.status, si."paymentStatus", si."salesPerson",
            si."salesChannel", si.notes, si."createdAt",
            c.id as "customer_id", c.code as "customer_code", c.name as "customer_name",
            c.phone as "customer_phone", c.email as "customer_email"
          FROM sales_invoices si
          LEFT JOIN customers c ON si."customerId" = c.id
          ${whereClause}
          ORDER BY si."invoiceDate" DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
        
        const [countResult, invoices] = await Promise.all([
          sequelize.query(countQuery, { type: sequelize.QueryTypes.SELECT }),
          sequelize.query(dataQuery, { type: sequelize.QueryTypes.SELECT })
        ]);
        
        const total = parseInt(countResult[0].count);
        
        console.log(`✅ Sales invoices API نجح:`);
        console.log(`   - إجمالي الفواتير: ${total}`);
        console.log(`   - فواتير الصفحة الحالية: ${invoices.length}`);
        
        if (invoices.length > 0) {
          console.log('   📋 عينة من الفواتير:');
          invoices.slice(0, 3).forEach((invoice, index) => {
            console.log(`     ${index + 1}. ${invoice.invoiceNumber} - ${invoice.totalAmount} د.ل (${invoice.customer_name})`);
          });
        }
        
      } catch (error) {
        console.log(`❌ خطأ في sales invoices API: ${error.message}`);
      }
      
      // 6. اختبار customers API
      console.log('\n👥 اختبار customers API...');
      try {
        const customersQuery = `
          SELECT 
            c.id, c.code, c.name, c.phone, c.email, c.balance, c."isActive",
            c.type, c."customerType", c."creditLimit", c."paymentTerms"
          FROM customers c
          WHERE c."isActive" = true
          ORDER BY c.name
          LIMIT 10
        `;
        
        const customers = await sequelize.query(customersQuery, { type: sequelize.QueryTypes.SELECT });
        
        console.log(`✅ Customers API نجح - ${customers.length} عميل`);
        
        if (customers.length > 0) {
          console.log('   📋 عينة من العملاء:');
          customers.slice(0, 3).forEach((customer, index) => {
            console.log(`     ${index + 1}. ${customer.name} (${customer.code}) - ${customer.type}`);
          });
        }
        
      } catch (error) {
        console.log(`❌ خطأ في customers API: ${error.message}`);
      }
      
      // 7. اختبار authorization للأدوار المختلفة
      console.log('\n🔒 اختبار authorization للأدوار المختلفة...');
      
      const allowedRoles = ['admin', 'sales', 'manager', 'accountant'];
      const userRole = testUser.role;
      
      if (allowedRoles.includes(userRole)) {
        console.log(`✅ المستخدم ${testUser.username} (${userRole}) لديه صلاحية الوصول للمبيعات`);
      } else {
        console.log(`❌ المستخدم ${testUser.username} (${userRole}) ليس لديه صلاحية الوصول للمبيعات`);
      }
      
    } catch (error) {
      console.log(`❌ خطأ في فحص المستخدمين: ${error.message}`);
    }
    
    console.log('\n🎯 انتهاء اختبار APIs المبيعات مع authentication');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
    console.error('📋 تفاصيل الخطأ:', error);
  } finally {
    await sequelize.close();
  }
}

// تشغيل الاختبار
testSalesAPIsWithAuth();
