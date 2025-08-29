import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  // Add missing columns to users table
  await queryInterface.addColumn('users', 'email', {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  });

  await queryInterface.addColumn('users', 'lastLoginAt', {
    type: DataTypes.DATE,
    allowNull: true
  });

  // Add indexes for users table
  await queryInterface.addIndex('users', ['email']);
  await queryInterface.addIndex('users', ['lastLoginAt']);

  console.log('✅ Added missing columns to users table');
}

export async function down(queryInterface, Sequelize) {
  // Remove indexes
  await queryInterface.removeIndex('users', ['email']);
  await queryInterface.removeIndex('users', ['lastLoginAt']);

  // Remove columns
  await queryInterface.removeColumn('users', 'email');
  await queryInterface.removeColumn('users', 'lastLoginAt');

  console.log('✅ Removed columns from users table');
}
