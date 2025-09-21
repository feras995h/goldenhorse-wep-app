import { Sequelize, DataTypes, Op } from 'sequelize';

/**
 * فحص هيكل جدول payments
 * Check payments table structure
 */

console.log('🔍 بدء فحص هيكل جدول payments...\n');

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

async function checkPaymentsTableStructure() {
  try {
    console.log('📊 فحص الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ الاتصال بقاعدة البيانات ناجح\n');

    // 1. فحص هيكل جدول payments
    console.log('🔍 فحص هيكل جدول payments...');
    
    const paymentsColumns = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'payments'
      ORDER BY ordinal_position
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log(`✅ تم العثور على ${paymentsColumns.length} عمود في جدول payments:`);
    paymentsColumns.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.column_name} (${col.data_type}) - nullable: ${col.is_nullable} - default: ${col.column_default || 'none'}`);
    });

    // 2. فحص البيانات الموجودة
    console.log('\n📊 فحص البيانات الموجودة في جدول payments...');
    
    const paymentsData = await sequelize.query(`
      SELECT * FROM payments ORDER BY "createdAt" DESC LIMIT 3
    `, { type: sequelize.QueryTypes.SELECT });
    
    if (paymentsData.length > 0) {
      console.log(`✅ تم العثور على ${paymentsData.length} سجل في جدول payments:`);
      paymentsData.forEach((payment, index) => {
        console.log(`  ${index + 1}. ID: ${payment.id}`);
        console.log(`     - Payment Number: ${payment.paymentNumber || payment.paymentNo || 'غير موجود'}`);
        console.log(`     - Amount: ${payment.amount} د.ل`);
        console.log(`     - Status: ${payment.status}`);
        console.log(`     - Created: ${payment.createdAt}`);
      });
    } else {
      console.log('⚠️ لا توجد بيانات في جدول payments');
    }

    // 3. فحص هيكل جدول receipts للمقارنة
    console.log('\n🔍 فحص هيكل جدول receipts للمقارنة...');
    
    const receiptsColumns = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'receipts'
      ORDER BY ordinal_position
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log(`✅ تم العثور على ${receiptsColumns.length} عمود في جدول receipts:`);
    receiptsColumns.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.column_name} (${col.data_type}) - nullable: ${col.is_nullable} - default: ${col.column_default || 'none'}`);
    });

    // 4. مقارنة الأعمدة
    console.log('\n📋 مقارنة الأعمدة بين payments و receipts...');
    
    const paymentsColumnNames = paymentsColumns.map(col => col.column_name);
    const receiptsColumnNames = receiptsColumns.map(col => col.column_name);
    
    console.log('\n🔍 الأعمدة الموجودة في receipts وغير موجودة في payments:');
    receiptsColumnNames.forEach(colName => {
      if (!paymentsColumnNames.includes(colName)) {
        console.log(`  ❌ ${colName}`);
      }
    });
    
    console.log('\n🔍 الأعمدة الموجودة في payments وغير موجودة في receipts:');
    paymentsColumnNames.forEach(colName => {
      if (!receiptsColumnNames.includes(colName)) {
        console.log(`  ➕ ${colName}`);
      }
    });

    // 5. اختبار إنشاء payment بالأعمدة الصحيحة
    console.log('\n🧪 اختبار إنشاء payment بالأعمدة الصحيحة...');
    
    // تحديد اسم العمود الصحيح للرقم
    const numberColumn = paymentsColumnNames.includes('paymentNumber') ? 'paymentNumber' : 
                        paymentsColumnNames.includes('paymentNo') ? 'paymentNo' : 
                        paymentsColumnNames.includes('number') ? 'number' : null;
    
    if (numberColumn) {
      console.log(`✅ تم العثور على عمود الرقم: ${numberColumn}`);
      
      // الحصول على آخر رقم
      const lastPaymentQuery = `SELECT "${numberColumn}" FROM payments ORDER BY "createdAt" DESC LIMIT 1`;
      const lastPaymentResult = await sequelize.query(lastPaymentQuery, { type: sequelize.QueryTypes.SELECT });
      
      const nextNumber = lastPaymentResult.length > 0 
        ? parseInt(lastPaymentResult[0][numberColumn].replace(/\D/g, '')) + 1 
        : 1;
      const paymentNumber = `PAY-${String(nextNumber).padStart(6, '0')}`;
      
      console.log(`📄 Payment Number: ${paymentNumber}`);
      
      // إنشاء payment تجريبي
      const paymentId = await sequelize.query(`SELECT gen_random_uuid() as id`, { type: sequelize.QueryTypes.SELECT });
      const newPaymentId = paymentId[0].id;
      
      // بناء query بناءً على الأعمدة الموجودة
      const requiredColumns = ['id', numberColumn, 'amount', 'status', 'createdAt', 'updatedAt'];
      const optionalColumns = ['accountId', 'partyType', 'paymentDate', 'paymentMethod', 'currency', 'exchangeRate', 'createdBy', 'completedBy', 'isActive'];
      
      const availableOptionalColumns = optionalColumns.filter(col => paymentsColumnNames.includes(col));
      const allColumns = [...requiredColumns, ...availableOptionalColumns];
      
      console.log(`📋 الأعمدة المتاحة للإدراج: ${allColumns.join(', ')}`);
      
      const placeholders = allColumns.map((_, index) => `$${index + 1}`).join(', ');
      const columnsStr = allColumns.map(col => `"${col}"`).join(', ');
      
      const createPaymentQuery = `
        INSERT INTO payments (${columnsStr})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const values = [
        newPaymentId,
        paymentNumber,
        250.0,
        'completed',
        new Date(),
        new Date()
      ];
      
      // إضافة القيم الاختيارية
      availableOptionalColumns.forEach(col => {
        switch(col) {
          case 'accountId':
            values.push(null);
            break;
          case 'partyType':
            values.push('supplier');
            break;
          case 'paymentDate':
            values.push(new Date().toISOString().split('T')[0]);
            break;
          case 'paymentMethod':
            values.push('cash');
            break;
          case 'currency':
            values.push('LYD');
            break;
          case 'exchangeRate':
            values.push(1.0);
            break;
          case 'createdBy':
          case 'completedBy':
            values.push('3caff949-70f1-46f8-a31b-888ca22801a0'); // UUID صحيح
            break;
          case 'isActive':
            values.push(true);
            break;
          default:
            values.push(null);
        }
      });
      
      const paymentResult = await sequelize.query(createPaymentQuery, {
        bind: values,
        type: sequelize.QueryTypes.INSERT
      });
      
      console.log('✅ تم إنشاء payment تجريبي بنجاح:');
      console.log(`   💳 Payment ID: ${paymentResult[0][0].id}`);
      console.log(`   🏷️ Payment Number: ${paymentResult[0][0][numberColumn]}`);
      console.log(`   💰 Amount: ${paymentResult[0][0].amount} د.ل`);
      
      // حذف الـ payment التجريبي
      await sequelize.query(`DELETE FROM payments WHERE id = $1`, {
        bind: [newPaymentId],
        type: sequelize.QueryTypes.DELETE
      });
      
      console.log('✅ تم حذف الـ payment التجريبي');
      
    } else {
      console.log('❌ لم يتم العثور على عمود الرقم في جدول payments');
    }

    console.log('\n🎉 انتهاء فحص هيكل جدول payments');
    console.log('\n📋 الملخص:');
    console.log(`  📊 عدد الأعمدة في payments: ${paymentsColumns.length}`);
    console.log(`  📊 عدد الأعمدة في receipts: ${receiptsColumns.length}`);
    console.log(`  🔍 عمود الرقم في payments: ${numberColumn || 'غير موجود'}`);
    console.log('\n🚀 يمكن الآن استخدام الأعمدة الصحيحة!');
    
  } catch (error) {
    console.error('❌ خطأ في فحص هيكل جدول payments:', error.message);
    console.error('📋 تفاصيل الخطأ:', error);
  } finally {
    await sequelize.close();
  }
}

// تشغيل الفحص
checkPaymentsTableStructure();
