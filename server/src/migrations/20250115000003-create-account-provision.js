'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('account_provisions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      mainAccountId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'accounts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      provisionAccountId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'accounts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      provisionType: {
        type: Sequelize.ENUM(
          'doubtful_debts',
          'depreciation',
          'warranty',
          'bad_debts',
          'inventory_obsolescence',
          'legal_claims',
          'employee_benefits',
          'tax_provision',
          'other'
        ),
        allowNull: false
      },
      provisionRate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      fixedAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      calculationMethod: {
        type: Sequelize.ENUM('percentage', 'fixed_amount', 'manual'),
        allowNull: false,
        defaultValue: 'percentage'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      autoCalculate: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      calculationFrequency: {
        type: Sequelize.ENUM('monthly', 'quarterly', 'annually', 'manual'),
        defaultValue: 'monthly'
      },
      lastCalculationDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      nextCalculationDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      currentProvisionAmount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
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
      lastUpdatedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
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
    await queryInterface.addIndex('account_provisions', ['mainAccountId']);
    await queryInterface.addIndex('account_provisions', ['provisionAccountId']);
    await queryInterface.addIndex('account_provisions', ['provisionType']);
    await queryInterface.addIndex('account_provisions', ['isActive']);
    await queryInterface.addIndex('account_provisions', ['autoCalculate']);
    await queryInterface.addIndex('account_provisions', ['nextCalculationDate']);
    await queryInterface.addIndex('account_provisions', ['mainAccountId', 'provisionType'], {
      unique: true,
      name: 'unique_account_provision_type'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('account_provisions');
  }
};
