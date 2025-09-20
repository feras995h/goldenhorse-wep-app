
// API endpoint صحيح للفئات - يتعامل مع دليل الحسابات
router.get('/fixed-assets/categories', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    console.log('🔍 Fetching fixed asset categories...');
    
    // البحث عن مجموعة الأصول الثابتة
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
    
    // البحث عن الفئات المناسبة (غير المجموعات وليس مجمع الإهلاك)
    const categories = await Account.findAll({
      where: {
        parentId: fixedAssetsParent.id,
        type: 'asset',
        isActive: true,
        isGroup: false,
        name: {
          [Op.notLike]: '%مجمع%'
        }
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
