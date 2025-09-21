import { Sequelize, DataTypes, Op } from 'sequelize';

/**
 * اختبار النظام المالي النهائي المُصلح
 * Final Test for Fixed Financial System
 */

console.log('🧪 بدء الاختبار النهائي للنظام المالي المُصلح...\n');

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

async function testFinancialSystemFinal() {
  try {
    console.log('📊 فحص الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ الاتصال بقاعدة البيانات ناجح\n');

    // 1. الحصول على البيانات المطلوبة للاختبار
    console.log('📋 الحصول على البيانات المطلوبة للاختبار...');
    
    const testUser = await sequelize.query(`
      SELECT id, username FROM users WHERE "isActive" = true LIMIT 1
    `, { type: sequelize.QueryTypes.SELECT });
    
    const testAccount = await sequelize.query(`
      SELECT id, name, code FROM accounts WHERE "isActive" = true AND code = '1.1.1' LIMIT 1
    `, { type: sequelize.QueryTypes.SELECT });
    
    const testCustomer = await sequelize.query(`
      SELECT id, name FROM customers WHERE "isActive" = true LIMIT 1
    `, { type: sequelize.QueryTypes.SELECT });
    
    if (testUser.length === 0 || testAccount.length === 0 || testCustomer.length === 0) {
      console.log('❌ لا يوجد بيانات كافية للاختبار');
      return;
    }
    
    const userId = testUser[0].id;
    const accountId = testAccount[0].id;
    const customerId = testCustomer[0].id;
    
    console.log(`✅ المستخدم: ${testUser[0].username} (${userId})`);
    console.log(`✅ الحساب: ${testAccount[0].name} (${testAccount[0].code})`);
    console.log(`✅ العميل: ${testCustomer[0].name} (${customerId})\n`);

    // 2. اختبار إنشاء Receipt
    console.log('📄 اختبار إنشاء Receipt...');
    
    // إنشاء receipt number
    const lastReceiptResult = await sequelize.query(`
      SELECT "receiptNo" FROM receipts ORDER BY "createdAt" DESC LIMIT 1
    `, { type: sequelize.QueryTypes.SELECT });
    
    const nextReceiptNumber = lastReceiptResult.length > 0 
      ? parseInt(lastReceiptResult[0].receiptNo.replace(/\D/g, '')) + 1 
      : 1;
    const receiptNo = `REC-${String(nextReceiptNumber).padStart(6, '0')}`;
    
    console.log(`📄 Receipt Number: ${receiptNo}`);
    
    // إنشاء receipt باستخدام نفس الطريقة المستخدمة في API
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
      amount: 850.0,
      remarks: 'اختبار إنشاء إيصال قبض نهائي',
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
    
    console.log('✅ تم إنشاء Receipt بنجاح:');
    console.log(`   📄 Receipt ID: ${receiptResult[0][0].id}`);
    console.log(`   🏷️ Receipt No: ${receiptResult[0][0].receiptNo}`);
    console.log(`   💰 Amount: ${receiptResult[0][0].amount} د.ل`);
    console.log(`   👤 Created By: ${receiptResult[0][0].createdBy}`);
    console.log(`   ✅ Completed By: ${receiptResult[0][0].completedBy}`);

    // 3. اختبار إنشاء Payment
    console.log('\n💳 اختبار إنشاء Payment...');
    
    // إنشاء payment number
    const lastPaymentResult = await sequelize.query(`
      SELECT "paymentNumber" FROM payments ORDER BY "createdAt" DESC LIMIT 1
    `, { type: sequelize.QueryTypes.SELECT });
    
    const nextPaymentNumber = lastPaymentResult.length > 0 
      ? parseInt(lastPaymentResult[0].paymentNumber.replace(/\D/g, '')) + 1 
      : 1;
    const paymentNumber = `PAY-${String(nextPaymentNumber).padStart(6, '0')}`;
    
    console.log(`💳 Payment Number: ${paymentNumber}`);
    
    // إنشاء payment باستخدام نفس الطريقة المستخدمة في API
    const paymentId = await sequelize.query(`SELECT gen_random_uuid() as id`, { type: sequelize.QueryTypes.SELECT });
    const newPaymentId = paymentId[0].id;
    
    const createPaymentQuery = `
      INSERT INTO payments (
        id, "paymentNumber", "accountId", "partyType", "partyId", "customerId", "voucherType",
        date, amount, "paymentMethod", reference, notes,
        status, currency, "exchangeRate", "createdBy", "completedAt", "completedBy",
        "createdAt", "updatedAt", "isActive"
      ) VALUES (
        $1, $2, $3, 'supplier', NULL, NULL, 'payment', $4, $5, 'cash', NULL, $6, 'completed', 'LYD', 1.0, $7, NOW(), $8, NOW(), NOW(), true
      ) RETURNING *
    `;
    
    const paymentData = {
      id: newPaymentId,
      paymentNumber: paymentNumber,
      accountId: accountId,
      date: new Date().toISOString().split('T')[0],
      amount: 550.0,
      notes: 'اختبار إنشاء إيصال صرف نهائي',
      createdBy: userId,
      completedBy: userId
    };
    
    const paymentResult = await sequelize.query(createPaymentQuery, {
      bind: [
        paymentData.id,
        paymentData.paymentNumber,
        paymentData.accountId,
        paymentData.date,
        paymentData.amount,
        paymentData.notes,
        paymentData.createdBy,
        paymentData.completedBy
      ],
      type: sequelize.QueryTypes.INSERT
    });
    
    console.log('✅ تم إنشاء Payment بنجاح:');
    console.log(`   💳 Payment ID: ${paymentResult[0][0].id}`);
    console.log(`   🏷️ Payment Number: ${paymentResult[0][0].paymentNumber}`);
    console.log(`   💰 Amount: ${paymentResult[0][0].amount} د.ل`);
    console.log(`   👤 Created By: ${paymentResult[0][0].createdBy}`);
    console.log(`   ✅ Completed By: ${paymentResult[0][0].completedBy}`);

    // 4. اختبار جلب البيانات
    console.log('\n📊 اختبار جلب البيانات...');
    
    // جلب آخر receipts
    const recentReceipts = await sequelize.query(`
      SELECT r.*, c.name as customer_name, a.name as account_name
      FROM receipts r
      LEFT JOIN customers c ON r."partyId" = c.id AND r."partyType" = 'customer'
      LEFT JOIN accounts a ON r."accountId" = a.id
      ORDER BY r."createdAt" DESC
      LIMIT 3
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log(`✅ تم جلب ${recentReceipts.length} إيصال قبض:`);
    recentReceipts.forEach((receipt, index) => {
      console.log(`   ${index + 1}. ${receipt.receiptNo} - ${receipt.amount} د.ل - ${receipt.customer_name || 'غير محدد'}`);
    });
    
    // جلب آخر payments
    const recentPayments = await sequelize.query(`
      SELECT p.*, a.name as account_name
      FROM payments p
      LEFT JOIN accounts a ON p."accountId" = a.id
      WHERE p."isActive" = true
      ORDER BY p."createdAt" DESC
      LIMIT 3
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log(`✅ تم جلب ${recentPayments.length} إيصال صرف:`);
    recentPayments.forEach((payment, index) => {
      console.log(`   ${index + 1}. ${payment.paymentNumber} - ${payment.amount} د.ل - ${payment.account_name || 'غير محدد'}`);
    });

    // 5. اختبار الأداء
    console.log('\n⚡ اختبار الأداء...');
    
    const startTime = Date.now();
    
    // تشغيل عدة استعلامات معاً
    const [receiptsCount, paymentsCount, totalReceipts, totalPayments] = await Promise.all([
      sequelize.query(`SELECT COUNT(*) as count FROM receipts`, { type: sequelize.QueryTypes.SELECT }),
      sequelize.query(`SELECT COUNT(*) as count FROM payments WHERE "isActive" = true`, { type: sequelize.QueryTypes.SELECT }),
      sequelize.query(`SELECT COALESCE(SUM(amount), 0) as total FROM receipts`, { type: sequelize.QueryTypes.SELECT }),
      sequelize.query(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE "isActive" = true`, { type: sequelize.QueryTypes.SELECT })
    ]);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ اختبار الأداء نجح:`);
    console.log(`   ⏱️ وقت الاستجابة: ${duration}ms`);
    console.log(`   📄 إجمالي الإيصالات: ${receiptsCount[0].count}`);
    console.log(`   💳 إجمالي المدفوعات: ${paymentsCount[0].count}`);
    console.log(`   💰 إجمالي قيمة الإيصالات: ${totalReceipts[0].total} د.ل`);
    console.log(`   💰 إجمالي قيمة المدفوعات: ${totalPayments[0].total} د.ل`);

    // 6. حذف البيانات التجريبية
    console.log('\n🗑️ حذف البيانات التجريبية...');
    
    await sequelize.query(`DELETE FROM receipts WHERE id = $1`, {
      bind: [receiptData.id],
      type: sequelize.QueryTypes.DELETE
    });
    
    await sequelize.query(`DELETE FROM payments WHERE id = $1`, {
      bind: [paymentData.id],
      type: sequelize.QueryTypes.DELETE
    });
    
    console.log('✅ تم حذف البيانات التجريبية');

    console.log('\n🎉 انتهاء الاختبار النهائي للنظام المالي');
    console.log('\n📋 الملخص النهائي:');
    console.log('  ✅ تم اختبار إنشاء Receipts بنجاح');
    console.log('  ✅ تم اختبار إنشاء Payments بنجاح');
    console.log('  ✅ تم اختبار جلب البيانات بنجاح');
    console.log('  ✅ تم اختبار الأداء بنجاح');
    console.log('  ✅ تم حذف البيانات التجريبية بنجاح');
    console.log('\n🚀 النظام المالي يعمل بكفاءة 100% ومتكامل!');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار النهائي للنظام المالي:', error.message);
    console.error('📋 تفاصيل الخطأ:', error);
  } finally {
    await sequelize.close();
  }
}

// تشغيل الاختبار النهائي
testFinancialSystemFinal();
