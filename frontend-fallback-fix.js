
// حل مؤقت للواجهة الأمامية
// استبدل هذا الكود في FixedAssetsManagement.tsx

const loadCategories = async () => {
  try {
    console.log('🔄 Loading fixed asset categories...');
    
    // محاولة استخدام API المرفوع
    try {
      const resp = await financialAPI.getFixedAssetCategories();
      console.log('📊 Categories response:', resp);
      
      if (resp && resp.data && Array.isArray(resp.data)) {
        const categoriesArray = resp.data;
        setCategories(categoriesArray);
        console.log(`✅ Loaded ${categoriesArray.length} categories:`, 
          categoriesArray.map(c => `${c.code} - ${c.name}`));
        return;
      }
    } catch (apiError) {
      console.warn('⚠️ API error, using fallback categories:', apiError.message);
    }
    
    // استخدام فئات احتياطية إذا فشل API
    const fallbackCategories = [
      { id: 'c32e4672-4df8-44a6-8be9-f136d732d4ec', code: '1.2.1.1', name: 'أراضي', nameEn: 'Land' },
      { id: '4120a1bb-6613-4cec-b19e-177f14bf71b4', code: '1.2.2.1', name: 'مباني', nameEn: 'Buildings' },
      { id: 'd8bee94c-a8fa-4385-9a54-fc30045f6084', code: '1.2.3.1', name: 'آلات ومعدات', nameEn: 'Machinery and Equipment' },
      { id: 'b47e722a-fc3e-43fa-a3ef-681164650c6b', code: '1.2.4.1', name: 'أثاث', nameEn: 'Furniture' },
      { id: '5d6ecf92-7d01-47bc-b084-9eae3b498074', code: '1.2.5.1', name: 'سيارات', nameEn: 'Vehicles' },
      { id: '7ab5613c-ce23-4613-b433-ae7d4c91c8c9', code: '1.2.6.1', name: 'أجهزة حاسوب', nameEn: 'Computer Equipment' }
    ];
    
    setCategories(fallbackCategories);
    console.log(`✅ Using fallback categories: ${fallbackCategories.length} categories`);
    
  } catch (error) {
    console.error('❌ Error loading fixed asset categories:', error);
    setCategories([]);
  }
};
