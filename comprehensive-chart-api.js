
// API endpoints شاملة لدليل الحسابات
const express = require('express');
const router = express.Router();
const ChartOfAccountsManager = require('./ChartOfAccountsManager');

// إنشاء مدير دليل الحسابات
const chartManager = new ChartOfAccountsManager(sequelize);

// GET /api/financial/accounts - جلب جميع الحسابات
router.get('/accounts', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const result = await chartManager.getAllAccounts(req.query);
    res.json(result);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الحسابات',
      error: error.message
    });
  }
});

// POST /api/financial/accounts - إنشاء حساب جديد
router.post('/accounts', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const result = await chartManager.createAccount(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(400).json({
      success: false,
      message: 'خطأ في إنشاء الحساب',
      error: error.message
    });
  }
});

// PUT /api/financial/accounts/:id - تحديث حساب
router.put('/accounts/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const result = await chartManager.updateAccount(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(400).json({
      success: false,
      message: 'خطأ في تحديث الحساب',
      error: error.message
    });
  }
});

// DELETE /api/financial/accounts/:id - حذف حساب
router.delete('/accounts/:id', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const result = await chartManager.deleteAccount(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(400).json({
      success: false,
      message: 'خطأ في حذف الحساب',
      error: error.message
    });
  }
});

// GET /api/financial/fixed-assets/categories - جلب فئات الأصول الثابتة
router.get('/fixed-assets/categories', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const result = await chartManager.getFixedAssetCategories();
    res.json(result);
  } catch (error) {
    console.error('Error fetching fixed asset categories:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب فئات الأصول الثابتة',
      error: error.message
    });
  }
});

// POST /api/financial/fixed-assets/categories - إنشاء فئة أصل ثابت جديدة
router.post('/fixed-assets/categories', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const result = await chartManager.createFixedAssetCategory(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating fixed asset category:', error);
    res.status(400).json({
      success: false,
      message: 'خطأ في إنشاء فئة الأصول الثابتة',
      error: error.message
    });
  }
});

// GET /api/financial/accounts/tree - جلب دليل الحسابات على شكل شجرة
router.get('/accounts/tree', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const [accounts] = await sequelize.query(`
      SELECT 
        id, code, name, "nameEn", type, level, "parentId", "isGroup", "isActive"
      FROM accounts 
      WHERE "isActive" = true
      ORDER BY code
    `);
    
    // بناء الشجرة
    const tree = buildAccountTree(accounts);
    
    res.json({
      success: true,
      data: tree,
      total: accounts.length
    });
  } catch (error) {
    console.error('Error building account tree:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في بناء شجرة الحسابات',
      error: error.message
    });
  }
});

// دالة بناء شجرة الحسابات
function buildAccountTree(accounts) {
  const accountMap = new Map();
  const rootAccounts = [];
  
  // إنشاء خريطة للحسابات
  accounts.forEach(account => {
    accountMap.set(account.id, { ...account, children: [] });
  });
  
  // بناء الشجرة
  accounts.forEach(account => {
    if (account.parentId) {
      const parent = accountMap.get(account.parentId);
      if (parent) {
        parent.children.push(accountMap.get(account.id));
      }
    } else {
      rootAccounts.push(accountMap.get(account.id));
    }
  });
  
  return rootAccounts;
}

module.exports = router;
