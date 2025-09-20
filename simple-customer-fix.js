import { Client } from 'pg';

console.log('🔧 بدء إصلاح مشكلة إنشاء العملاء...');

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: false
});

try {
  console.log('🔗 الاتصال بقاعدة البيانات...');
  await client.connect();
  console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

  // إصلاح 1: تفعيل uuid-ossp extension
  console.log('\n🔧 تفعيل uuid-ossp extension...');
  await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  console.log('✅ تم تفعيل uuid-ossp extension');

  // إصلاح 2: إنشاء دالة توليد كود العميل
  console.log('\n🔧 إنشاء دالة توليد كود العميل...');
  const triggerFunction = `
    CREATE OR REPLACE FUNCTION generate_customer_code()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.code IS NULL OR NEW.code = '' THEN
        SELECT COALESCE(
          'C' || LPAD((
            COALESCE(
              MAX(CAST(SUBSTRING(code FROM 2) AS INTEGER)), 0
            ) + 1
          )::TEXT, 6, '0'),
          'C000001'
        ) INTO NEW.code
        FROM customers 
        WHERE code ~ '^C[0-9]{6}$';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;

  await client.query(triggerFunction);
  console.log('✅ تم إنشاء دالة توليد كود العميل');

  // إصلاح 3: إنشاء trigger
  console.log('\n🔧 إنشاء trigger...');
  const trigger = `
    DROP TRIGGER IF EXISTS trigger_generate_customer_code ON customers;
    CREATE TRIGGER trigger_generate_customer_code
      BEFORE INSERT ON customers
      FOR EACH ROW
      EXECUTE FUNCTION generate_customer_code();
  `;

  await client.query(trigger);
  console.log('✅ تم إنشاء trigger لتوليد كود العميل');

  // اختبار 4: إنشاء عميل تجريبي
  console.log('\n🧪 اختبار إنشاء عميل تجريبي...');
  const testResult = await client.query(`
    INSERT INTO customers (
      id, name, "nameEn", type, email, phone, 
      "creditLimit", "paymentTerms", currency, "isActive", balance,
      "createdAt", "updatedAt"
    ) VALUES (
      uuid_generate_v4(), 'عميل تجريبي', 'Test Customer', 'individual', 
      'test@example.com', '0912345678', 1000, 30, 'LYD', true, 0,
      NOW(), NOW()
    ) RETURNING id, code, name;
  `);

  console.log('✅ تم إنشاء العميل التجريبي بنجاح');
  console.log(`   - ID: ${testResult.rows[0].id}`);
  console.log(`   - Code: ${testResult.rows[0].code}`);
  console.log(`   - Name: ${testResult.rows[0].name}`);

  // حذف العميل التجريبي
  await client.query('DELETE FROM customers WHERE id = $1', [testResult.rows[0].id]);
  console.log('🗑️  تم حذف العميل التجريبي');

  console.log('\n🎉 تم إكمال إصلاح مشكلة إنشاء العملاء بنجاح!');
  console.log('✅ النظام الآن جاهز لإنشاء العملاء');

} catch (error) {
  console.error('❌ خطأ في إصلاح مشكلة العملاء:', error.message);
  console.error('التفاصيل:', error.detail || 'لا توجد تفاصيل إضافية');
} finally {
  await client.end();
  console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
}
