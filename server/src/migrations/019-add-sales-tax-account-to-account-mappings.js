'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add salesTaxAccount column to account_mappings table
    await queryInterface.addColumn('account_mappings', 'salesTaxAccount', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      },
      comment: 'Account for sales tax payable'
    });

    // Add index for better performance
    await queryInterface.addIndex('account_mappings', ['salesTaxAccount']);

    console.log('✅ Added salesTaxAccount column to account_mappings table');
  },

  async down(queryInterface, Sequelize) {
    // Remove the column
    await queryInterface.removeColumn('account_mappings', 'salesTaxAccount');

    console.log('✅ Removed salesTaxAccount column from account_mappings table');
  }
};