'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. sales_returns.approvedBy
      await queryInterface.changeColumn('sales_returns', 'approvedBy', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }, { transaction });

      // 2. warehouse_release_orders.approvedBy
      await queryInterface.changeColumn('warehouse_release_orders', 'approvedBy', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }, { transaction });

      // 3. account_mappings.createdBy
      await queryInterface.changeColumn('account_mappings', 'createdBy', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }, { transaction });

      // 4. account_mappings.updatedBy
      await queryInterface.changeColumn('account_mappings', 'updatedBy', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }, { transaction });

      // 5. gl_entries.cancelledBy
      await queryInterface.changeColumn('gl_entries', 'cancelledBy', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }, { transaction });

      // 6. gl_entries.createdBy
      await queryInterface.changeColumn('gl_entries', 'createdBy', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }, { transaction });

      // 7. sales_invoices.postedBy
      await queryInterface.changeColumn('sales_invoices', 'postedBy', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }, { transaction });

      // 8. sales_invoices.createdBy
      await queryInterface.changeColumn('sales_invoices', 'createdBy', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }, { transaction });

      // 9. receipts.createdBy
      await queryInterface.changeColumn('receipts', 'createdBy', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }, { transaction });

      // 10. receipts.completedBy
      await queryInterface.changeColumn('receipts', 'completedBy', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }, { transaction });

      // 11. suppliers.createdBy
      await queryInterface.changeColumn('suppliers', 'createdBy', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Revert changes in reverse order

      // 11. suppliers.createdBy
      await queryInterface.changeColumn('suppliers', 'createdBy', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }, { transaction });

      // 10. receipts.completedBy
      await queryInterface.changeColumn('receipts', 'completedBy', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }, { transaction });

      // 9. receipts.createdBy
      await queryInterface.changeColumn('receipts', 'createdBy', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }, { transaction });

      // 8. sales_invoices.createdBy
      await queryInterface.changeColumn('sales_invoices', 'createdBy', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }, { transaction });

      // 7. sales_invoices.postedBy
      await queryInterface.changeColumn('sales_invoices', 'postedBy', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }, { transaction });

      // 6. gl_entries.createdBy
      await queryInterface.changeColumn('gl_entries', 'createdBy', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }, { transaction });

      // 5. gl_entries.cancelledBy
      await queryInterface.changeColumn('gl_entries', 'cancelledBy', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }, { transaction });

      // 4. account_mappings.updatedBy
      await queryInterface.changeColumn('account_mappings', 'updatedBy', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }, { transaction });

      // 3. account_mappings.createdBy
      await queryInterface.changeColumn('account_mappings', 'createdBy', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }, { transaction });

      // 2. warehouse_release_orders.approvedBy
      await queryInterface.changeColumn('warehouse_release_orders', 'approvedBy', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }, { transaction });

      // 1. sales_returns.approvedBy
      await queryInterface.changeColumn('sales_returns', 'approvedBy', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};