import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  // Add missing columns to accounts table
  // Check if freezeAccount exists before adding
  try {
    await queryInterface.addColumn('accounts', 'freezeAccount', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
  } catch (error) {
    console.log('freezeAccount column already exists');
  }

  // Check if accountCategory exists before adding
  try {
    await queryInterface.addColumn('accounts', 'accountCategory', {
      type: DataTypes.STRING(50),
      allowNull: true
    });
  } catch (error) {
    console.log('accountCategory column already exists');
  }

  // Check if accountType exists before adding
  try {
    await queryInterface.addColumn('accounts', 'accountType', {
      type: DataTypes.STRING(50),
      allowNull: true
    });
  } catch (error) {
    console.log('accountType column already exists');
  }

  // Add indexes for accounts table
  await queryInterface.addIndex('accounts', ['freezeAccount']);
  await queryInterface.addIndex('accounts', ['accountCategory']);
  await queryInterface.addIndex('accounts', ['accountType']);

  console.log('✅ Added missing columns to accounts table');
}

export async function down(queryInterface, Sequelize) {
  // Remove indexes
  await queryInterface.removeIndex('accounts', ['freezeAccount']);
  await queryInterface.removeIndex('accounts', ['accountCategory']);
  await queryInterface.removeIndex('accounts', ['accountType']);

  // Remove columns
  await queryInterface.removeColumn('accounts', 'freezeAccount');
  await queryInterface.removeColumn('accounts', 'accountCategory');
  await queryInterface.removeColumn('accounts', 'accountType');

  console.log('✅ Removed columns from accounts table');
}
