'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔧 Fixing account_mappings table schema...');

    // Add all missing columns from the AccountMapping model
    const columnsToAdd = [
      {
        name: 'accountsReceivableAccount',
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'accounts',
          key: 'id'
        },
        comment: 'Account for accounts receivable'
      },
      {
        name: 'localCustomersAccount',
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'accounts',
          key: 'id'
        },
        comment: 'Account for local customers receivables'
      },
      {
        name: 'foreignCustomersAccount',
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'accounts',
          key: 'id'
        },
        comment: 'Account for foreign customers receivables'
      },
      {
        name: 'discountAccount',
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'accounts',
          key: 'id'
        },
        comment: 'Account for sales discounts'
      },
      {
        name: 'shippingRevenueAccount',
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'accounts',
          key: 'id'
        },
        comment: 'Account for shipping revenue'
      },
      {
        name: 'handlingFeeAccount',
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'accounts',
          key: 'id'
        },
        comment: 'Account for handling fees'
      },
      {
        name: 'customsClearanceAccount',
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'accounts',
          key: 'id'
        },
        comment: 'Account for customs clearance fees'
      },
      {
        name: 'insuranceAccount',
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'accounts',
          key: 'id'
        },
        comment: 'Account for insurance fees'
      },
      {
        name: 'storageAccount',
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'accounts',
          key: 'id'
        },
        comment: 'Account for storage fees'
      },
      {
        name: 'isActive',
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: true,
        comment: 'Whether this mapping is currently active'
      },
      {
        name: 'description',
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Description of this account mapping configuration'
      },
      {
        name: 'createdBy',
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      {
        name: 'updatedBy',
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }
    ];

    // Add each column if it doesn't exist
    for (const column of columnsToAdd) {
      try {
        await queryInterface.addColumn('account_mappings', column.name, column);
        console.log(`✅ Added column: ${column.name}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️ Column ${column.name} already exists, skipping...`);
        } else {
          console.error(`❌ Error adding column ${column.name}:`, error.message);
        }
      }
    }

    // Add indexes for better performance
    const indexesToAdd = [
      'accountsReceivableAccount',
      'localCustomersAccount',
      'foreignCustomersAccount',
      'discountAccount',
      'shippingRevenueAccount',
      'handlingFeeAccount',
      'customsClearanceAccount',
      'insuranceAccount',
      'storageAccount',
      'isActive',
      'createdBy',
      'updatedBy'
    ];

    for (const indexName of indexesToAdd) {
      try {
        await queryInterface.addIndex('account_mappings', [indexName]);
        console.log(`✅ Added index for: ${indexName}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️ Index for ${indexName} already exists, skipping...`);
        } else {
          console.error(`❌ Error adding index for ${indexName}:`, error.message);
        }
      }
    }

    console.log('✅ Account mappings schema fix completed successfully');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔧 Rolling back account_mappings table schema...');

    // Remove all added columns
    const columnsToRemove = [
      'accountsReceivableAccount', 'localCustomersAccount', 'foreignCustomersAccount',
      'discountAccount', 'shippingRevenueAccount', 'handlingFeeAccount',
      'customsClearanceAccount', 'insuranceAccount', 'storageAccount',
      'isActive', 'description', 'createdBy', 'updatedBy'
    ];

    for (const columnName of columnsToRemove) {
      try {
        await queryInterface.removeColumn('account_mappings', columnName);
        console.log(`✅ Removed column: ${columnName}`);
      } catch (error) {
        console.error(`❌ Error removing column ${columnName}:`, error.message);
      }
    }

    console.log('✅ Account mappings schema rollback completed');
  }
};