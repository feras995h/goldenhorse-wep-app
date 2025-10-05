import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  // Helpers for idempotency
  const columnExists = async (table, column) => {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = :table AND column_name = :column",
      { replacements: { table, column } }
    );
    return rows.length > 0;
  };

  const indexExists = async (indexName) => {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = :name",
      { replacements: { name: indexName } }
    );
    return rows.length > 0;
  };

  // Add missing columns to roles table
  if (!(await columnExists('roles', 'isActive'))) {
    await queryInterface.addColumn('roles', 'isActive', {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });
  }

  if (!(await columnExists('roles', 'isSystem'))) {
    await queryInterface.addColumn('roles', 'isSystem', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
  }

  // Add indexes for roles table (only if column exists and index missing)
  if ((await columnExists('roles', 'isActive')) && !(await indexExists('roles_isActive'))) {
    await queryInterface.addIndex('roles', ['isActive'], { name: 'roles_isActive' });
  }
  if ((await columnExists('roles', 'isSystem')) && !(await indexExists('roles_isSystem'))) {
    await queryInterface.addIndex('roles', ['isSystem'], { name: 'roles_isSystem' });
  }

  console.log('✅ Added missing columns to roles table');
}

export async function down(queryInterface, Sequelize) {
  // Helpers for idempotency
  const columnExists = async (table, column) => {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = :table AND column_name = :column",
      { replacements: { table, column } }
    );
    return rows.length > 0;
  };

  const indexExists = async (indexName) => {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = :name",
      { replacements: { name: indexName } }
    );
    return rows.length > 0;
  };

  // Remove indexes if they exist
  if (await indexExists('roles_isActive')) {
    await queryInterface.removeIndex('roles', 'roles_isActive');
  }
  if (await indexExists('roles_isSystem')) {
    await queryInterface.removeIndex('roles', 'roles_isSystem');
  }

  // Remove columns if they exist
  if (await columnExists('roles', 'isActive')) {
    await queryInterface.removeColumn('roles', 'isActive');
  }
  if (await columnExists('roles', 'isSystem')) {
    await queryInterface.removeColumn('roles', 'isSystem');
  }

  console.log('✅ Removed columns from roles table');
}
