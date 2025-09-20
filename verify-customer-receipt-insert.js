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
    console.log('✅ اتصال DB للاختبار');

    // pick a customer and a user
    const { rows: cust } = await client.query('SELECT id, name FROM customers ORDER BY name ASC LIMIT 1');
    if (cust.length === 0) throw new Error('لا يوجد عملاء');
    const customer = cust[0];

    const { rows: usr } = await client.query('SELECT id, name FROM users ORDER BY name ASC LIMIT 1');
    if (usr.length === 0) throw new Error('لا يوجد مستخدمين');
    const user = usr[0];

    // generate identifiers
    const { rows: docRows } = await client.query("SELECT generate_document_number('receipt') AS doc");
    const documentNo = docRows[0].doc;
    const receiptNo = 'RCPT-VERIFY-' + Math.floor(100000 + Math.random()*900000);

    // try insert a customer receipt WITHOUT supplierId
    const { rows: ins } = await client.query(`
      INSERT INTO receipts (
        id, "receiptNo", "partyType", "partyId", "receiptDate", amount, "paymentMethod",
        status, currency, "exchangeRate", remarks, "createdBy", posted_status, posted_by, posted_at, document_no,
        "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), $1, 'customer', $2, CURRENT_DATE, 10.00, 'cash',
        'completed', 'LYD', 1, 'verify insert no supplierId', $3, 'posted', $3, NOW(), $4,
        NOW(), NOW()
      ) RETURNING id
    `, [receiptNo, customer.id, user.id, documentNo]);

    const newId = ins[0].id;
    console.log('✅ تم الإدراج بنجاح، id=', newId);

    // cleanup
    await client.query('DELETE FROM receipts WHERE id = $1', [newId]);
    console.log('🧹 تم الحذف بعد التحقق');

  } catch (e) {
    console.error('❌ فشل التحقق:', e.message);
  } finally {
    await client.end();
  }
}

run().catch(console.error);

