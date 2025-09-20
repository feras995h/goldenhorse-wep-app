'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update status enum to include new values
    await queryInterface.changeColumn('invoices', 'status', {
      type: Sequelize.ENUM('draft', 'sent', 'paid', 'partially_paid', 'unpaid', 'overdue', 'cancelled'),
      defaultValue: 'draft'
    });

    // Add new fields for enhanced invoice management
    await queryInterface.addColumn('invoices', 'outstandingAmount', {
      type: Sequelize.DECIMAL(15, 2),
      defaultValue: 0.00
    });

    await queryInterface.addColumn('invoices', 'accountId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      }
    });

    await queryInterface.addColumn('invoices', 'currency', {
      type: Sequelize.STRING(3),
      defaultValue: 'LYD'
    });

    await queryInterface.addColumn('invoices', 'exchangeRate', {
      type: Sequelize.DECIMAL(10, 6),
      defaultValue: 1.000000
    });

    await queryInterface.addColumn('invoices', 'createdBy', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    });

    // Add indexes for new fields
    await queryInterface.addIndex('invoices', ['outstandingAmount']);
    await queryInterface.addIndex('invoices', ['accountId']);
    await queryInterface.addIndex('invoices', ['createdBy']);

    // Update existing invoices to set outstandingAmount
    await queryInterface.sequelize.query(`
      UPDATE invoices 
      SET outstandingAmount = total - paidAmount 
      WHERE outstandingAmount IS NULL OR outstandingAmount = 0
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('invoices', ['outstandingAmount']);
    await queryInterface.removeIndex('invoices', ['accountId']);
    await queryInterface.removeIndex('invoices', ['createdBy']);

    // Remove columns
    await queryInterface.removeColumn('invoices', 'outstandingAmount');
    await queryInterface.removeColumn('invoices', 'accountId');
    await queryInterface.removeColumn('invoices', 'currency');
    await queryInterface.removeColumn('invoices', 'exchangeRate');
    await queryInterface.removeColumn('invoices', 'createdBy');

    // Restore original status enum
    await queryInterface.changeColumn('invoices', 'status', {
      type: Sequelize.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled'),
      defaultValue: 'draft'
    });
  }
};
