export const up = async (queryInterface, Sequelize) => {
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

  if (!(await columnExists('sales_invoices', 'outstandingAmount'))) {
    await queryInterface.addColumn('sales_invoices', 'outstandingAmount', {
      type: Sequelize.DECIMAL(15, 2),
      defaultValue: 0.00,
      allowNull: false,
    });
  }

  if (!(await indexExists('sales_invoices_outstandingAmount'))) {
    await queryInterface.addIndex('sales_invoices', ['outstandingAmount'], { name: 'sales_invoices_outstandingAmount' });
  }

  // Update existing records to set outstandingAmount using available columns
  const hasTotalAmount = await columnExists('sales_invoices', 'totalAmount');
  const totalExpr = hasTotalAmount ? 'COALESCE("totalAmount",0)' : 'COALESCE(total,0)';
  const hasPaidAmount = await columnExists('sales_invoices', 'paidAmount');
  const paidExpr = hasPaidAmount ? 'COALESCE("paidAmount",0)' : 'COALESCE(paidAmount,0)';
  await queryInterface.sequelize.query(
    `UPDATE "sales_invoices" SET "outstandingAmount" = GREATEST(0, ${totalExpr} - ${paidExpr})`
  );
};

export const down = async (queryInterface, Sequelize) => {
  const columnExists = async (table, column) => {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = :table AND column_name = :column",
      { replacements: { table, column } }
    );
    return rows.length > 0;
  };

  try { await queryInterface.removeIndex('sales_invoices', 'sales_invoices_outstandingAmount'); } catch (_) {}
  if (await columnExists('sales_invoices', 'outstandingAmount')) {
    await queryInterface.removeColumn('sales_invoices', 'outstandingAmount');
  }
};
