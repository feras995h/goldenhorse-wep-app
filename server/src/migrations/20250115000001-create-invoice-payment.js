export const up = async (queryInterface, Sequelize) => {
    await queryInterface.createTable('invoice_payments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      invoiceId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'invoices',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      paymentId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'payments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      allocatedAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'LYD'
      },
      exchangeRate: {
        type: Sequelize.DECIMAL(10, 6),
        defaultValue: 1.000000
      },
      allocationDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      settlementOrder: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      isFullySettled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      remainingAmount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      isReversed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      reversedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      reversedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      reversalReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('invoice_payments', ['invoiceId']);
    await queryInterface.addIndex('invoice_payments', ['paymentId']);
    await queryInterface.addIndex('invoice_payments', ['allocationDate']);
    await queryInterface.addIndex('invoice_payments', ['settlementOrder']);
    await queryInterface.addIndex('invoice_payments', ['isFullySettled']);
    await queryInterface.addIndex('invoice_payments', ['isReversed']);
    await queryInterface.addIndex('invoice_payments', ['invoiceId', 'paymentId', 'settlementOrder'], {
      unique: true,
      name: 'unique_invoice_payment_settlement'
    });
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.dropTable('invoice_payments');
};
