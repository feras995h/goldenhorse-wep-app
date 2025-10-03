import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Supplier = sequelize.define('Supplier', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 20]
      }
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [1, 200]
      }
    },
    nameEn: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    contactPerson: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    taxNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    creditLimit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    paymentTerms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
      validate: {
        min: 0,
        max: 365
      }
    },
    currency: {
      type: DataTypes.ENUM('LYD', 'USD', 'EUR', 'CNY'),
      allowNull: false,
      defaultValue: 'LYD'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'suppliers',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    hooks: {
      beforeCreate: async (supplier) => {
        // Generate supplier code if not provided
        if (!supplier.code) {
          const lastSupplier = await Supplier.findOne({
            order: [['code', 'DESC']]
          });

          let nextNumber = 1;
          if (lastSupplier && lastSupplier.code) {
            const match = lastSupplier.code.match(/\d+$/);
            if (match) {
              nextNumber = parseInt(match[0]) + 1;
            }
          }

          supplier.code = `S${String(nextNumber).padStart(6, '0')}`;
        }
      }
    }
  });

  /**
   * إنشاء أو الحصول على حساب المورد في دليل الحسابات
   */
  Supplier.prototype.ensureAccount = async function(transaction) {
    const { Account } = this.sequelize.models;
    const t = transaction || await this.sequelize.transaction();
    const shouldCommit = !transaction;

    try {
      // البحث عن الحساب الموجود
      let account = await Account.findOne({
        where: { 
          code: `2101-${this.code}`,
          type: 'liability'
        },
        transaction: t
      });

      if (account) {
        console.log(`✅ حساب المورد ${this.name} موجود بالفعل: ${account.code}`);
        if (shouldCommit) await t.commit();
        return account;
      }

      // البحث عن الحساب الرئيسي للموردين
      let parentAccount = await Account.findOne({
        where: { code: '2101', type: 'liability' },
        transaction: t
      });

      if (!parentAccount) {
        console.log('⚠️ حساب الموردين الرئيسي غير موجود، إنشاء الهيكل الكامل...');
        
        // إنشاء الالتزامات المتداولة
        let currentLiabilitiesAccount = await Account.findOne({
          where: { code: '21', type: 'liability' },
          transaction: t
        });

        if (!currentLiabilitiesAccount) {
          currentLiabilitiesAccount = await Account.create({
            code: '21',
            name: 'الالتزامات المتداولة',
            nameEn: 'Current Liabilities',
            type: 'liability',
            parentId: null,
            balance: 0
          }, { transaction: t });
        }

        // إنشاء حساب الموردين الرئيسي
        parentAccount = await Account.create({
          code: '2101',
          name: 'الموردون',
          nameEn: 'Accounts Payable',
          type: 'liability',
          parentId: currentLiabilitiesAccount.id,
          balance: 0
        }, { transaction: t });
      }

      // إنشاء حساب فرعي للمورد
      account = await Account.create({
        code: `2101-${this.code}`,
        name: this.name,
        nameEn: this.nameEn || this.name,
        type: 'liability',
        parentId: parentAccount.id,
        balance: 0,
        isSubAccount: true
      }, { transaction: t });

      console.log(`✅ تم إنشاء حساب جديد للمورد: ${account.code} - ${account.name}`);
      
      if (shouldCommit) await t.commit();
      return account;

    } catch (error) {
      console.error(`❌ خطأ في إنشاء حساب المورد ${this.name}:`, error);
      if (shouldCommit) await t.rollback();
      throw error;
    }
  };

  /**
   * Hook: إنشاء حساب تلقائياً عند إنشاء مورد جديد
   */
  Supplier.addHook('afterCreate', async (supplier, options) => {
    try {
      await supplier.ensureAccount(options.transaction);
    } catch (error) {
      console.error(`❌ فشل إنشاء حساب للمورد ${supplier.name}:`, error.message);
      // لا نفشل العملية، فقط نسجل الخطأ
    }
  });

  // Associations
  Supplier.associate = (models) => {
    Supplier.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    // Note: Other associations will be set up after all models are loaded
  };

  return Supplier;
};