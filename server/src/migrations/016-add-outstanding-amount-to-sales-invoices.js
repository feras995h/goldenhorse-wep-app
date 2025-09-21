'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('sales_invoices', 'outstandingAmount', {
      type: Sequelize.DECIMAL(15, 2),
      defaultValue: 0.00,
      allowNull: false,
    });

    // Add index for performance
    await queryInterface.addIndex('sales_invoices', ['outstandingAmount']);

    // Update existing records to set outstandingAmount
    await queryInterface.sequelize.query(`
      UPDATE sales_invoices 
      SET outstandingAmount = GREATEST(0, total - paidAmount) 
      WHERE outstandingAmount IS NULL OR outstandingAmount = 0
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('sales_invoices', ['outstandingAmount']);
    await queryInterface.removeColumn('sales_invoices', 'outstandingAmount');
  }
};
