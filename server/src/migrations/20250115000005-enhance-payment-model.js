export const up = async (queryInterface, Sequelize) => {
    // Make customerId nullable
    await queryInterface.changeColumn('payments', 'customerId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id'
      }
    });

    // Add new fields for enhanced voucher management
    await queryInterface.addColumn('payments', 'accountId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      }
    });

    await queryInterface.addColumn('payments', 'partyType', {
      type: Sequelize.ENUM('supplier', 'customer', 'employee', 'account'),
      allowNull: true,
      defaultValue: 'customer'
    });

    await queryInterface.addColumn('payments', 'partyId', {
      type: Sequelize.UUID,
      allowNull: true
    });

    await queryInterface.addColumn('payments', 'voucherType', {
      type: Sequelize.ENUM('receipt', 'payment'),
      allowNull: false,
      defaultValue: 'payment'
    });

    await queryInterface.addColumn('payments', 'currency', {
      type: Sequelize.STRING(3),
      defaultValue: 'LYD'
    });

    await queryInterface.addColumn('payments', 'exchangeRate', {
      type: Sequelize.DECIMAL(10, 6),
      defaultValue: 1.000000
    });

    await queryInterface.addColumn('payments', 'createdBy', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    });

    await queryInterface.addColumn('payments', 'completedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('payments', 'completedBy', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    });

    // Add indexes for new fields
    await queryInterface.addIndex('payments', ['accountId']);
    await queryInterface.addIndex('payments', ['partyType']);
    await queryInterface.addIndex('payments', ['partyId']);
    await queryInterface.addIndex('payments', ['voucherType']);
    await queryInterface.addIndex('payments', ['createdBy']);
};

export const down = async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('payments', ['accountId']);
    await queryInterface.removeIndex('payments', ['partyType']);
    await queryInterface.removeIndex('payments', ['partyId']);
    await queryInterface.removeIndex('payments', ['voucherType']);
    await queryInterface.removeIndex('payments', ['createdBy']);

    // Remove columns
    await queryInterface.removeColumn('payments', 'accountId');
    await queryInterface.removeColumn('payments', 'partyType');
    await queryInterface.removeColumn('payments', 'partyId');
    await queryInterface.removeColumn('payments', 'voucherType');
    await queryInterface.removeColumn('payments', 'currency');
    await queryInterface.removeColumn('payments', 'exchangeRate');
    await queryInterface.removeColumn('payments', 'createdBy');
    await queryInterface.removeColumn('payments', 'completedAt');
    await queryInterface.removeColumn('payments', 'completedBy');

    // Restore customerId as not nullable
    await queryInterface.changeColumn('payments', 'customerId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      }
    });
};
