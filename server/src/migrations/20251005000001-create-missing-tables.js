export default {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('🔧 إنشاء الجداول المفقودة...');

      // Create roles table
      await queryInterface.createTable('roles', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        name: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true
        },
        description: {
          type: DataTypes.TEXT
        },
        permissions: {
          type: DataTypes.TEXT, // Use TEXT for SQLite compatibility
          defaultValue: '{}',
          get() {
            const value = this.getDataValue('permissions');
            return value ? JSON.parse(value) : {};
          },
          set(value) {
            this.setDataValue('permissions', JSON.stringify(value || {}));
          }
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

      console.log('✓ تم إنشاء جدول roles');

      // Create users table
      await queryInterface.createTable('users', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        username: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true
        },
        password: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        role: {
          type: DataTypes.ENUM('admin', 'financial', 'sales', 'customer_service', 'operations'),
          allowNull: false,
          defaultValue: 'operations'
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        },
        passwordChangedAt: {
          type: DataTypes.DATE
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

      console.log('✓ تم إنشاء جدول users');

      // 1. جدول accounting_periods - الفترات المحاسبية
      await queryInterface.createTable('accounting_periods', {
        id: {
          type: DataTypes.UUID,
          defaultValue: Sequelize.literal('gen_random_uuid()'),
          primaryKey: true
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false
        },
        startDate: {
          type: DataTypes.DATE,
          allowNull: false
        },
        endDate: {
          type: DataTypes.DATE,
          allowNull: false
        },
        fiscalYear: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        status: {
          type: DataTypes.ENUM('open', 'closed', 'locked'),
          defaultValue: 'open',
          allowNull: false
        },
        isCurrent: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        closedAt: {
          type: DataTypes.DATE,
          allowNull: true
        },
        closedBy: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          }
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
      }, { transaction });

      console.log('✓ تم إنشاء جدول accounting_periods');

      // Create accounts table
      await queryInterface.createTable('accounts', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        code: {
          type: DataTypes.STRING(20),
          allowNull: false,
          unique: true
        },
        name: {
          type: DataTypes.STRING(200),
          allowNull: false
        },
        nameEn: {
          type: DataTypes.STRING(200),
          allowNull: true
        },
        type: {
          type: DataTypes.ENUM('asset', 'liability', 'equity', 'revenue', 'expense'),
          allowNull: false
        },
        rootType: {
          type: DataTypes.ENUM('Asset', 'Liability', 'Equity', 'Income', 'Expense'),
          allowNull: false
        },
        reportType: {
          type: DataTypes.ENUM('Balance Sheet', 'Profit and Loss'),
          allowNull: false
        },
        nature: {
          type: DataTypes.ENUM('debit', 'credit'),
          allowNull: false,
        },
        isSystemAccount: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        isMonitored: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        accountCategory: {
          type: DataTypes.STRING(50),
          allowNull: true
        },
        parentId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'accounts',
            key: 'id'
          }
        },
        level: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1
        },
        isSystemAccount: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        isTaxAccount: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        isBankAccount: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        isCashAccount: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        isControlAccount: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        currency: {
          type: DataTypes.STRING(3),
          allowNull: true
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        },
        balance: {
          type: DataTypes.DECIMAL(18, 6),
          defaultValue: 0.00
        },
        debit: {
          type: DataTypes.DECIMAL(18, 6),
          defaultValue: 0.00
        },
        credit: {
          type: DataTypes.DECIMAL(18, 6),
          defaultValue: 0.00
        },
        createdBy: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        updatedBy: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          }
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
      }, { transaction });

      console.log('✓ تم إنشاء جدول accounts');

      // Create account_mappings table
      await queryInterface.createTable('account_mappings', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        salesRevenueAccount: {
          type: DataTypes.UUID,
          references: {
            model: 'accounts',
            key: 'id',
          },
        },
        salesTaxAccount: {
          type: DataTypes.UUID,
          references: {
            model: 'accounts',
            key: 'id',
          },
        },
        accountsReceivableAccount: {
          type: DataTypes.UUID,
          references: {
            model: 'accounts',
            key: 'id',
          },
        },
        localCustomersAccount: {
          type: DataTypes.UUID,
          references: {
            model: 'accounts',
            key: 'id',
          },
        },
        foreignCustomersAccount: {
          type: DataTypes.UUID,
          references: {
            model: 'accounts',
            key: 'id',
          },
        },
        discountAccount: {
          type: DataTypes.UUID,
          references: {
            model: 'accounts',
            key: 'id',
          },
        },
        shippingRevenueAccount: {
          type: DataTypes.UUID,
          references: {
            model: 'accounts',
            key: 'id',
          },
        },
        handlingFeeAccount: {
          type: DataTypes.UUID,
          references: {
            model: 'accounts',
            key: 'id',
          },
        },
        customsClearanceAccount: {
          type: DataTypes.UUID,
          references: {
            model: 'accounts',
            key: 'id',
          },
        },
        insuranceAccount: {
          type: DataTypes.UUID,
          references: {
            model: 'accounts',
            key: 'id',
          },
        },
        storageAccount: {
          type: DataTypes.UUID,
          references: {
            model: 'accounts',
            key: 'id',
          },
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        description: {
          type: DataTypes.TEXT,
        },
        createdBy: {
          type: DataTypes.UUID,
          references: {
            model: 'users',
            key: 'id',
          },
        },
        updatedBy: {
          type: DataTypes.UUID,
          references: {
            model: 'users',
            key: 'id',
          },
        },
        createdAt: {
          allowNull: false,
          type: DataTypes.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
          allowNull: false,
          type: DataTypes.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      }, { transaction });

      console.log('✓ تم إنشاء جدول account_mappings');

      await transaction.commit();
      console.log('✨ تم إنشاء جميع الجداول المفقودة بنجاح!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ فشل في إنشاء الجداول المفقودة:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('🗑️ بدء حذف الجداول...');
      await queryInterface.dropTable('account_mappings', { transaction });
      console.log('✓ تم حذف جدول account_mappings');
      await queryInterface.dropTable('accounts', { transaction });
      console.log('✓ تم حذف جدول accounts');
      await queryInterface.dropTable('accounting_periods', { transaction });
      console.log('✓ تم حذف جدول accounting_periods');
      await queryInterface.dropTable('users', { transaction });
      console.log('✓ تم حذف جدول users');
      await queryInterface.dropTable('roles', { transaction });
      console.log('✓ تم حذف جدول roles');
      await transaction.commit();
      console.log('✨ تم حذف جميع الجداول بنجاح!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ فشل في حذف الجداول:', error);
      throw error;
    }
  }
};
