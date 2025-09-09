export const up = async (queryInterface, Sequelize) => {
  try {
    // Add missing fields to employees table
    await queryInterface.addColumn('employees', 'branch', {
      type: Sequelize.STRING(50),
      allowNull: true
    });

    await queryInterface.addColumn('employees', 'currency', {
      type: Sequelize.ENUM('LYD', 'USD', 'EUR', 'CNY'),
      defaultValue: 'LYD'
    });

    await queryInterface.addColumn('employees', 'salaryAccountId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      }
    });

    await queryInterface.addColumn('employees', 'advanceAccountId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      }
    });

    await queryInterface.addColumn('employees', 'custodyAccountId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      }
    });

    await queryInterface.addColumn('employees', 'currentBalance', {
      type: Sequelize.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: -999999999999.99,
        max: 999999999999.99
      }
    });

    console.log('✅ Successfully added missing fields to employees table');
  } catch (error) {
    console.error('❌ Error adding missing fields to employees table:', error);
    throw error;
  }
};

export const down = async (queryInterface, Sequelize) => {
  try {
    await queryInterface.removeColumn('employees', 'branch');
    await queryInterface.removeColumn('employees', 'currency');
    await queryInterface.removeColumn('employees', 'salaryAccountId');
    await queryInterface.removeColumn('employees', 'advanceAccountId');
    await queryInterface.removeColumn('employees', 'custodyAccountId');
    await queryInterface.removeColumn('employees', 'currentBalance');

    console.log('✅ Successfully removed added fields from employees table');
  } catch (error) {
    console.error('❌ Error removing fields from employees table:', error);
    throw error;
  }
};
