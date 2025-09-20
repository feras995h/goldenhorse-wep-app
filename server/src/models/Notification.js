import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [1, 200]
      }
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
      allowNull: true, // null means notification for all users
      references: {
        model: 'users', // match actual tableName of User model
        key: 'id'
      }
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
      allowNull: true,
      get() {
        const value = this.getDataValue('metadata');
        try {
          return value ? JSON.parse(value) : {};
        } catch {
          return {};
        }
      },
      set(value) {
        this.setDataValue('metadata', JSON.stringify(value || {}));
      }
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['type']
      },
      {
        fields: ['category']
      },
      {
        fields: ['read']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['isActive']
      }
    ]
  });

  // Define associations
  Notification.associate = (models) => {
    // Notification belongs to User (optional - null means for all users)
    Notification.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  // Instance methods
  Notification.prototype.markAsRead = async function() {
    this.read = true;
    this.readAt = new Date();
    return await this.save();
  };

  Notification.prototype.isExpired = function() {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  };

  // Static methods
  Notification.createSystemNotification = async function(data) {
    return await this.create({
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      priority: data.priority || 'medium',
      category: 'system',
      userId: null, // System notifications for all users
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel,
      metadata: data.metadata,
      expiresAt: data.expiresAt
    });
  };

  Notification.createUserNotification = async function(userId, data) {
    return await this.create({
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      priority: data.priority || 'medium',
      category: data.category || 'user',
      userId: userId,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel,
      metadata: data.metadata,
      expiresAt: data.expiresAt
    });
  };

  Notification.createFinancialNotification = async function(data) {
    return await this.create({
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      priority: data.priority || 'medium',
      category: 'financial',
      userId: data.userId || null,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel,
      metadata: data.metadata,
      expiresAt: data.expiresAt
    });
  };

  Notification.getUserNotifications = async function(userId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      unreadOnly = false,
      category = null,
      type = null
    } = options;

    const where = {
      isActive: true,
      [sequelize.Sequelize.Op.and]: [
        // User notifications condition
        {
          [sequelize.Sequelize.Op.or]: [
            { userId: userId },
            { userId: null } // System notifications
          ]
        },
        // Expiration condition
        {
          [sequelize.Sequelize.Op.or]: [
            { expiresAt: null },
            { expiresAt: { [sequelize.Sequelize.Op.gt]: new Date() } }
          ]
        }
      ]
    };

    if (unreadOnly) {
      where.read = false;
    }

    if (category) {
      where.category = category;
    }

    if (type) {
      where.type = type;
    }

    return await this.findAndCountAll({
      where,
      order: [
        ['read', 'ASC'], // Unread first
        ['priority', 'DESC'], // High priority first
        ['createdAt', 'DESC'] // Newest first
      ],
      limit,
      offset,
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'username', 'name']
        }
      ]
    });
  };

  Notification.markAllAsRead = async function(userId) {
    return await this.update(
      { 
        read: true, 
        readAt: new Date() 
      },
      {
        where: {
          [sequelize.Sequelize.Op.or]: [
            { userId: userId },
            { userId: null }
          ],
          read: false,
          isActive: true
        }
      }
    );
  };

  Notification.getUnreadCount = async function(userId) {
    return await this.count({
      where: {
        read: false,
        isActive: true,
        [sequelize.Sequelize.Op.and]: [
          // User notifications condition
          {
            [sequelize.Sequelize.Op.or]: [
              { userId: userId },
              { userId: null }
            ]
          },
          // Expiration condition
          {
            [sequelize.Sequelize.Op.or]: [
              { expiresAt: null },
              { expiresAt: { [sequelize.Sequelize.Op.gt]: new Date() } }
            ]
          }
        ]
      }
    });
  };

  Notification.cleanupExpired = async function() {
    return await this.update(
      { isActive: false },
      {
        where: {
          expiresAt: { [sequelize.Sequelize.Op.lt]: new Date() },
          isActive: true
        }
      }
    );
  };

  return Notification;
};
