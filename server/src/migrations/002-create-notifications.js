import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
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
      type: DataTypes.UUID,
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

  // Create indexes for better performance
  await queryInterface.addIndex('notifications', ['userId']);
  await queryInterface.addIndex('notifications', ['type']);
  await queryInterface.addIndex('notifications', ['category']);
  await queryInterface.addIndex('notifications', ['read']);
  await queryInterface.addIndex('notifications', ['createdAt']);
  await queryInterface.addIndex('notifications', ['isActive']);
  await queryInterface.addIndex('notifications', ['expiresAt']);

  // Create composite indexes
  await queryInterface.addIndex('notifications', ['userId', 'read']);
  await queryInterface.addIndex('notifications', ['userId', 'isActive']);
  await queryInterface.addIndex('notifications', ['type', 'category']);
}

export async function down(queryInterface, Sequelize) {
  // Drop indexes first
  await queryInterface.removeIndex('notifications', ['userId']);
  await queryInterface.removeIndex('notifications', ['type']);
  await queryInterface.removeIndex('notifications', ['category']);
  await queryInterface.removeIndex('notifications', ['read']);
  await queryInterface.removeIndex('notifications', ['createdAt']);
  await queryInterface.removeIndex('notifications', ['isActive']);
  await queryInterface.removeIndex('notifications', ['expiresAt']);
  await queryInterface.removeIndex('notifications', ['userId', 'read']);
  await queryInterface.removeIndex('notifications', ['userId', 'isActive']);
  await queryInterface.removeIndex('notifications', ['type', 'category']);

  // Drop table
  await queryInterface.dropTable('notifications');
}
