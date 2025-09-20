import { Client } from 'pg';

/**
 * سكريپت تشخيص مشكلة إنشاء العملاء
 */

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function debugCustomersIssue() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: false
  });

  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح\n');

    // فحص 1: هل جدول customers موجود؟
    console.log('🧪 فحص 1: التحقق من وجود جدول customers');
    try {
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'customers'
        );
      `);
      
      if (tableExists.rows[0].exists) {
        console.log('   ✅ جدول customers موجود');
      } else {
        console.log('   ❌ جدول customers غير موجود - هذه هي المشكلة!');
        return;
      }
    } catch (error) {
      console.log(`   ❌ خطأ في فحص الجدول: ${error.message}`);
      return;
    }

    // فحص 2: بنية جدول customers
    console.log('\n🧪 فحص 2: بنية جدول customers');
    try {
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        ORDER BY ordinal_position;
      `);
      
      console.log(`   📋 الأعمدة الموجودة (${columns.rows.length}):`);
      columns.rows.forEach(col => {
        console.log(`      - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(مطلوب)' : '(اختياري)'}`);
      });
    } catch (error) {
      console.log(`   ❌ خطأ في فحص بنية الجدول: ${error.message}`);
    }

    // فحص 3: الفهارس والقيود
    console.log('\n🧪 فحص 3: الفهارس والقيود');
    try {
      const constraints = await client.query(`
        SELECT constraint_name, constraint_type, column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'customers';
      `);
      
      console.log(`   🔒 القيود الموجودة (${constraints.rows.length}):`);
      constraints.rows.forEach(constraint => {
        console.log(`      - ${constraint.constraint_name}: ${constraint.constraint_type} على ${constraint.column_name}`);
      });
    } catch (error) {
      console.log(`   ❌ خطأ في فحص القيود: ${error.message}`);
    }

    // فحص 4: محاولة إنشاء عميل تجريبي
    console.log('\n🧪 فحص 4: محاولة إنشاء عميل تجريبي');
    try {
      const testCustomer = {
        id: 'test-customer-' + Date.now(),
        code: 'TEST-' + Date.now(),
        name: 'عميل تجريبي',
        nameEn: 'Test Customer',
        type: 'individual',
        email: 'test@example.com',
        phone: '0912345678',
        creditLimit: 1000,
        paymentTerms: 30,
        currency: 'LYD',
        isActive: true,
        balance: 0
      };

      const insertQuery = `
        INSERT INTO customers (
          id, code, name, "nameEn", type, email, phone, 
          "creditLimit", "paymentTerms", currency, "isActive", balance,
          "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
        ) RETURNING *;
      `;

      const result = await client.query(insertQuery, [
        testCustomer.id,
        testCustomer.code,
        testCustomer.name,
        testCustomer.nameEn,
        testCustomer.type,
        testCustomer.email,
        testCustomer.phone,
        testCustomer.creditLimit,
        testCustomer.paymentTerms,
        testCustomer.currency,
        testCustomer.isActive,
        testCustomer.balance
      ]);

      console.log('   ✅ تم إنشاء العميل التجريبي بنجاح');
      console.log(`      - ID: ${result.rows[0].id}`);
      console.log(`      - Code: ${result.rows[0].code}`);
      console.log(`      - Name: ${result.rows[0].name}`);

      // حذف العميل التجريبي
      await client.query('DELETE FROM customers WHERE id = $1', [testCustomer.id]);
      console.log('   🗑️  تم حذف العميل التجريبي');

    } catch (error) {
      console.log(`   ❌ فشل في إنشاء العميل التجريبي: ${error.message}`);
      console.log(`      التفاصيل: ${error.detail || 'لا توجد تفاصيل إضافية'}`);
    }

    // فحص 5: العملاء الموجودين
    console.log('\n🧪 فحص 5: العملاء الموجودين');
    try {
      const customers = await client.query('SELECT id, code, name, type, "isActive" FROM customers ORDER BY "createdAt" DESC LIMIT 5');
      
      console.log(`   👥 عدد العملاء: ${customers.rows.length}`);
      if (customers.rows.length > 0) {
        customers.rows.forEach(customer => {
          console.log(`      - ${customer.code}: ${customer.name} (${customer.type}) - ${customer.isActive ? 'نشط' : 'غير نشط'}`);
        });
      } else {
        console.log('      📝 لا يوجد عملاء في قاعدة البيانات');
      }
    } catch (error) {
      console.log(`   ❌ خطأ في جلب العملاء: ${error.message}`);
    }

    // فحص 6: فحص ENUM types
    console.log('\n🧪 فحص 6: فحص ENUM types');
    try {
      const enums = await client.query(`
        SELECT t.typname, e.enumlabel
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        WHERE t.typname LIKE '%customer%' OR t.typname LIKE '%type%'
        ORDER BY t.typname, e.enumsortorder;
      `);
      
      console.log(`   🏷️  ENUM types الموجودة (${enums.rows.length}):`);
      let currentType = '';
      enums.rows.forEach(enumRow => {
        if (enumRow.typname !== currentType) {
          currentType = enumRow.typname;
          console.log(`      - ${enumRow.typname}:`);
        }
        console.log(`        * ${enumRow.enumlabel}`);
      });
    } catch (error) {
      console.log(`   ❌ خطأ في فحص ENUM types: ${error.message}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 ملخص التشخيص');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ خطأ في تشخيص مشكلة العملاء:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

// تشغيل التشخيص
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('debug-customers-issue.js')) {
  debugCustomersIssue()
    .then(() => {
      console.log('\n✅ تم إكمال تشخيص مشكلة العملاء');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 فشل في تشخيص مشكلة العملاء:', error.message);
      process.exit(1);
    });
}

export { debugCustomersIssue };
