import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  // Determine users.id data type to match FK type
  const [rows] = await queryInterface.sequelize.query(
    "SELECT data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'users' AND column_name = 'id'"
  );
  const usersIdType = (rows && rows[0] && rows[0].data_type === 'uuid') ? DataTypes.UUID : DataTypes.INTEGER;

  // Create notifications table
  await queryInterface.createTable('notifications', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('info', 'success', 'warning', 'error'),
      defaultValue: 'info'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium'
    },
    category: {
      type: DataTypes.ENUM('system', 'financial', 'user', 'security', 'sales', 'operations'),
      defaultValue: 'system'
    },
    userId: {
      type: usersIdType,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    actionUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    actionLabel: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  // Helpers for idempotency
  const indexExists = async (name) => {
    const [idxRows] = await queryInterface.sequelize.query(
      "SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = :name",
      { replacements: { name } }
    );
    return idxRows.length > 0;
  };
  const columnExists = async (table, column) => {
    const [colRows] = await queryInterface.sequelize.query(
      "SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = :table AND column_name = :column",
      { replacements: { table, column } }
    );
    return colRows.length > 0;
  };
  const ensureIndex = async (table, columns, name) => {
    const cols = Array.isArray(columns) ? columns : [String(columns)];
    for (const col of cols) {
      if (!(await columnExists(table, col))) return;
    }
    if (await indexExists(name)) return;
    await queryInterface.addIndex(table, cols, { name });
  };

  // Create indexes for better performance
  await ensureIndex('notifications', ['userId'], 'notifications_userId');
  await ensureIndex('notifications', ['type'], 'notifications_type');
  await ensureIndex('notifications', ['category'], 'notifications_category');
  await ensureIndex('notifications', ['read'], 'notifications_read');
  await ensureIndex('notifications', ['createdAt'], 'notifications_createdAt');
  await ensureIndex('notifications', ['isActive'], 'notifications_isActive');
  await ensureIndex('notifications', ['expiresAt'], 'notifications_expiresAt');

  // Create composite indexes
  await ensureIndex('notifications', ['userId', 'read'], 'notifications_userId_read');
  await ensureIndex('notifications', ['userId', 'isActive'], 'notifications_userId_isActive');
  await ensureIndex('notifications', ['type', 'category'], 'notifications_type_category');
}

export async function down(queryInterface, Sequelize) {
  // Drop indexes first (best-effort)
  const safeRemove = async (name) => {
    try { await queryInterface.removeIndex('notifications', name); } catch (_) {}
  };
  const indexes = [
    'notifications_userId',
    'notifications_type',
    'notifications_category',
    'notifications_read',
    'notifications_createdAt',
    'notifications_isActive',
    'notifications_expiresAt',
    'notifications_userId_read',
    'notifications_userId_isActive',
    'notifications_type_category'
  ];
  for (const idx of indexes) { await safeRemove(idx); }

  // Drop table
  await queryInterface.dropTable('notifications');
}
