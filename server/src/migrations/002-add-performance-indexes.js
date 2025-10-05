export async function up(queryInterface, Sequelize) {
  console.log('🚀 Adding performance indexes...');

  // Helpers for idempotency
  const columnExists = async (table, column) => {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = :table AND column_name = :column",
      { replacements: { table, column } }
    );
    return rows.length > 0;
  };

  const indexExists = async (name) => {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = :name",
      { replacements: { name } }
    );
    return rows.length > 0;
  };

  const ensureIndex = async (table, columns, name, options = {}) => {
    const cols = Array.isArray(columns) ? columns : [String(columns)];
    // Verify all columns exist
    for (const col of cols) {
      if (!(await columnExists(table, col))) return;
    }
    if (await indexExists(name)) return;
    await queryInterface.addIndex(table, cols, { name, ...options });
  };

  // Financial tables indexes
  await ensureIndex('accounts', ['code'], 'idx_accounts_code', { unique: true });
  await ensureIndex('accounts', ['type'], 'idx_accounts_type');
  await ensureIndex('accounts', ['isActive'], 'idx_accounts_isActive');
  await ensureIndex('accounts', ['parentId'], 'idx_accounts_parentId');

  // GL Entries indexes
  await ensureIndex('gl_entries', ['postingDate'], 'idx_gl_entries_postingDate');
  await ensureIndex('gl_entries', ['accountId'], 'idx_gl_entries_accountId');
  await ensureIndex('gl_entries', ['voucherType'], 'idx_gl_entries_voucherType');
  await ensureIndex('gl_entries', ['voucherNo'], 'idx_gl_entries_voucherNo');
  await ensureIndex('gl_entries', ['createdAt'], 'idx_gl_entries_createdAt');

  // Journal Entries indexes
  await ensureIndex('journal_entries', ['date'], 'idx_journal_entries_date');
  await ensureIndex('journal_entries', ['status'], 'idx_journal_entries_status');
  await ensureIndex('journal_entries', ['type'], 'idx_journal_entries_type');
  await ensureIndex('journal_entries', ['createdBy'], 'idx_journal_entries_createdBy');

  // Customers indexes
  await ensureIndex('customers', ['code'], 'idx_customers_code', { unique: true });
  await ensureIndex('customers', ['name'], 'idx_customers_name');
  await ensureIndex('customers', ['isActive'], 'idx_customers_isActive');
  await ensureIndex('customers', ['customerType'], 'idx_customers_customerType');
  await ensureIndex('customers', ['balance'], 'idx_customers_balance');

  // Suppliers indexes
  await ensureIndex('suppliers', ['code'], 'idx_suppliers_code', { unique: true });
  await ensureIndex('suppliers', ['name'], 'idx_suppliers_name');
  await ensureIndex('suppliers', ['isActive'], 'idx_suppliers_isActive');

  // Sales Invoices indexes
  await ensureIndex('sales_invoices', ['invoiceNumber'], 'idx_sales_invoices_invoiceNumber', { unique: true });
  await ensureIndex('sales_invoices', ['date'], 'idx_sales_invoices_date');
  await ensureIndex('sales_invoices', ['customerId'], 'idx_sales_invoices_customerId');
  await ensureIndex('sales_invoices', ['status'], 'idx_sales_invoices_status');
  await ensureIndex('sales_invoices', ['paymentStatus'], 'idx_sales_invoices_paymentStatus');
  await ensureIndex('sales_invoices', ['total'], 'idx_sales_invoices_total');
  await ensureIndex('sales_invoices', ['createdAt'], 'idx_sales_invoices_createdAt');

  // Shipping Invoices indexes (guard against snake_case variants)
  await ensureIndex('shipping_invoices', ['invoiceNumber'], 'idx_shipping_invoices_invoiceNumber', { unique: true });
  await ensureIndex('shipping_invoices', ['date'], 'idx_shipping_invoices_date');
  await ensureIndex('shipping_invoices', ['customerId'], 'idx_shipping_invoices_customerId');
  await ensureIndex('shipping_invoices', ['shipmentId'], 'idx_shipping_invoices_shipmentId');
  await ensureIndex('shipping_invoices', ['total'], 'idx_shipping_invoices_total');

  // Payments indexes
  await ensureIndex('payments', ['date'], 'idx_payments_date');
  await ensureIndex('payments', ['supplierId'], 'idx_payments_supplierId');
  await ensureIndex('payments', ['amount'], 'idx_payments_amount');
  await ensureIndex('payments', ['createdAt'], 'idx_payments_createdAt');

  // Receipts indexes
  await ensureIndex('receipts', ['date'], 'idx_receipts_date');
  await ensureIndex('receipts', ['customerId'], 'idx_receipts_customerId');
  await ensureIndex('receipts', ['amount'], 'idx_receipts_amount');
  await ensureIndex('receipts', ['createdAt'], 'idx_receipts_createdAt');

  // Users indexes
  await ensureIndex('users', ['username'], 'idx_users_username', { unique: true });
  await ensureIndex('users', ['email'], 'idx_users_email', { unique: true });
  await ensureIndex('users', ['isActive'], 'idx_users_isActive');
  await ensureIndex('users', ['role'], 'idx_users_role');
  // Shipments indexes
  await ensureIndex('shipments', ['trackingNumber'], 'idx_shipments_trackingNumber');
  await ensureIndex('shipments', ['date'], 'idx_shipments_date');
  await ensureIndex('shipments', ['status'], 'idx_shipments_status');
  await ensureIndex('shipments', ['shippingCost'], 'idx_shipments_shippingCost');

  // Composite indexes for common queries
  await ensureIndex('gl_entries', ['accountId', 'postingDate'], 'idx_gl_entries_accountId_postingDate');
  await ensureIndex('sales_invoices', ['customerId', 'date'], 'idx_sales_invoices_customerId_date');
  await ensureIndex('sales_invoices', ['status', 'paymentStatus'], 'idx_sales_invoices_status_paymentStatus');
  await ensureIndex('customers', ['isActive', 'customerType'], 'idx_customers_isActive_customerType');

  console.log('✅ Performance indexes added successfully');
}

export async function down(queryInterface, Sequelize) {
  console.log('🗑️ Removing performance indexes...');

  // Remove all indexes
  const indexes = [
    'idx_accounts_code',
    'idx_accounts_type',
    'idx_accounts_isActive',
    'idx_accounts_parentId',
    'idx_gl_entries_postingDate',
    'idx_gl_entries_accountId',
    'idx_gl_entries_voucherType',
    'idx_gl_entries_voucherNo',
    'idx_gl_entries_createdAt',
    'idx_journal_entries_date',
    'idx_journal_entries_status',
    'idx_journal_entries_type',
    'idx_journal_entries_createdBy',
    'idx_customers_code',
    'idx_customers_name',
    'idx_customers_isActive',
    'idx_customers_customerType',
    'idx_customers_balance',
    'idx_suppliers_code',
    'idx_suppliers_name',
    'idx_suppliers_isActive',
    'idx_sales_invoices_invoiceNumber',
    'idx_sales_invoices_date',
    'idx_sales_invoices_customerId',
    'idx_sales_invoices_status',
    'idx_sales_invoices_paymentStatus',
    'idx_sales_invoices_total',
    'idx_sales_invoices_createdAt',
    'idx_shipping_invoices_invoiceNumber',
    'idx_shipping_invoices_date',
    'idx_shipping_invoices_customerId',
    'idx_shipping_invoices_shipmentId',
    'idx_shipping_invoices_total',
    'idx_payments_date',
    'idx_payments_supplierId',
    'idx_payments_amount',
    'idx_payments_createdAt',
    'idx_receipts_date',
    'idx_receipts_customerId',
    'idx_receipts_amount',
    'idx_receipts_createdAt',
    'idx_users_username',
    'idx_users_email',
    'idx_users_isActive',
    'idx_users_role',
    'idx_shipments_trackingNumber',
    'idx_shipments_date',
    'idx_shipments_status',
    'idx_shipments_shippingCost',
    'idx_gl_entries_accountId_postingDate',
    'idx_sales_invoices_customerId_date',
    'idx_sales_invoices_status_paymentStatus',
    'idx_customers_isActive_customerType'
  ];

  for (const indexName of indexes) {
    try {
      await queryInterface.removeIndex('accounts', indexName);
    } catch (error) {
      // Index might not exist, continue
    }
  }

  console.log('✅ Performance indexes removed');
}
