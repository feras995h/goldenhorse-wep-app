import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Setting = sequelize.define('Setting', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 100]
      }
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json', 'date'),
      defaultValue: 'string'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },

  }, {
    tableName: 'settings',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        unique: true,
        fields: ['key']
      }
    ],
    hooks: {
      beforeSave: (setting) => {
        // Convert value based on type
        if (setting.type === 'number') {
          setting.value = parseFloat(setting.value) || 0;
        } else if (setting.type === 'boolean') {
          setting.value = setting.value === 'true' || setting.value === true;
        } else if (setting.type === 'json') {
          if (typeof setting.value === 'string') {
            try {
              setting.value = JSON.parse(setting.value);
            } catch (e) {
              setting.value = null;
            }
          }
        }
      }
    }
  });

  // Instance methods
  Setting.prototype.getValue = function() {
    if (this.type === 'json' && typeof this.value === 'string') {
      try {
        return JSON.parse(this.value);
      } catch (e) {
        return this.value;
      }
    }
    return this.value;
  };

  Setting.prototype.setValue = function(value) {
    this.value = value;
    return this.save();
  };

  // Class methods
  Setting.get = async function(key, defaultValue = null) {
    const setting = await this.findOne({ where: { key } });
    if (!setting) return defaultValue;
    return setting.getValue();
  };

  Setting.set = async function(key, value, options = {}) {
    const { type = 'string', description } = options;
    
    let [setting] = await this.findOrCreate({
      where: { key },
      defaults: { value, type, description }
    });

    if (setting) {
      setting.value = value;
      setting.type = type;
      if (description !== undefined) setting.description = description;
      await setting.save();
    }

    return setting;
  };



  return Setting;
};

