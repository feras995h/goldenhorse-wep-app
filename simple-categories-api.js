
// API endpoint بسيط للفئات
app.get('/api/financial/fixed-assets/categories', async (req, res) => {
  try {
    console.log('🔍 Fetching fixed asset categories...');
    
    // البحث عن مجموعة الأصول الثابتة
    const [fixedAssetsParent] = await sequelize.query(`
      SELECT id, code, name, "nameEn", type, level, "parentId", "isActive"
      FROM accounts 
      WHERE code = '1.2' AND type = 'asset'
    `);
    
    if (fixedAssetsParent.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'مجموعة الأصول الثابتة غير موجودة'
      });
    }
    
    const parent = fixedAssetsParent[0];
    
    // البحث عن الفئات تحت المجموعات الفرعية
    const [categories] = await sequelize.query(`
      SELECT a.id, a.code, a.name, a."nameEn", a.type, a.level, a."parentId", a."isActive"
      FROM accounts a
      INNER JOIN accounts parent ON a."parentId" = parent.id
      WHERE parent."parentId" = :parentId 
      AND a.type = 'asset' 
      AND a."isActive" = true 
      AND a."isGroup" = false
      ORDER BY a.code
    `, {
      replacements: { parentId: parent.id }
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
      error: error.message
    });
  }
});
