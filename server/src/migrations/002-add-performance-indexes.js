export async function up(queryInterface, Sequelize) {
  console.log('🚀 Adding performance indexes...');

  // Financial tables indexes
  await queryInterface.addIndex('accounts', ['code'], {
    name: 'idx_accounts_code',
    unique: true
  });

  await queryInterface.addIndex('accounts', ['type'], {
    name: 'idx_accounts_type'
  });

  await queryInterface.addIndex('accounts', ['isActive'], {
    name: 'idx_accounts_isActive'
  });

  await queryInterface.addIndex('accounts', ['parentId'], {
    name: 'idx_accounts_parentId'
  });

  // GL Entries indexes
  await queryInterface.addIndex('gl_entries', ['postingDate'], {
    name: 'idx_gl_entries_postingDate'
  });

  await queryInterface.addIndex('gl_entries', ['accountId'], {
    name: 'idx_gl_entries_accountId'
  });

  await queryInterface.addIndex('gl_entries', ['voucherType'], {
    name: 'idx_gl_entries_voucherType'
  });

  await queryInterface.addIndex('gl_entries', ['voucherNo'], {
    name: 'idx_gl_entries_voucherNo'
  });

  await queryInterface.addIndex('gl_entries', ['createdAt'], {
    name: 'idx_gl_entries_createdAt'
  });

  // Journal Entries indexes
  await queryInterface.addIndex('journal_entries', ['date'], {
    name: 'idx_journal_entries_date'
  });

  await queryInterface.addIndex('journal_entries', ['status'], {
    name: 'idx_journal_entries_status'
  });

  await queryInterface.addIndex('journal_entries', ['type'], {
    name: 'idx_journal_entries_type'
  });

  await queryInterface.addIndex('journal_entries', ['createdBy'], {
    name: 'idx_journal_entries_createdBy'
  });

  // Customers indexes
  await queryInterface.addIndex('customers', ['code'], {
    name: 'idx_customers_code',
    unique: true
  });

  await queryInterface.addIndex('customers', ['name'], {
    name: 'idx_customers_name'
  });

  await queryInterface.addIndex('customers', ['isActive'], {
    name: 'idx_customers_isActive'
  });

  await queryInterface.addIndex('customers', ['customerType'], {
    name: 'idx_customers_customerType'
  });

  await queryInterface.addIndex('customers', ['balance'], {
    name: 'idx_customers_balance'
  });

  // Suppliers indexes
  await queryInterface.addIndex('suppliers', ['code'], {
    name: 'idx_suppliers_code',
    unique: true
  });

  await queryInterface.addIndex('suppliers', ['name'], {
    name: 'idx_suppliers_name'
  });

  await queryInterface.addIndex('suppliers', ['isActive'], {
    name: 'idx_suppliers_isActive'
  });

  // Sales Invoices indexes
  await queryInterface.addIndex('sales_invoices', ['invoiceNumber'], {
    name: 'idx_sales_invoices_invoiceNumber',
    unique: true
  });

  await queryInterface.addIndex('sales_invoices', ['date'], {
    name: 'idx_sales_invoices_date'
  });

  await queryInterface.addIndex('sales_invoices', ['customerId'], {
    name: 'idx_sales_invoices_customerId'
  });

  await queryInterface.addIndex('sales_invoices', ['status'], {
    name: 'idx_sales_invoices_status'
  });

  await queryInterface.addIndex('sales_invoices', ['paymentStatus'], {
    name: 'idx_sales_invoices_paymentStatus'
  });

  await queryInterface.addIndex('sales_invoices', ['total'], {
    name: 'idx_sales_invoices_total'
  });

  await queryInterface.addIndex('sales_invoices', ['createdAt'], {
    name: 'idx_sales_invoices_createdAt'
  });

  // Shipping Invoices indexes
  await queryInterface.addIndex('shipping_invoices', ['invoiceNumber'], {
    name: 'idx_shipping_invoices_invoiceNumber',
    unique: true
  });

  await queryInterface.addIndex('shipping_invoices', ['date'], {
    name: 'idx_shipping_invoices_date'
  });

  await queryInterface.addIndex('shipping_invoices', ['customerId'], {
    name: 'idx_shipping_invoices_customerId'
  });

  await queryInterface.addIndex('shipping_invoices', ['shipmentId'], {
    name: 'idx_shipping_invoices_shipmentId'
  });

  await queryInterface.addIndex('shipping_invoices', ['total'], {
    name: 'idx_shipping_invoices_total'
  });

  // Payments indexes
  await queryInterface.addIndex('payments', ['date'], {
    name: 'idx_payments_date'
  });

  await queryInterface.addIndex('payments', ['supplierId'], {
    name: 'idx_payments_supplierId'
  });

  await queryInterface.addIndex('payments', ['amount'], {
    name: 'idx_payments_amount'
  });

  await queryInterface.addIndex('payments', ['createdAt'], {
    name: 'idx_payments_createdAt'
  });

  // Receipts indexes
  await queryInterface.addIndex('receipts', ['date'], {
    name: 'idx_receipts_date'
  });

  await queryInterface.addIndex('receipts', ['customerId'], {
    name: 'idx_receipts_customerId'
  });

  await queryInterface.addIndex('receipts', ['amount'], {
    name: 'idx_receipts_amount'
  });

  await queryInterface.addIndex('receipts', ['createdAt'], {
    name: 'idx_receipts_createdAt'
  });

  // Users indexes
  await queryInterface.addIndex('users', ['username'], {
    name: 'idx_users_username',
    unique: true
  });

  await queryInterface.addIndex('users', ['email'], {
    name: 'idx_users_email',
    unique: true
  });

  await queryInterface.addIndex('users', ['isActive'], {
    name: 'idx_users_isActive'
  });

  await queryInterface.addIndex('users', ['role'], {
    name: 'idx_users_role'
  });

  // Shipments indexes
  await queryInterface.addIndex('shipments', ['trackingNumber'], {
    name: 'idx_shipments_trackingNumber'
  });

  await queryInterface.addIndex('shipments', ['date'], {
    name: 'idx_shipments_date'
  });

  await queryInterface.addIndex('shipments', ['status'], {
    name: 'idx_shipments_status'
  });

  await queryInterface.addIndex('shipments', ['shippingCost'], {
    name: 'idx_shipments_shippingCost'
  });

  // Composite indexes for common queries
  await queryInterface.addIndex('gl_entries', ['accountId', 'postingDate'], {
    name: 'idx_gl_entries_accountId_postingDate'
  });

  await queryInterface.addIndex('sales_invoices', ['customerId', 'date'], {
    name: 'idx_sales_invoices_customerId_date'
  });

  await queryInterface.addIndex('sales_invoices', ['status', 'paymentStatus'], {
    name: 'idx_sales_invoices_status_paymentStatus'
  });

  await queryInterface.addIndex('customers', ['isActive', 'customerType'], {
    name: 'idx_customers_isActive_customerType'
  });

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
