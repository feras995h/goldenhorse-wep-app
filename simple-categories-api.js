
// API endpoint بسيط للفئات
app.get('/api/financial/fixed-assets/categories-simple', (req, res) => {
  try {
    const categories = [
      { id: '1', code: '1.2.1', name: 'الأراضي', nameEn: 'Land' },
      { id: '2', code: '1.2.2', name: 'المباني والإنشاءات', nameEn: 'Buildings and Constructions' },
      { id: '3', code: '1.2.3', name: 'الآلات والمعدات', nameEn: 'Machinery and Equipment' },
      { id: '4', code: '1.2.4', name: 'الأثاث والتجهيزات', nameEn: 'Furniture and Fixtures' },
      { id: '5', code: '1.2.5', name: 'وسائل النقل', nameEn: 'Vehicles' },
      { id: '6', code: '1.2.6', name: 'أجهزة الحاسوب', nameEn: 'Computer Equipment' },
      { id: '7', code: '1.2.7', name: 'مجمع الإهلاك', nameEn: 'Accumulated Depreciation' },
      { id: '8', code: '1.2.8', name: 'معدات وآلات', nameEn: 'Equipment and Machinery' },
      { id: '9', code: '1.2.9', name: 'سيارات', nameEn: 'Cars' }
    ];
    
    res.json({
      success: true,
      data: categories,
      total: categories.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الفئات',
      error: error.message
    });
  }
});
