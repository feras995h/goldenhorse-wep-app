export const up = async (queryInterface, Sequelize) => {
  try {
    const columnExists = async (table, column) => {
      const [rows] = await queryInterface.sequelize.query(
        "SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = :table AND column_name = :column",
        { replacements: { table, column } }
      );
      return rows.length > 0;
    };

    // Add missing fields to customers table
    if (!(await columnExists('customers', 'type'))) {
      await queryInterface.addColumn('customers', 'type', {
        type: Sequelize.ENUM('individual', 'company'),
        allowNull: false,
        defaultValue: 'individual'
      });
    }

    if (!(await columnExists('customers', 'paymentTerms'))) {
      await queryInterface.addColumn('customers', 'paymentTerms', {
        type: Sequelize.INTEGER,
        defaultValue: 30,
        validate: {
          min: 0,
          max: 365
        }
      });
    }

    if (!(await columnExists('customers', 'currency'))) {
      await queryInterface.addColumn('customers', 'currency', {
        type: Sequelize.ENUM('LYD', 'USD', 'EUR', 'CNY'),
        defaultValue: 'LYD'
      });
    }

    console.log('✅ Successfully added missing fields to customers table');
  } catch (error) {
    console.error('❌ Error adding missing fields to customers table:', error);
    throw error;
  }
};

export const down = async (queryInterface, Sequelize) => {
  try {
    const columnExists = async (table, column) => {
      const [rows] = await queryInterface.sequelize.query(
        "SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = :table AND column_name = :column",
        { replacements: { table, column } }
      );
      return rows.length > 0;
    };

    if (await columnExists('customers', 'type')) {
      await queryInterface.removeColumn('customers', 'type');
    }
    if (await columnExists('customers', 'paymentTerms')) {
      await queryInterface.removeColumn('customers', 'paymentTerms');
    }
    if (await columnExists('customers', 'currency')) {
      await queryInterface.removeColumn('customers', 'currency');
    }

    console.log('✅ Successfully removed added fields from customers table');
  } catch (error) {
    console.error('❌ Error removing fields from customers table:', error);
    throw error;
  }
};
