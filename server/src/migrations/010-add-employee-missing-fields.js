export const up = async (queryInterface, Sequelize) => {
  try {
    const columnExists = async (table, column) => {
      const [rows] = await queryInterface.sequelize.query(
        "SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = :table AND column_name = :column",
        { replacements: { table, column } }
      );
      return rows.length > 0;
    };

    // Add missing fields to employees table
    if (!(await columnExists('employees', 'branch'))) {
      await queryInterface.addColumn('employees', 'branch', {
        type: Sequelize.STRING(50),
        allowNull: true
      });
    }

    if (!(await columnExists('employees', 'currency'))) {
      await queryInterface.addColumn('employees', 'currency', {
        type: Sequelize.ENUM('LYD', 'USD', 'EUR', 'CNY'),
        defaultValue: 'LYD'
      });
    }

    if (!(await columnExists('employees', 'salaryAccountId'))) {
      await queryInterface.addColumn('employees', 'salaryAccountId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'accounts',
          key: 'id'
        }
      });
    }

    if (!(await columnExists('employees', 'advanceAccountId'))) {
      await queryInterface.addColumn('employees', 'advanceAccountId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'accounts',
          key: 'id'
        }
      });
    }

    if (!(await columnExists('employees', 'custodyAccountId'))) {
      await queryInterface.addColumn('employees', 'custodyAccountId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'accounts',
          key: 'id'
        }
      });
    }

    if (!(await columnExists('employees', 'currentBalance'))) {
      await queryInterface.addColumn('employees', 'currentBalance', {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00,
        validate: {
          min: -999999999999.99,
          max: 999999999999.99
        }
      });
    }

    console.log('✅ Successfully added missing fields to employees table');
  } catch (error) {
    console.error('❌ Error adding missing fields to employees table:', error);
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

    if (await columnExists('employees', 'branch')) {
      await queryInterface.removeColumn('employees', 'branch');
    }
    if (await columnExists('employees', 'currency')) {
      await queryInterface.removeColumn('employees', 'currency');
    }
    if (await columnExists('employees', 'salaryAccountId')) {
      await queryInterface.removeColumn('employees', 'salaryAccountId');
    }
    if (await columnExists('employees', 'advanceAccountId')) {
      await queryInterface.removeColumn('employees', 'advanceAccountId');
    }
    if (await columnExists('employees', 'custodyAccountId')) {
      await queryInterface.removeColumn('employees', 'custodyAccountId');
    }
    if (await columnExists('employees', 'currentBalance')) {
      await queryInterface.removeColumn('employees', 'currentBalance');
    }

    console.log('✅ Successfully removed added fields from employees table');
  } catch (error) {
    console.error('❌ Error removing fields from employees table:', error);
    throw error;
  }
};
