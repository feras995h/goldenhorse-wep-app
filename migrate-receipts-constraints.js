import pkg from 'pg';
const { Client } = pkg;

const dbConfig = {
  connectionString:
    'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres',
};

async function run() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('✅ متصل بقاعدة البيانات');

    // 1) DROP NOT NULL on supplierId
    console.log('🔧 تعديل receipts."supplierId" إلى قابل للإفراغ...');
    await client.query('ALTER TABLE receipts ALTER COLUMN "supplierId" DROP NOT NULL');

    // 2) Add conditional constraint: supplierId required only when partyType = 'supplier'
    console.log('🔧 إضافة قيد receipts_supplier_required إن لم يكن موجوداً...');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'receipts_supplier_required'
        ) THEN
          ALTER TABLE receipts ADD CONSTRAINT receipts_supplier_required
            CHECK (("partyType" <> 'supplier') OR ("supplierId" IS NOT NULL));
        END IF;
      END $$;
    `);

    // 3) Add conditional constraint: partyId required only when partyType = 'customer'
    console.log('🔧 إضافة قيد receipts_customer_required إن لم يكن موجوداً...');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'receipts_customer_required'
        ) THEN
          ALTER TABLE receipts ADD CONSTRAINT receipts_customer_required
            CHECK (("partyType" <> 'customer') OR ("partyId" IS NOT NULL));
        END IF;
      END $$;
    `);

    console.log('🎉 تم تنفيذ تعديل القيود بنجاح');
  } catch (e) {
    console.error('❌ خطأ:', e.message);
    console.error(e.stack);
  } finally {
    await client.end();
  }
}

run().catch(console.error);

