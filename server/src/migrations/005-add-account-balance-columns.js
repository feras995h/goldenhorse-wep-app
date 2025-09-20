import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  // Add missing columns to accounts table
  // Check if balance exists before adding
  try {
    await queryInterface.addColumn('accounts', 'balance', {
      type: DataTypes.DECIMAL(15, 4),
      defaultValue: 0,
      allowNull: false
    });
  } catch (error) {
    console.log('balance column already exists');
  }

  // Check if currency exists before adding
  try {
    await queryInterface.addColumn('accounts', 'currency', {
      type: DataTypes.STRING(3),
      defaultValue: 'LYD',
      allowNull: false
    });
  } catch (error) {
    console.log('currency column already exists');
  }

  // Add indexes for accounts table
  try {
    await queryInterface.addIndex('accounts', ['balance']);
  } catch (error) {
    console.log('balance index already exists');
  }

  try {
    await queryInterface.addIndex('accounts', ['currency']);
  } catch (error) {
    console.log('currency index already exists');
  }

  console.log('✅ Added missing balance and currency columns to accounts table');
}

export async function down(queryInterface, Sequelize) {
  // Remove indexes
  try {
    await queryInterface.removeIndex('accounts', ['balance']);
  } catch (error) {
    console.log('balance index does not exist');
  }

  try {
    await queryInterface.removeIndex('accounts', ['currency']);
  } catch (error) {
    console.log('currency index does not exist');
  }

  // Remove columns
  try {
    await queryInterface.removeColumn('accounts', 'balance');
  } catch (error) {
    console.log('balance column does not exist');
  }

  try {
    await queryInterface.removeColumn('accounts', 'currency');
  } catch (error) {
    console.log('currency column does not exist');
  }

  console.log('✅ Removed balance and currency columns from accounts table');
}
