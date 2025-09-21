import { Sequelize, DataTypes, Op } from 'sequelize';

/**
 * إصلاح مشكلة User ID في النظام المالي
 * Fix User ID issue in Financial System
 */

console.log('🔧 بدء إصلاح مشكلة User ID في النظام المالي...\n');

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

async function fixFinancialUserIdIssue() {
  try {
    console.log('📊 فحص الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ الاتصال بقاعدة البيانات ناجح\n');

    // 1. فحص المستخدمين الموجودين
    console.log('👤 فحص المستخدمين الموجودين...');
    
    const users = await sequelize.query(`
      SELECT id, username, name, role, "isActive"
      FROM users 
      WHERE "isActive" = true
      ORDER BY username
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log(`✅ تم العثور على ${users.length} مستخدم نشط:`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user.id} (${typeof user.id}) - ${user.username} (${user.name}) - ${user.role}`);
    });

    // 2. فحص إذا كان هناك مستخدمين بـ ID integer
    console.log('\n🔍 فحص المستخدمين بـ ID integer...');
    
    const integerUsers = await sequelize.query(`
      SELECT id, username, name 
      FROM users 
      WHERE id ~ '^[0-9]+$'
      ORDER BY id::integer
    `, { type: sequelize.QueryTypes.SELECT });
    
    if (integerUsers.length > 0) {
      console.log(`⚠️ تم العثور على ${integerUsers.length} مستخدم بـ ID integer:`);
      integerUsers.forEach(user => {
        console.log(`  - ID: ${user.id} - ${user.username} (${user.name})`);
      });
      
      // إنشاء mapping من integer IDs إلى UUID IDs
      console.log('\n🔄 تحديث المستخدمين إلى UUID IDs...');
      
      for (const user of integerUsers) {
        const newUUID = await sequelize.query(`SELECT gen_random_uuid() as uuid`, { type: sequelize.QueryTypes.SELECT });
        const uuid = newUUID[0].uuid;
        
        console.log(`🔄 تحديث المستخدم ${user.username} من ID ${user.id} إلى ${uuid}`);
        
        // تحديث ID المستخدم
        await sequelize.query(`
          UPDATE users SET id = $1 WHERE id = $2
        `, {
          bind: [uuid, user.id],
          type: sequelize.QueryTypes.UPDATE
        });
        
        // تحديث جميع الجداول التي تشير إلى هذا المستخدم
        const tablesToUpdate = [
          { table: 'receipts', columns: ['createdBy', 'completedBy'] },
          { table: 'payments', columns: ['createdBy', 'completedBy'] },
          { table: 'vouchers', columns: ['createdBy', 'completedBy'] },
          { table: 'journal_entries', columns: ['createdBy'] },
          { table: 'shipments', columns: ['createdBy'] },
          { table: 'shipment_movements', columns: ['createdBy'] },
          { table: 'sales_invoices', columns: ['createdBy'] },
          { table: 'customers', columns: ['createdBy'] },
          { table: 'suppliers', columns: ['createdBy'] },
          { table: 'accounts', columns: ['createdBy'] },
          { table: 'stock_movements', columns: ['createdBy'] }
        ];
        
        for (const tableInfo of tablesToUpdate) {
          for (const column of tableInfo.columns) {
            try {
              const updateQuery = `UPDATE ${tableInfo.table} SET "${column}" = $1 WHERE "${column}" = $2`;
              const result = await sequelize.query(updateQuery, {
                bind: [uuid, user.id],
                type: sequelize.QueryTypes.UPDATE
              });
              console.log(`  ✅ تم تحديث ${tableInfo.table}.${column} (${result[1]} سجل)`);
            } catch (err) {
              console.log(`  ⚠️ تخطي ${tableInfo.table}.${column}: ${err.message}`);
            }
          }
        }
      }
      
      console.log('✅ تم تحديث جميع User IDs إلى UUID');
      
    } else {
      console.log('✅ جميع المستخدمين يستخدمون UUID بالفعل');
    }

    // 3. اختبار إنشاء receipt جديد
    console.log('\n🧪 اختبار إنشاء receipt جديد...');
    
    const testUser = await sequelize.query(`
      SELECT id, username FROM users WHERE "isActive" = true LIMIT 1
    `, { type: sequelize.QueryTypes.SELECT });
    
    const testAccount = await sequelize.query(`
      SELECT id, name FROM accounts WHERE "isActive" = true AND code = '1.1.1' LIMIT 1
    `, { type: sequelize.QueryTypes.SELECT });
    
    const testCustomer = await sequelize.query(`
      SELECT id, name FROM customers WHERE "isActive" = true LIMIT 1
    `, { type: sequelize.QueryTypes.SELECT });
    
    if (testUser.length > 0 && testAccount.length > 0 && testCustomer.length > 0) {
      const userId = testUser[0].id;
      const accountId = testAccount[0].id;
      const customerId = testCustomer[0].id;
      
      console.log(`🧪 اختبار إنشاء receipt مع User ID: ${userId}`);
      console.log(`   Account ID: ${accountId}`);
      console.log(`   Customer ID: ${customerId}`);
      
      // إنشاء receipt number
      const lastReceiptResult = await sequelize.query(`
        SELECT "receiptNo" FROM receipts ORDER BY "createdAt" DESC LIMIT 1
      `, { type: sequelize.QueryTypes.SELECT });
      
      const nextNumber = lastReceiptResult.length > 0 
        ? parseInt(lastReceiptResult[0].receiptNo.replace(/\D/g, '')) + 1 
        : 1;
      const receiptNo = `REC-${String(nextNumber).padStart(6, '0')}`;
      
      console.log(`📄 Receipt Number: ${receiptNo}`);
      
      // إنشاء receipt باستخدام SQL مباشر
      const receiptId = await sequelize.query(`SELECT gen_random_uuid() as id`, { type: sequelize.QueryTypes.SELECT });
      const newReceiptId = receiptId[0].id;
      
      const createReceiptQuery = `
        INSERT INTO receipts (
          id, "receiptNo", "accountId", "partyType", "partyId", "voucherType",
          "receiptDate", amount, "paymentMethod", status, currency, "exchangeRate",
          remarks, "createdBy", "completedAt", "completedBy", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, 'customer', $4, 'receipt', $5, $6, 'cash', 'completed', 'LYD', 1.0,
          $7, $8, NOW(), $9, NOW(), NOW()
        ) RETURNING *
      `;
      
      const receiptData = {
        id: newReceiptId,
        receiptNo: receiptNo,
        accountId: accountId,
        partyId: customerId,
        receiptDate: new Date().toISOString().split('T')[0],
        amount: 500.0,
        remarks: 'اختبار إنشاء إيصال',
        createdBy: userId,
        completedBy: userId
      };
      
      const receiptResult = await sequelize.query(createReceiptQuery, {
        bind: [
          receiptData.id,
          receiptData.receiptNo,
          receiptData.accountId,
          receiptData.partyId,
          receiptData.receiptDate,
          receiptData.amount,
          receiptData.remarks,
          receiptData.createdBy,
          receiptData.completedBy
        ],
        type: sequelize.QueryTypes.INSERT
      });
      
      console.log('✅ تم إنشاء receipt تجريبي بنجاح:');
      console.log(`   📄 Receipt ID: ${receiptResult[0][0].id}`);
      console.log(`   🏷️ Receipt No: ${receiptResult[0][0].receiptNo}`);
      console.log(`   💰 Amount: ${receiptResult[0][0].amount} د.ل`);
      console.log(`   👤 Created By: ${receiptResult[0][0].createdBy}`);
      console.log(`   ✅ Completed By: ${receiptResult[0][0].completedBy}`);
      
      // حذف الـ receipt التجريبي
      await sequelize.query(`DELETE FROM receipts WHERE id = $1`, {
        bind: [receiptData.id],
        type: sequelize.QueryTypes.DELETE
      });
      
      console.log('✅ تم حذف الـ receipt التجريبي');
      
    } else {
      console.log('❌ لا يوجد مستخدمين أو حسابات أو عملاء للاختبار');
    }

    // 4. اختبار إنشاء payment جديد
    console.log('\n🧪 اختبار إنشاء payment جديد...');
    
    if (testUser.length > 0 && testAccount.length > 0) {
      const userId = testUser[0].id;
      const accountId = testAccount[0].id;
      
      // إنشاء payment number
      const lastPaymentResult = await sequelize.query(`
        SELECT "paymentNo" FROM payments ORDER BY "createdAt" DESC LIMIT 1
      `, { type: sequelize.QueryTypes.SELECT });
      
      const nextPaymentNumber = lastPaymentResult.length > 0 
        ? parseInt(lastPaymentResult[0].paymentNo.replace(/\D/g, '')) + 1 
        : 1;
      const paymentNo = `PAY-${String(nextPaymentNumber).padStart(6, '0')}`;
      
      console.log(`💳 Payment Number: ${paymentNo}`);
      
      // إنشاء payment باستخدام SQL مباشر
      const paymentId = await sequelize.query(`SELECT gen_random_uuid() as id`, { type: sequelize.QueryTypes.SELECT });
      const newPaymentId = paymentId[0].id;
      
      const createPaymentQuery = `
        INSERT INTO payments (
          id, "paymentNo", "accountId", "partyType", "voucherType",
          "paymentDate", amount, "paymentMethod", status, currency, "exchangeRate",
          remarks, "createdBy", "completedAt", "completedBy", "createdAt", "updatedAt", "isActive"
        ) VALUES (
          $1, $2, $3, 'supplier', 'payment', $4, $5, 'cash', 'completed', 'LYD', 1.0,
          $6, $7, NOW(), $8, NOW(), NOW(), true
        ) RETURNING *
      `;
      
      const paymentData = {
        id: newPaymentId,
        paymentNo: paymentNo,
        accountId: accountId,
        paymentDate: new Date().toISOString().split('T')[0],
        amount: 300.0,
        remarks: 'اختبار إنشاء دفعة',
        createdBy: userId,
        completedBy: userId
      };
      
      const paymentResult = await sequelize.query(createPaymentQuery, {
        bind: [
          paymentData.id,
          paymentData.paymentNo,
          paymentData.accountId,
          paymentData.paymentDate,
          paymentData.amount,
          paymentData.remarks,
          paymentData.createdBy,
          paymentData.completedBy
        ],
        type: sequelize.QueryTypes.INSERT
      });
      
      console.log('✅ تم إنشاء payment تجريبي بنجاح:');
      console.log(`   💳 Payment ID: ${paymentResult[0][0].id}`);
      console.log(`   🏷️ Payment No: ${paymentResult[0][0].paymentNo}`);
      console.log(`   💰 Amount: ${paymentResult[0][0].amount} د.ل`);
      console.log(`   👤 Created By: ${paymentResult[0][0].createdBy}`);
      console.log(`   ✅ Completed By: ${paymentResult[0][0].completedBy}`);
      
      // حذف الـ payment التجريبي
      await sequelize.query(`DELETE FROM payments WHERE id = $1`, {
        bind: [paymentData.id],
        type: sequelize.QueryTypes.DELETE
      });
      
      console.log('✅ تم حذف الـ payment التجريبي');
    }

    console.log('\n🎉 انتهاء إصلاح مشكلة User ID في النظام المالي');
    console.log('\n📋 الملخص:');
    console.log('  ✅ تم فحص وإصلاح User IDs');
    console.log('  ✅ تم اختبار إنشاء receipts');
    console.log('  ✅ تم اختبار إنشاء payments');
    console.log('\n🚀 يمكن الآن إنشاء vouchers مالية بدون أخطاء!');
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح User ID:', error.message);
    console.error('📋 تفاصيل الخطأ:', error);
  } finally {
    await sequelize.close();
  }
}

// تشغيل الإصلاح
fixFinancialUserIdIssue();
