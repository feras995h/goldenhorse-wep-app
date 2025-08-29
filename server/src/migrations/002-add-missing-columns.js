import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  // Add missing columns to roles table
  await queryInterface.addColumn('roles', 'isActive', {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  });

  await queryInterface.addColumn('roles', 'isSystem', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  });

  // Add indexes for roles table
  await queryInterface.addIndex('roles', ['isActive']);
  await queryInterface.addIndex('roles', ['isSystem']);

  console.log('✅ Added missing columns to roles table');
}

export async function down(queryInterface, Sequelize) {
  // Remove indexes
  await queryInterface.removeIndex('roles', ['isActive']);
  await queryInterface.removeIndex('roles', ['isSystem']);

  // Remove columns
  await queryInterface.removeColumn('roles', 'isActive');
  await queryInterface.removeColumn('roles', 'isSystem');

  console.log('✅ Removed columns from roles table');
}
