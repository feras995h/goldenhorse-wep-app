export const up = async (queryInterface, Sequelize) => {
  // Check if account_mappings table exists
  const tableExists = await queryInterface.describeTable('account_mappings').catch(() => null);
  
  if (!tableExists) {
    console.log('⏭️  Skipping: account_mappings table does not exist');
    return;
  }

  // Check if column already exists
  const columns = await queryInterface.describeTable('account_mappings');
  if (columns.salesTaxAccount) {
    console.log('⏭️  Skipping: salesTaxAccount column already exists');
    return;
  }

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
};

export const down = async (queryInterface, Sequelize) => {
  // Check if account_mappings table exists
  const tableExists = await queryInterface.describeTable('account_mappings').catch(() => null);
  
  if (!tableExists) {
    console.log('⏭️  Skipping: account_mappings table does not exist');
    return;
  }

  // Remove the column
  await queryInterface.removeColumn('account_mappings', 'salesTaxAccount');

  console.log('✅ Removed salesTaxAccount column from account_mappings table');
};