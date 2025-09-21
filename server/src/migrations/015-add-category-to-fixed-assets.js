'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if category column exists
      const tableDescription = await queryInterface.describeTable('fixed_assets');
      
      if (!tableDescription.category) {
        await queryInterface.addColumn('fixed_assets', 'category', {
          type: Sequelize.ENUM('vehicles', 'equipment', 'furniture', 'machinery', 'other'),
          defaultValue: 'other',
          allowNull: true
        });
        
        console.log('✅ Added category column to fixed_assets table');
      } else {
        console.log('ℹ️ Category column already exists in fixed_assets table');
      }
    } catch (error) {
      console.error('❌ Error adding category column:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('fixed_assets', 'category');
      console.log('✅ Removed category column from fixed_assets table');
    } catch (error) {
      console.error('❌ Error removing category column:', error.message);
      throw error;
    }
  }
};
