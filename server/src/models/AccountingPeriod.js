import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const AccountingPeriod = sequelize.define('AccountingPeriod', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 2020,
        max: 2050
      }
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 12
      }
    },
    status: {
      type: DataTypes.ENUM('open', 'closed', 'archived'),
      defaultValue: 'open',
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    closedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    closedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    archivedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    archivedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // إحصائيات الفترة
    totalTransactions: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalDebit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00
    },
    totalCredit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00
    }
  }, {
    tableName: 'accounting_periods',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        unique: true,
        fields: ['year', 'month'],
        name: 'unique_year_month'
      },
      {
        fields: ['status']
      },
      {
        fields: ['startDate', 'endDate']
      }
    ],
    hooks: {
      beforeCreate: (period) => {
        // التأكد من أن تاريخ البداية قبل تاريخ النهاية
        if (period.startDate >= period.endDate) {
          throw new Error('تاريخ بداية الفترة يجب أن يكون قبل تاريخ النهاية');
        }
        
        // تحديد تواريخ الفترة تلقائياً إذا لم تكن محددة
        if (!period.startDate || !period.endDate) {
          const startDate = new Date(period.year, period.month - 1, 1);
          const endDate = new Date(period.year, period.month, 0);
          
          period.startDate = startDate.toISOString().split('T')[0];
          period.endDate = endDate.toISOString().split('T')[0];
        }
      },
      
      beforeUpdate: (period) => {
        // منع تعديل الفترات المؤرشفة
        if (period.previous('status') === 'archived') {
          throw new Error('لا يمكن تعديل الفترات المؤرشفة');
        }
        
        // تسجيل وقت الإقفال
        if (period.changed('status') && period.status === 'closed' && !period.closedAt) {
          period.closedAt = new Date();
        }
        
        // تسجيل وقت الأرشفة
        if (period.changed('status') && period.status === 'archived' && !period.archivedAt) {
          period.archivedAt = new Date();
        }
      }
    }
  });

  // Instance methods
  AccountingPeriod.prototype.isOpen = function() {
    return this.status === 'open';
  };

  AccountingPeriod.prototype.isClosed = function() {
    return this.status === 'closed';
  };

  AccountingPeriod.prototype.isArchived = function() {
    return this.status === 'archived';
  };

  AccountingPeriod.prototype.canModify = function() {
    return this.status === 'open';
  };

  /**
   * إقفال الفترة المحاسبية مع إنشاء قيود الإقفال
   * @param {string} userId - معرف المستخدم الذي يقوم بالإقفال
   * @param {Object} options - خيارات الإقفال
   * @param {boolean} options.createClosingEntries - إنشاء قيود الإقفال (افتراضي: true)
   * @param {Object} options.transaction - معاملة Sequelize
   * @returns {Promise<AccountingPeriod>}
   */
  AccountingPeriod.prototype.close = async function(userId, options = {}) {
    if (this.status !== 'open') {
      throw new Error('يمكن إقفال الفترات المفتوحة فقط');
    }
    
    const { createClosingEntries = true, transaction } = options;
    const t = transaction || await sequelize.transaction();
    const shouldCommit = !transaction;
    
    try {
      // 1. حساب الإحصائيات
      const { JournalEntry, GLEntry } = sequelize.models;
      
      const stats = await GLEntry.findAll({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalTransactions'],
          [sequelize.fn('SUM', sequelize.col('debit')), 'totalDebit'],
          [sequelize.fn('SUM', sequelize.col('credit')), 'totalCredit']
        ],
        where: {
          postingDate: {
            [sequelize.Sequelize.Op.gte]: this.startDate,
            [sequelize.Sequelize.Op.lte]: this.endDate
          }
        },
        transaction: t
      });
      
      const periodStats = stats[0] || {};
      this.totalTransactions = parseInt(periodStats.dataValues?.totalTransactions || 0);
      this.totalDebit = parseFloat(periodStats.dataValues?.totalDebit || 0);
      this.totalCredit = parseFloat(periodStats.dataValues?.totalCredit || 0);
      
      // 2. إنشاء قيود الإقفال إذا طُلب ذلك
      if (createClosingEntries) {
        const { Account, AccountMapping } = sequelize.models;
        const mapping = await AccountMapping.getActiveMapping();
        
        if (!mapping) {
          throw new Error('لا يمكن إنشاء قيود الإقفال: لم يتم العثور على ربط الحسابات');
        }
        
        // الحصول على حسابات الإيرادات والمصروفات
        const revenueAccounts = await Account.findAll({
          attributes: ['id', 'code', 'name', 'balance'],
          where: {
            type: 'revenue',
            isGroup: false,
            balance: { [sequelize.Sequelize.Op.ne]: 0 }
          },
          transaction: t
        });
        
        const expenseAccounts = await Account.findAll({
          attributes: ['id', 'code', 'name', 'balance'],
          where: {
            type: 'expense',
            isGroup: false,
            balance: { [sequelize.Sequelize.Op.ne]: 0 }
          },
          transaction: t
        });
        
        // حساب الربح/الخسارة
        const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
        const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
        const netIncome = totalRevenue - totalExpenses;
        
        // إنشاء قيد إقفال الإيرادات
        if (revenueAccounts.length > 0 && totalRevenue !== 0) {
          const lastJE = await JournalEntry.findOne({
            order: [['createdAt', 'DESC']],
            transaction: t
          });
          const nextNumber = lastJE ? (parseInt(String(lastJE.entryNumber).replace(/\D/g, ''), 10) + 1) : 1;
          const entryNumber = `CLS-REV-${this.year}-${String(this.month).padStart(2, '0')}-${String(nextNumber).padStart(4, '0')}`;
          
          const closingRevenueJE = await JournalEntry.create({
            entryNumber,
            date: this.endDate,
            description: `إقفال حسابات الإيرادات - ${this.year}/${this.month}`,
            totalDebit: totalRevenue,
            totalCredit: totalRevenue,
            status: 'posted',
            type: 'closing',
            createdBy: userId,
            periodId: this.id
          }, { transaction: t });
          
          // قيود إقفال الإيرادات (مدين) وتحويلها لحساب الأرباح المحتجزة (دائن)
          const revenueEntries = revenueAccounts.map(acc => ({
            journalEntryId: closingRevenueJE.id,
            accountId: acc.id,
            debit: parseFloat(acc.balance),
            credit: 0,
            description: `إقفال ${acc.name}`
          }));
          
          revenueEntries.push({
            journalEntryId: closingRevenueJE.id,
            accountId: mapping.retainedEarningsAccount || mapping.equityAccount,
            debit: 0,
            credit: totalRevenue,
            description: 'تحويل الإيرادات'
          });
          
          await sequelize.models.JournalEntryDetail.bulkCreate(revenueEntries, { transaction: t });
          
          // إنشاء GL Entries
          await GLEntry.bulkCreate(revenueEntries.map(entry => ({
            postingDate: this.endDate,
            accountId: entry.accountId,
            debit: entry.debit,
            credit: entry.credit,
            voucherType: 'Closing Entry',
            voucherNo: entryNumber,
            journalEntryId: closingRevenueJE.id,
            remarks: entry.description,
            currency: 'LYD',
            exchangeRate: 1.0,
            createdBy: userId
          })), { transaction: t });
        }
        
        // إنشاء قيد إقفال المصروفات
        if (expenseAccounts.length > 0 && totalExpenses !== 0) {
          const lastJE = await JournalEntry.findOne({
            order: [['createdAt', 'DESC']],
            transaction: t
          });
          const nextNumber = lastJE ? (parseInt(String(lastJE.entryNumber).replace(/\D/g, ''), 10) + 1) : 1;
          const entryNumber = `CLS-EXP-${this.year}-${String(this.month).padStart(2, '0')}-${String(nextNumber).padStart(4, '0')}`;
          
          const closingExpenseJE = await JournalEntry.create({
            entryNumber,
            date: this.endDate,
            description: `إقفال حسابات المصروفات - ${this.year}/${this.month}`,
            totalDebit: totalExpenses,
            totalCredit: totalExpenses,
            status: 'posted',
            type: 'closing',
            createdBy: userId,
            periodId: this.id
          }, { transaction: t });
          
          // قيود إقفال المصروفات (دائن) وتحويلها من حساب الأرباح المحتجزة (مدين)
          const expenseEntries = expenseAccounts.map(acc => ({
            journalEntryId: closingExpenseJE.id,
            accountId: acc.id,
            debit: 0,
            credit: parseFloat(acc.balance),
            description: `إقفال ${acc.name}`
          }));
          
          expenseEntries.push({
            journalEntryId: closingExpenseJE.id,
            accountId: mapping.retainedEarningsAccount || mapping.equityAccount,
            debit: totalExpenses,
            credit: 0,
            description: 'تحويل المصروفات'
          });
          
          await sequelize.models.JournalEntryDetail.bulkCreate(expenseEntries, { transaction: t });
          
          // إنشاء GL Entries
          await GLEntry.bulkCreate(expenseEntries.map(entry => ({
            postingDate: this.endDate,
            accountId: entry.accountId,
            debit: entry.debit,
            credit: entry.credit,
            voucherType: 'Closing Entry',
            voucherNo: entryNumber,
            journalEntryId: closingExpenseJE.id,
            remarks: entry.description,
            currency: 'LYD',
            exchangeRate: 1.0,
            createdBy: userId
          })), { transaction: t });
        }
        
        console.log(`✅ تم إنشاء قيود الإقفال للفترة ${this.year}/${this.month}`);
        console.log(`   إجمالي الإيرادات: ${totalRevenue.toFixed(2)}`);
        console.log(`   إجمالي المصروفات: ${totalExpenses.toFixed(2)}`);
        console.log(`   صافي الدخل: ${netIncome.toFixed(2)}`);
      }
      
      // 3. تحديث حالة الفترة
      this.status = 'closed';
      this.closedAt = new Date();
      this.closedBy = userId;
      
      await this.save({ transaction: t });
      
      if (shouldCommit) await t.commit();
      
      console.log(`✅ تم إقفال الفترة المحاسبية ${this.year}/${this.month} بنجاح`);
      
      return this;
      
    } catch (error) {
      if (shouldCommit) await t.rollback();
      console.error(`❌ خطأ في إقفال الفترة المحاسبية:`, error);
      throw error;
    }
  };

  AccountingPeriod.prototype.archive = async function(userId) {
    if (this.status !== 'closed') {
      throw new Error('يمكن أرشفة الفترات المقفلة فقط');
    }
    
    this.status = 'archived';
    this.archivedAt = new Date();
    this.archivedBy = userId;
    
    return await this.save();
  };

  AccountingPeriod.prototype.reopen = async function() {
    if (this.status === 'archived') {
      throw new Error('لا يمكن إعادة فتح الفترات المؤرشفة');
    }
    
    if (this.status === 'closed') {
      this.status = 'open';
      this.closedAt = null;
      this.closedBy = null;
      
      return await this.save();
    }
    
    throw new Error('الفترة مفتوحة بالفعل');
  };

  // Class methods
  /**
   * الحصول على الفترة المحاسبية الحالية
   * @returns {Promise<AccountingPeriod|null>}
   */
  AccountingPeriod.getCurrentPeriod = async function() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    return await this.findOne({
      where: { year, month }
    });
  };
  
  /**
   * التحقق من إمكانية الترحيل في تاريخ معين
   * @param {Date|string} date - التاريخ المراد التحقق منه
   * @returns {Promise<{canPost: boolean, reason?: string, period?: AccountingPeriod}>}
   */
  AccountingPeriod.canPostOnDate = async function(date) {
    const targetDate = new Date(date);
    const period = await this.findByDate(targetDate);
    
    if (!period) {
      return {
        canPost: false,
        reason: 'لا توجد فترة محاسبية لهذا التاريخ'
      };
    }
    
    if (period.status === 'closed') {
      return {
        canPost: false,
        reason: 'الفترة المحاسبية مقفلة',
        period
      };
    }
    
    if (period.status === 'archived') {
      return {
        canPost: false,
        reason: 'الفترة المحاسبية مؤرشفة',
        period
      };
    }
    
    return {
      canPost: true,
      period
    };
  };

  AccountingPeriod.getOrCreateCurrentPeriod = async function() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    let period = await this.findOne({
      where: { year, month }
    });
    
    if (!period) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      period = await this.create({
        year,
        month,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: 'open'
      });
    }
    
    return period;
  };

  AccountingPeriod.findByDate = async function(date) {
    const targetDate = new Date(date);
    
    return await this.findOne({
      where: {
        startDate: { [sequelize.Sequelize.Op.lte]: targetDate },
        endDate: { [sequelize.Sequelize.Op.gte]: targetDate }
      }
    });
  };

  AccountingPeriod.getOpenPeriods = async function() {
    return await this.findAll({
      where: { status: 'open' },
      order: [['year', 'DESC'], ['month', 'DESC']]
    });
  };

  AccountingPeriod.getClosedPeriods = async function() {
    return await this.findAll({
      where: { status: 'closed' },
      order: [['year', 'DESC'], ['month', 'DESC']]
    });
  };

  // Associations
  AccountingPeriod.associate = (models) => {
    AccountingPeriod.belongsTo(models.User, { 
      foreignKey: 'closedBy', 
      as: 'closedByUser',
      onDelete: 'SET NULL'
    });
    AccountingPeriod.belongsTo(models.User, { 
      foreignKey: 'archivedBy', 
      as: 'archivedByUser',
      onDelete: 'SET NULL'
    });
  };

  return AccountingPeriod;
};
