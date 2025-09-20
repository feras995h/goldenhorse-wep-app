// Add helpful indexes for AR allocations and receipts filters
// Safe to run multiple times (IF NOT EXISTS)

async function main() {
  try {
    const { sequelize } = await import('./server/src/models/index.js');
    console.log('📦 Connected to DB. Creating indexes...');

    const statements = [
      // ar_allocations: speed up joins and filters
      `CREATE INDEX IF NOT EXISTS idx_ar_allocations_invoice ON ar_allocations (invoice_id)`,
      `CREATE INDEX IF NOT EXISTS idx_ar_allocations_receipt ON ar_allocations (receipt_id)`,
      `CREATE INDEX IF NOT EXISTS idx_ar_allocations_created_at ON ar_allocations (created_at)`,

      // receipts: used by /api/ar/receipts filters and ordering
      `CREATE INDEX IF NOT EXISTS idx_receipts_party ON receipts ("partyType", "partyId")`,
      `CREATE INDEX IF NOT EXISTS idx_receipts_posted_status ON receipts (posted_status)`,
      `CREATE INDEX IF NOT EXISTS idx_receipts_receipt_date ON receipts ("receiptDate")`,
    ];

    for (const sql of statements) {
      console.log('→', sql);
      await sequelize.query(sql);
    }

    console.log('✅ Index creation done. Listing relevant indexes:');
    const [rows] = await sequelize.query(`
      SELECT schemaname, tablename, indexname, indexdef
      FROM pg_indexes
      WHERE tablename IN ('ar_allocations','receipts')
      ORDER BY tablename, indexname;
    `);
    rows.forEach(r => {
      console.log(`- ${r.tablename}.${r.indexname}: ${r.indexdef}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating indexes:', err.message || err);
    process.exit(1);
  }
}

main();

