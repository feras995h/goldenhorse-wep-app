import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 50]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    permissions: {
      type: DataTypes.TEXT, // Use TEXT for SQLite compatibility
      allowNull: true,
      defaultValue: '{}',
      get() {
        const value = this.getDataValue('permissions');
        try {
          return value ? JSON.parse(value) : {};
        } catch {
          return {};
        }
      },
      set(value) {
        this.setDataValue('permissions', JSON.stringify(value || {}));
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'roles',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        unique: true,
        fields: ['name']
      },
      {
        fields: ['isActive']
      }
    ]
  });

  // Instance methods
  Role.prototype.hasPermission = function(permission) {
    if (!this.permissions) return false;
    return this.permissions[permission] === true;
  };

  Role.prototype.addPermission = function(permission) {
    if (!this.permissions) this.permissions = {};
    this.permissions[permission] = true;
    return this.save();
  };

  Role.prototype.removePermission = function(permission) {
    if (this.permissions && this.permissions[permission]) {
      delete this.permissions[permission];
      return this.save();
    }
    return Promise.resolve(this);
  };

  Role.prototype.getPermissions = function() {
    return this.permissions || {};
  };

  // Class methods
  Role.findByName = function(name) {
    return this.findOne({ where: { name } });
  };

  Role.findActive = function() {
    return this.findAll({ where: { isActive: true } });
  };

  Role.findSystem = function() {
    return this.findAll({ where: { isSystem: true } });
  };

  // Associations
  Role.associate = (models) => {
    // Role can be associated with users through the role field in User model
  };

  return Role;
};

