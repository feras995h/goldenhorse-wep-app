import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  // Check if columns already exist
  const tableDescription = await queryInterface.describeTable('users');

  if (!tableDescription.email) {
    // Add email column without unique constraint for SQLite compatibility
    await queryInterface.addColumn('users', 'email', {
      type: DataTypes.STRING(100),
      allowNull: true
    });
  }

  if (!tableDescription.lastLoginAt) {
    await queryInterface.addColumn('users', 'lastLoginAt', {
      type: DataTypes.DATE,
      allowNull: true
    });
  }

  // Add indexes for users table (if not exists)
  try {
    await queryInterface.addIndex('users', ['email'], {
      name: 'users_email_idx',
      unique: false // Remove unique constraint for SQLite
    });
  } catch (error) {
    console.log('Email index already exists or failed to create');
  }

  try {
    await queryInterface.addIndex('users', ['lastLoginAt'], {
      name: 'users_lastLoginAt_idx'
    });
  } catch (error) {
    console.log('LastLoginAt index already exists or failed to create');
  }

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
