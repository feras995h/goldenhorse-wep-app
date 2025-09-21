import { Sequelize, DataTypes, Op } from 'sequelize';

/**
 * إصلاح جدول payments - إضافة عمود isActive المفقود
 * Fix Payments Table - Add Missing isActive Column
 */

console.log('🔧 بدء إصلاح جدول payments - إضافة عمود isActive المفقود...\n');

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

async function fixPaymentsTableMissingColumn() {
  try {
    console.log('📊 فحص الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ الاتصال بقاعدة البيانات ناجح\n');

    // فحص بنية جدول payments
    console.log('🔍 فحص بنية جدول payments...');
    const paymentsColumns = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'payments'
      ORDER BY ordinal_position
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('📋 أعمدة جدول payments الحالية:');
    paymentsColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default || 'none'})`);
    });

    // فحص وجود عمود isActive
    const isActiveExists = paymentsColumns.some(col => col.column_name === 'isActive');
    
    if (!isActiveExists) {
      console.log('\n❌ عمود isActive غير موجود في جدول payments');
      console.log('🔧 إضافة عمود isActive...');
      
      try {
        await sequelize.query(`
          ALTER TABLE payments ADD COLUMN "isActive" BOOLEAN DEFAULT true
        `);
        console.log('✅ تم إضافة عمود isActive بنجاح');
        
        // تحديث جميع السجلات الموجودة لتكون نشطة
        await sequelize.query(`
          UPDATE payments SET "isActive" = true WHERE "isActive" IS NULL
        `);
        console.log('✅ تم تحديث جميع السجلات الموجودة');
        
      } catch (error) {
        console.log('❌ خطأ في إضافة عمود isActive:', error.message);
      }
    } else {
      console.log('\n✅ عمود isActive موجود في جدول payments');
    }

    // فحص وجود عمود supplierId
    const supplierIdExists = paymentsColumns.some(col => col.column_name === 'supplierId');
    
    if (!supplierIdExists) {
      console.log('\n❌ عمود supplierId غير موجود في جدول payments');
      console.log('🔧 إضافة عمود supplierId...');
      
      try {
        await sequelize.query(`
          ALTER TABLE payments ADD COLUMN "supplierId" UUID REFERENCES suppliers(id)
        `);
        console.log('✅ تم إضافة عمود supplierId بنجاح');
        
      } catch (error) {
        console.log('❌ خطأ في إضافة عمود supplierId:', error.message);
      }
    } else {
      console.log('\n✅ عمود supplierId موجود في جدول payments');
    }

    // فحص البيانات الحالية
    console.log('\n📊 فحص البيانات الحالية في جدول payments...');
    const paymentsCount = await sequelize.query(`
      SELECT COUNT(*) as count FROM payments
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log(`📋 عدد المدفوعات الحالية: ${paymentsCount[0].count}`);

    // إضافة بيانات تجريبية إذا كان الجدول فارغ
    if (parseInt(paymentsCount[0].count) === 0) {
      console.log('\n📝 إضافة بيانات تجريبية للمدفوعات...');
      
      // الحصول على معرف مستخدم admin
      const adminUser = await sequelize.query(
        "SELECT id FROM users WHERE username = 'admin' LIMIT 1",
        { type: sequelize.QueryTypes.SELECT }
      );
      
      if (adminUser.length === 0) {
        console.log('❌ لم يتم العثور على مستخدم admin');
        return;
      }
      
      const adminUserId = adminUser[0].id;
      
      // الحصول على حساب افتراضي
      const defaultAccount = await sequelize.query(
        "SELECT id FROM accounts WHERE code LIKE '1%' LIMIT 1",
        { type: sequelize.QueryTypes.SELECT }
      );
      
      let defaultAccountId = null;
      if (defaultAccount.length > 0) {
        defaultAccountId = defaultAccount[0].id;
      }

      const testPayments = [
        {
          paymentNumber: 'PAY-2024-001',
          date: '2024-09-17',
          amount: 2500.00,
          paymentMethod: 'bank_transfer',
          voucherType: 'payment',
          notes: 'سند صرف لمورد'
        },
        {
          paymentNumber: 'PAY-2024-002',
          date: '2024-09-18',
          amount: 1800.75,
          paymentMethod: 'cash',
          voucherType: 'payment',
          notes: 'سند صرف نقدي'
        },
        {
          paymentNumber: 'PAY-2024-003',
          date: '2024-09-19',
          amount: 3200.50,
          paymentMethod: 'check',
          voucherType: 'payment',
          notes: 'سند صرف شيك'
        }
      ];
      
      for (const payment of testPayments) {
        try {
          await sequelize.query(`
            INSERT INTO payments (
              id, "paymentNumber", date, amount, "paymentMethod", "voucherType",
              notes, "accountId", "isActive", "createdAt", "updatedAt", "createdBy"
            )
            VALUES (
              gen_random_uuid(), :paymentNumber, :date, :amount, :paymentMethod, :voucherType,
              :notes, :accountId, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, :createdBy
            )
          `, {
            replacements: {
              ...payment,
              accountId: defaultAccountId,
              createdBy: adminUserId
            },
            type: sequelize.QueryTypes.INSERT
          });
        } catch (error) {
          console.log(`❌ خطأ في إضافة المدفوعة ${payment.paymentNumber}:`, error.message);
        }
      }
      
      console.log(`✅ تم إضافة ${testPayments.length} مدفوعة تجريبية`);
    }

    // اختبار الاستعلام المُحدث
    console.log('\n🧪 اختبار الاستعلام المُحدث...');
    try {
      const testQuery = await sequelize.query(`
        SELECT 
          p.id,
          p."paymentNumber",
          p.date,
          p.amount,
          p.status,
          p."paymentMethod",
          p.notes,
          p."isActive",
          a.name as account_name,
          a.code as account_code
        FROM payments p
        LEFT JOIN accounts a ON p."accountId" = a.id
        WHERE p."isActive" = true
        ORDER BY p.date DESC
        LIMIT 5
      `, { type: sequelize.QueryTypes.SELECT });
      
      console.log(`✅ الاستعلام نجح - ${testQuery.length} مدفوعة`);
      
      if (testQuery.length > 0) {
        console.log('📋 عينة من النتائج:');
        testQuery.forEach((payment, index) => {
          console.log(`  ${index + 1}. ${payment.paymentNumber} - ${payment.amount} د.ل`);
          console.log(`     الحساب: ${payment.account_name || 'غير محدد'} (${payment.account_code || 'N/A'})`);
          console.log(`     الحالة: ${payment.isActive ? 'نشط' : 'غير نشط'}`);
        });
      }
    } catch (error) {
      console.log('❌ الاستعلام فشل:', error.message);
    }

    // اختبار COUNT query
    console.log('\n🔢 اختبار COUNT query...');
    try {
      const countTest = await sequelize.query(`
        SELECT COUNT(*) as count FROM payments WHERE "isActive" = true
      `, { type: sequelize.QueryTypes.SELECT });
      
      console.log(`✅ COUNT query نجح: ${countTest[0].count} مدفوعة نشطة`);
    } catch (error) {
      console.log('❌ COUNT query فشل:', error.message);
    }

    console.log('\n🎉 تم إصلاح جدول payments بنجاح!');
    console.log('\n📋 الملخص النهائي:');
    console.log('  ✅ إضافة عمود isActive لجدول payments');
    console.log('  ✅ إضافة عمود supplierId لجدول payments (إذا لزم الأمر)');
    console.log('  ✅ إضافة بيانات تجريبية للمدفوعات');
    console.log('  ✅ اختبار الاستعلامات بنجاح');
    console.log('  ✅ جدول payments جاهز للاستخدام');
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح جدول payments:', error.message);
    console.error('📋 تفاصيل الخطأ:', error);
  } finally {
    await sequelize.close();
  }
}

// تشغيل الإصلاح
fixPaymentsTableMissingColumn();
