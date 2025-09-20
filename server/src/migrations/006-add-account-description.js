import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  // Add missing description column to accounts table
  try {
    await queryInterface.addColumn('accounts', 'description', {
      type: DataTypes.TEXT,
      allowNull: true
    });
  } catch (error) {
    console.log('description column already exists');
  }

  console.log('✅ Added description column to accounts table');
}

export async function down(queryInterface, Sequelize) {
  // Remove description column
  try {
    await queryInterface.removeColumn('accounts', 'description');
  } catch (error) {
    console.log('description column does not exist');
  }

  console.log('✅ Removed description column from accounts table');
}
