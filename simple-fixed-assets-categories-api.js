
// API endpoint بديل لفئات الأصول الثابتة
// يمكن إضافته إلى server/src/routes/financial.js

router.get('/fixed-assets/categories', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    console.log('🔍 Fetching fixed asset categories (simple version)...');
    
    // البحث المباشر عن الفئات
    const categories = await sequelize.query(`
      SELECT 
        a.id, a.code, a.name, a."nameEn", a.type, a.level, a."parentId"
      FROM accounts a
      WHERE a.type = 'asset' 
        AND a."isActive" = true 
        AND a."isGroup" = false
        AND a.code LIKE '1.2.%'
        AND LENGTH(a.code) >= 7  -- للتأكد من أنها فئات وليس مجموعات
      ORDER BY a.code
    `, {
      type: sequelize.QueryTypes.SELECT
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
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});
