'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if columns exist before adding
    const salesInvoicesColumns = await queryInterface.describeTable('sales_invoices');
    const shippingInvoicesColumns = await queryInterface.describeTable('shipping_invoices');

    // Add outstanding_amount to sales_invoices if not exists
    if (!salesInvoicesColumns.outstanding_amount) {
      await queryInterface.addColumn('sales_invoices', 'outstanding_amount', {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00,
        allowNull: false,
      });

      // Add index for performance
      await queryInterface.addIndex('sales_invoices', ['outstanding_amount']);

      // Update existing records to set outstanding_amount
      await queryInterface.sequelize.query(`
        UPDATE sales_invoices 
        SET outstanding_amount = GREATEST(0, total - paid_amount) 
        WHERE outstanding_amount IS NULL OR outstanding_amount = 0
      `);
    }

    // Add shipment_id to shipping_invoices if not exists
    if (!shippingInvoicesColumns.shipment_id) {
      await queryInterface.addColumn('shipping_invoices', 'shipment_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'shipments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });

      // Add index for foreign key
      await queryInterface.addIndex('shipping_invoices', ['shipment_id']);
    }

    // Add outstanding_amount to shipping_invoices if not exists
    if (!shippingInvoicesColumns.outstanding_amount) {
      await queryInterface.addColumn('shipping_invoices', 'outstanding_amount', {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00,
        allowNull: false,
      });

      // Add index for performance
      await queryInterface.addIndex('shipping_invoices', ['outstanding_amount']);

      // Update existing records to set outstanding_amount
      await queryInterface.sequelize.query(`
        UPDATE shipping_invoices 
        SET outstanding_amount = GREATEST(0, total - paid_amount) 
        WHERE outstanding_amount IS NULL OR outstanding_amount = 0
      `);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const salesInvoicesColumns = await queryInterface.describeTable('sales_invoices');
    const shippingInvoicesColumns = await queryInterface.describeTable('shipping_invoices');

    // Remove columns if they exist
    if (salesInvoicesColumns.outstanding_amount) {
      await queryInterface.removeIndex('sales_invoices', ['outstanding_amount']);
      await queryInterface.removeColumn('sales_invoices', 'outstanding_amount');
    }

    if (shippingInvoicesColumns.shipment_id) {
      await queryInterface.removeIndex('shipping_invoices', ['shipment_id']);
      await queryInterface.removeColumn('shipping_invoices', 'shipment_id');
    }

    if (shippingInvoicesColumns.outstanding_amount) {
      await queryInterface.removeIndex('shipping_invoices', ['outstanding_amount']);
      await queryInterface.removeColumn('shipping_invoices', 'outstanding_amount');
    }
  }
};

