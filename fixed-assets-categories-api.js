
// GET /api/financial/fixed-assets/categories - Get fixed asset categories from chart of accounts
router.get('/fixed-assets/categories', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    console.log('🔍 Fetching fixed asset categories...');
    
    // Find Fixed Assets parent account
    const fixedAssetsParent = await Account.findOne({
      where: {
        code: '1.2',
        type: 'asset'
      }
    });
    
    if (!fixedAssetsParent) {
      return res.status(500).json({
        success: false,
        message: 'مجموعة الأصول الثابتة غير موجودة'
      });
    }
    
    // Find all sub-groups under Fixed Assets (like 1.2.1, 1.2.2, etc.)
    const subGroups = await Account.findAll({
      where: {
        parentId: fixedAssetsParent.id,
        type: 'asset',
        isActive: true,
        isGroup: true
      },
      attributes: ['id']
    });
    
    console.log(`🔍 Found ${subGroups.length} sub-groups under Fixed Assets`);
    
    // Find categories under these sub-groups (non-group accounts)
    const categories = await Account.findAll({
      where: {
        parentId: {
          [Op.in]: subGroups.map(group => group.id)
        },
        type: 'asset',
        isActive: true,
        isGroup: false
      },
      attributes: ['id', 'code', 'name', 'nameEn', 'type', 'level', 'parentId'],
      order: [['code', 'ASC']]
    });
    
    console.log(`✅ Found ${categories.length} fixed asset categories`);
    
    res.json({
      success: true,
      data: categories,
      total: categories.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching fixed asset categories:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب فئات الأصول الثابتة',
      error: process.env.NODE_ENV === 'development' ? error.message : 'خطأ داخلي'
    });
  }
});
