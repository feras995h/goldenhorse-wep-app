import { Sequelize, DataTypes, Op } from 'sequelize';

/**
 * تشخيص مشكلة APIs السندات المالية
 * Diagnose Financial Vouchers API Issue
 */

console.log('💰 بدء تشخيص مشكلة APIs السندات المالية...\n');

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

async function diagnoseVouchersAPIIssue() {
  try {
    console.log('📊 فحص الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ الاتصال بقاعدة البيانات ناجح\n');

    // فحص الجداول المتعلقة بالسندات
    console.log('🔍 فحص الجداول المتعلقة بالسندات...');
    
    const tables = ['vouchers', 'receipts', 'payments', 'payment_vouchers', 'receipt_vouchers'];
    
    for (const tableName of tables) {
      try {
        const tableExists = await sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = '${tableName}'
          )
        `, { type: sequelize.QueryTypes.SELECT });
        
        if (tableExists[0].exists) {
          console.log(`✅ جدول ${tableName} موجود`);
          
          // فحص بنية الجدول
          const columns = await sequelize.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = '${tableName}'
            ORDER BY ordinal_position
          `, { type: sequelize.QueryTypes.SELECT });
          
          console.log(`   📋 أعمدة جدول ${tableName}:`);
          columns.forEach(col => {
            console.log(`     - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
          });
          
          // فحص عدد السجلات
          const count = await sequelize.query(`
            SELECT COUNT(*) as count FROM ${tableName}
          `, { type: sequelize.QueryTypes.SELECT });
          
          console.log(`   📊 عدد السجلات: ${count[0].count}\n`);
        } else {
          console.log(`❌ جدول ${tableName} غير موجود\n`);
        }
      } catch (error) {
        console.log(`❌ خطأ في فحص جدول ${tableName}: ${error.message}\n`);
      }
    }

    // محاولة تشغيل استعلامات مشابهة لما في APIs
    console.log('🧪 اختبار استعلامات مشابهة لـ APIs...');
    
    // اختبار استعلام receipts
    console.log('\n📄 اختبار استعلام receipts...');
    try {
      const receiptsQuery = `
        SELECT 
          r.id, r."receiptNo", r."receiptDate", r.amount, r.status,
          s.name as supplier_name
        FROM receipts r
        LEFT JOIN suppliers s ON r."supplierId" = s.id
        WHERE r."isActive" = true
        ORDER BY r."receiptDate" DESC
        LIMIT 10
      `;
      
      const receipts = await sequelize.query(receiptsQuery, { type: sequelize.QueryTypes.SELECT });
      console.log(`✅ استعلام receipts نجح - ${receipts.length} سجل`);
      
      if (receipts.length > 0) {
        console.log('   📋 عينة من النتائج:');
        receipts.slice(0, 3).forEach((receipt, index) => {
          console.log(`     ${index + 1}. ${receipt.receiptNo || receipt.id} - ${receipt.amount} د.ل`);
        });
      }
    } catch (error) {
      console.log(`❌ خطأ في استعلام receipts: ${error.message}`);
    }

    // اختبار استعلام payments
    console.log('\n💳 اختبار استعلام payments...');
    try {
      const paymentsQuery = `
        SELECT 
          p.id, p."paymentNumber", p.date, p.amount, p.status,
          s.name as supplier_name
        FROM payments p
        LEFT JOIN suppliers s ON p."supplierId" = s.id
        WHERE p."isActive" = true
        ORDER BY p.date DESC
        LIMIT 10
      `;
      
      const payments = await sequelize.query(paymentsQuery, { type: sequelize.QueryTypes.SELECT });
      console.log(`✅ استعلام payments نجح - ${payments.length} سجل`);
      
      if (payments.length > 0) {
        console.log('   📋 عينة من النتائج:');
        payments.slice(0, 3).forEach((payment, index) => {
          console.log(`     ${index + 1}. ${payment.paymentNumber || payment.id} - ${payment.amount} د.ل`);
        });
      }
    } catch (error) {
      console.log(`❌ خطأ في استعلام payments: ${error.message}`);
    }

    // اختبار استعلام vouchers
    console.log('\n🎫 اختبار استعلام vouchers...');
    try {
      const vouchersQuery = `
        SELECT 
          v.id, v."voucherNumber", v.type, v.date, v.amount,
          a.name as account_name
        FROM vouchers v
        LEFT JOIN accounts a ON v."accountId" = a.id
        WHERE v."isActive" = true
        ORDER BY v.date DESC
        LIMIT 10
      `;
      
      const vouchers = await sequelize.query(vouchersQuery, { type: sequelize.QueryTypes.SELECT });
      console.log(`✅ استعلام vouchers نجح - ${vouchers.length} سجل`);
      
      if (vouchers.length > 0) {
        console.log('   📋 عينة من النتائج:');
        vouchers.slice(0, 3).forEach((voucher, index) => {
          console.log(`     ${index + 1}. ${voucher.voucherNumber || voucher.id} - ${voucher.type} - ${voucher.amount} د.ل`);
        });
      }
    } catch (error) {
      console.log(`❌ خطأ في استعلام vouchers: ${error.message}`);
    }

    // فحص النماذج المطلوبة
    console.log('\n🏗️ فحص النماذج المطلوبة...');
    
    const requiredModels = ['Receipt', 'Payment', 'Account', 'Supplier', 'User'];
    
    for (const modelName of requiredModels) {
      try {
        // محاولة استدعاء النموذج
        const testQuery = await sequelize.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name LIKE '%${modelName.toLowerCase()}%'
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log(`📋 جداول متعلقة بـ ${modelName}:`);
        testQuery.forEach(table => {
          console.log(`   - ${table.table_name}`);
        });
      } catch (error) {
        console.log(`❌ خطأ في فحص ${modelName}: ${error.message}`);
      }
    }

    // فحص المستخدمين والصلاحيات
    console.log('\n👥 فحص المستخدمين والصلاحيات...');
    try {
      const users = await sequelize.query(`
        SELECT id, username, role, "isActive"
        FROM users 
        WHERE "isActive" = true
        ORDER BY "createdAt" DESC
        LIMIT 5
      `, { type: sequelize.QueryTypes.SELECT });
      
      console.log(`📋 المستخدمون النشطون (${users.length}):`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.username} - ${user.role}`);
      });
    } catch (error) {
      console.log(`❌ خطأ في فحص المستخدمين: ${error.message}`);
    }

    console.log('\n🎯 تشخيص مكتمل!');
    
  } catch (error) {
    console.error('❌ خطأ في تشخيص مشكلة APIs السندات:', error.message);
    console.error('📋 تفاصيل الخطأ:', error);
  } finally {
    await sequelize.close();
  }
}

// تشغيل التشخيص
diagnoseVouchersAPIIssue();
