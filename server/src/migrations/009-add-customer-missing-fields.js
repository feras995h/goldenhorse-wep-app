export const up = async (queryInterface, Sequelize) => {
  try {
    // Add missing fields to customers table
    await queryInterface.addColumn('customers', 'type', {
      type: Sequelize.ENUM('individual', 'company'),
      allowNull: false,
      defaultValue: 'individual'
    });

    await queryInterface.addColumn('customers', 'paymentTerms', {
      type: Sequelize.INTEGER,
      defaultValue: 30,
      validate: {
        min: 0,
        max: 365
      }
    });

    await queryInterface.addColumn('customers', 'currency', {
      type: Sequelize.ENUM('LYD', 'USD', 'EUR', 'CNY'),
      defaultValue: 'LYD'
    });

    console.log('✅ Successfully added missing fields to customers table');
  } catch (error) {
    console.error('❌ Error adding missing fields to customers table:', error);
    throw error;
  }
};

export const down = async (queryInterface, Sequelize) => {
  try {
    await queryInterface.removeColumn('customers', 'type');
    await queryInterface.removeColumn('customers', 'paymentTerms');
    await queryInterface.removeColumn('customers', 'currency');

    console.log('✅ Successfully removed added fields from customers table');
  } catch (error) {
    console.error('❌ Error removing fields from customers table:', error);
    throw error;
  }
};
