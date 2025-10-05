export const up = async (queryInterface, Sequelize) => {
    // Make supplierId nullable
    await queryInterface.changeColumn('receipts', 'supplierId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'suppliers',
        key: 'id'
      }
    });

    // Add new fields for enhanced voucher management
    await queryInterface.addColumn('receipts', 'accountId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      }
    });

    await queryInterface.addColumn('receipts', 'partyType', {
      type: Sequelize.ENUM('supplier', 'customer', 'employee', 'account'),
      allowNull: true,
      defaultValue: 'supplier'
    });

    await queryInterface.addColumn('receipts', 'partyId', {
      type: Sequelize.UUID,
      allowNull: true
    });

    await queryInterface.addColumn('receipts', 'voucherType', {
      type: Sequelize.ENUM('receipt', 'payment'),
      allowNull: false,
      defaultValue: 'receipt'
    });

    // Add indexes for new fields
    await queryInterface.addIndex('receipts', ['accountId']);
    await queryInterface.addIndex('receipts', ['partyType']);
    await queryInterface.addIndex('receipts', ['partyId']);
    await queryInterface.addIndex('receipts', ['voucherType']);
};

export const down = async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('receipts', ['accountId']);
    await queryInterface.removeIndex('receipts', ['partyType']);
    await queryInterface.removeIndex('receipts', ['partyId']);
    await queryInterface.removeIndex('receipts', ['voucherType']);

    // Remove columns
    await queryInterface.removeColumn('receipts', 'accountId');
    await queryInterface.removeColumn('receipts', 'partyType');
    await queryInterface.removeColumn('receipts', 'partyId');
    await queryInterface.removeColumn('receipts', 'voucherType');

    // Restore supplierId as not nullable
    await queryInterface.changeColumn('receipts', 'supplierId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'suppliers',
        key: 'id'
      }
    });
};
