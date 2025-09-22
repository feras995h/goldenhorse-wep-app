'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔧 Adding missing user columns to account_mappings table...');

    // Add createdBy column
    try {
      await queryInterface.addColumn('account_mappings', 'createdBy', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'User who created this mapping'
      });
      console.log('✅ Added createdBy column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ createdBy column already exists, skipping...');
      } else {
        console.error('❌ Error adding createdBy column:', error.message);
      }
    }

    // Add updatedBy column
    try {
      await queryInterface.addColumn('account_mappings', 'updatedBy', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'User who last updated this mapping'
      });
      console.log('✅ Added updatedBy column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ updatedBy column already exists, skipping...');
      } else {
        console.error('❌ Error adding updatedBy column:', error.message);
      }
    }

    // Add indexes for better performance
    try {
      await queryInterface.addIndex('account_mappings', ['createdBy']);
      console.log('✅ Added index for createdBy');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ Index for createdBy already exists, skipping...');
      } else {
        console.error('❌ Error adding index for createdBy:', error.message);
      }
    }

    try {
      await queryInterface.addIndex('account_mappings', ['updatedBy']);
      console.log('✅ Added index for updatedBy');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ Index for updatedBy already exists, skipping...');
      } else {
        console.error('❌ Error adding index for updatedBy:', error.message);
      }
    }

    console.log('✅ Account mappings user columns migration completed successfully');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔧 Rolling back account_mappings user columns...');

    // Remove columns
    try {
      await queryInterface.removeColumn('account_mappings', 'createdBy');
      console.log('✅ Removed createdBy column');
    } catch (error) {
      console.error('❌ Error removing createdBy column:', error.message);
    }

    try {
      await queryInterface.removeColumn('account_mappings', 'updatedBy');
      console.log('✅ Removed updatedBy column');
    } catch (error) {
      console.error('❌ Error removing updatedBy column:', error.message);
    }

    console.log('✅ Account mappings user columns rollback completed');
  }
};