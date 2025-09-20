
// نظام إدارة دليل الحسابات الشامل
class ChartOfAccountsManager {
  constructor(sequelize) {
    this.sequelize = sequelize;
  }
  
  // إنشاء حساب جديد
  async createAccount(accountData) {
    const transaction = await this.sequelize.transaction();
    
    try {
      // التحقق من صحة البيانات
      await this.validateAccountData(accountData);
      
      // التحقق من عدم تكرار الكود
      const existingAccount = await this.sequelize.query(
        'SELECT id FROM accounts WHERE code = :code',
        {
          replacements: { code: accountData.code },
          transaction
        }
      );
      
      if (existingAccount[0].length > 0) {
        throw new Error('كود الحساب موجود بالفعل');
      }
      
      // إنشاء الحساب
      const [result] = await this.sequelize.query(`
        INSERT INTO accounts (
          id, code, name, "nameEn", type, "rootType", "reportType", 
          "parentId", level, "isGroup", "isActive", balance, currency, 
          nature, "accountType", description, "isSystemAccount", 
          "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), :code, :name, :nameEn, :type, :rootType, 
          :reportType, :parentId, :level, :isGroup, :isActive, :balance, 
          :currency, :nature, :accountType, :description, :isSystemAccount, 
          NOW(), NOW()
        ) RETURNING id, code, name
      `, {
        replacements: {
          code: accountData.code,
          name: accountData.name,
          nameEn: accountData.nameEn || accountData.name,
          type: accountData.type,
          rootType: accountData.rootType || this.getRootType(accountData.type),
          reportType: accountData.reportType || this.getReportType(accountData.type),
          parentId: accountData.parentId || null,
          level: accountData.level || this.calculateLevel(accountData.code),
          isGroup: accountData.isGroup || false,
          isActive: accountData.isActive !== false,
          balance: accountData.balance || 0,
          currency: accountData.currency || 'LYD',
          nature: accountData.nature || this.getNature(accountData.type),
          accountType: accountData.accountType || 'sub',
          description: accountData.description || '',
          isSystemAccount: accountData.isSystemAccount || false
        },
        transaction
      });
      
      await transaction.commit();
      
      return {
        success: true,
        data: result[0],
        message: 'تم إنشاء الحساب بنجاح'
      };
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  // تحديث حساب موجود
  async updateAccount(accountId, updateData) {
    const transaction = await this.sequelize.transaction();
    
    try {
      // التحقق من وجود الحساب
      const [existingAccount] = await this.sequelize.query(
        'SELECT * FROM accounts WHERE id = :id',
        {
          replacements: { id: accountId },
          transaction
        }
      );
      
      if (existingAccount.length === 0) {
        throw new Error('الحساب غير موجود');
      }
      
      // تحديث الحساب
      const [result] = await this.sequelize.query(`
        UPDATE accounts 
        SET 
          name = :name,
          "nameEn" = :nameEn,
          type = :type,
          "rootType" = :rootType,
          "reportType" = :reportType,
          "isGroup" = :isGroup,
          "isActive" = :isActive,
          balance = :balance,
          currency = :currency,
          nature = :nature,
          "accountType" = :accountType,
          description = :description,
          "updatedAt" = NOW()
        WHERE id = :id
        RETURNING id, code, name
      `, {
        replacements: {
          id: accountId,
          name: updateData.name,
          nameEn: updateData.nameEn || updateData.name,
          type: updateData.type,
          rootType: updateData.rootType || this.getRootType(updateData.type),
          reportType: updateData.reportType || this.getReportType(updateData.type),
          isGroup: updateData.isGroup || false,
          isActive: updateData.isActive !== false,
          balance: updateData.balance || 0,
          currency: updateData.currency || 'LYD',
          nature: updateData.nature || this.getNature(updateData.type),
          accountType: updateData.accountType || 'sub',
          description: updateData.description || ''
        },
        transaction
      });
      
      await transaction.commit();
      
      return {
        success: true,
        data: result[0],
        message: 'تم تحديث الحساب بنجاح'
      };
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  // حذف حساب
  async deleteAccount(accountId) {
    const transaction = await this.sequelize.transaction();
    
    try {
      // التحقق من وجود الحساب
      const [existingAccount] = await this.sequelize.query(
        'SELECT * FROM accounts WHERE id = :id',
        {
          replacements: { id: accountId },
          transaction
        }
      );
      
      if (existingAccount.length === 0) {
        throw new Error('الحساب غير موجود');
      }
      
      // التحقق من وجود حسابات فرعية
      const [children] = await this.sequelize.query(
        'SELECT COUNT(*) as count FROM accounts WHERE "parentId" = :id',
        {
          replacements: { id: accountId },
          transaction
        }
      );
      
      if (children[0][0].count > 0) {
        throw new Error('لا يمكن حذف الحساب لوجود حسابات فرعية');
      }
      
      // حذف الحساب
      await this.sequelize.query(
        'DELETE FROM accounts WHERE id = :id',
        {
          replacements: { id: accountId },
          transaction
        }
      );
      
      await transaction.commit();
      
      return {
        success: true,
        message: 'تم حذف الحساب بنجاح'
      };
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  // جلب جميع الحسابات
  async getAllAccounts(filters = {}) {
    let whereClause = 'WHERE 1=1';
    const replacements = {};
    
    if (filters.type) {
      whereClause += ' AND type = :type';
      replacements.type = filters.type;
    }
    
    if (filters.isActive !== undefined) {
      whereClause += ' AND "isActive" = :isActive';
      replacements.isActive = filters.isActive;
    }
    
    if (filters.parentId) {
      whereClause += ' AND "parentId" = :parentId';
      replacements.parentId = filters.parentId;
    }
    
    const [accounts] = await this.sequelize.query(`
      SELECT 
        id, code, name, "nameEn", type, "rootType", "reportType",
        "parentId", level, "isGroup", "isActive", balance, currency,
        nature, "accountType", description, "isSystemAccount",
        "createdAt", "updatedAt"
      FROM accounts 
      ${whereClause}
      ORDER BY code
    `, {
      replacements
    });
    
    return {
      success: true,
      data: accounts,
      total: accounts.length
    };
  }
  
  // جلب فئات الأصول الثابتة
  async getFixedAssetCategories() {
    const [categories] = await this.sequelize.query(`
      SELECT a.id, a.code, a.name, a."nameEn", a.type, a.level, a."parentId"
      FROM accounts a
      INNER JOIN accounts parent ON a."parentId" = parent.id
      WHERE parent."parentId" = (SELECT id FROM accounts WHERE code = '1.2' AND type = 'asset')
      AND a.type = 'asset' 
      AND a."isActive" = true 
      AND a."isGroup" = false
      ORDER BY a.code
    `);
    
    return {
      success: true,
      data: categories,
      total: categories.length
    };
  }
  
  // إنشاء فئة أصل ثابت جديدة
  async createFixedAssetCategory(categoryData) {
    // البحث عن مجموعة الأصول الثابتة
    const [fixedAssetsParent] = await this.sequelize.query(
      'SELECT id FROM accounts WHERE code = '1.2' AND type = 'asset''
    );
    
    if (fixedAssetsParent.length === 0) {
      throw new Error('مجموعة الأصول الثابتة غير موجودة');
    }
    
    // البحث عن المجموعة الفرعية المناسبة
    const [subGroup] = await this.sequelize.query(
      'SELECT id FROM accounts WHERE code = :code AND type = 'asset'',
      {
        replacements: { code: categoryData.groupCode }
      }
    );
    
    if (subGroup.length === 0) {
      throw new Error('المجموعة الفرعية غير موجودة');
    }
    
    // إنشاء الفئة
    const accountData = {
      code: categoryData.code,
      name: categoryData.name,
      nameEn: categoryData.nameEn,
      type: 'asset',
      parentId: subGroup[0].id,
      level: 4,
      isGroup: false,
      isActive: true,
      description: `فئة أصل ثابت: ${categoryData.name}`
    };
    
    return await this.createAccount(accountData);
  }
  
  // دوال مساعدة
  validateAccountData(data) {
    if (!data.code || !data.name || !data.type) {
      throw new Error('الكود والاسم والنوع مطلوبة');
    }
    
    if (!['asset', 'liability', 'equity', 'revenue', 'expense'].includes(data.type)) {
      throw new Error('نوع الحساب غير صحيح');
    }
  }
  
  getRootType(type) {
    const typeMap = {
      'asset': 'Asset',
      'liability': 'Liability',
      'equity': 'Equity',
      'revenue': 'Revenue',
      'expense': 'Expense'
    };
    return typeMap[type] || 'Asset';
  }
  
  getReportType(type) {
    const typeMap = {
      'asset': 'Balance Sheet',
      'liability': 'Balance Sheet',
      'equity': 'Balance Sheet',
      'revenue': 'Income Statement',
      'expense': 'Income Statement'
    };
    return typeMap[type] || 'Balance Sheet';
  }
  
  getNature(type) {
    const natureMap = {
      'asset': 'debit',
      'liability': 'credit',
      'equity': 'credit',
      'revenue': 'credit',
      'expense': 'debit'
    };
    return natureMap[type] || 'debit';
  }
  
  calculateLevel(code) {
    return code.split('.').length;
  }
}

module.exports = ChartOfAccountsManager;
