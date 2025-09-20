import fs from 'fs';

console.log('🔧 إصلاح جميع أخطاء field mappings في النماذج...\n');

// List of model files to fix
const modelFiles = [
  './server/src/models/ShippingInvoice.js',
  './server/src/models/ShipmentMovement.js',
  './server/src/models/StockMovement.js',
  './server/src/models/WarehouseReleaseOrder.js'
];

modelFiles.forEach(filePath => {
  try {
    console.log(`🔧 إصلاح ${filePath}...`);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix missing commas before field mappings
    const fixes = [
      // Fix patterns like: defaultValue: 'value'\n    field: 'fieldName',
      {
        from: /(defaultValue: [^,\n]+)\s*\n\s*field: '([^']+)',?\s*\n\s*}/g,
        to: "$1,\n      field: '$2'\n    }"
      },
      // Fix patterns like: allowNull: false\n    field: 'fieldName',
      {
        from: /(allowNull: (?:true|false))\s*\n\s*field: '([^']+)',?\s*\n\s*}/g,
        to: "$1,\n      field: '$2'\n    }"
      },
      // Fix patterns like: max: 999\n      }\n      field: 'fieldName',
      {
        from: /(max: [^,\n]+)\s*}\s*\n\s*field: '([^']+)',?\s*\n\s*}/g,
        to: "$1\n      },\n      field: '$2'\n    }"
      },
      // Fix patterns like: min: 0\n      }\n      field: 'fieldName',
      {
        from: /(min: [^,\n]+)\s*}\s*\n\s*field: '([^']+)',?\s*\n\s*}/g,
        to: "$1\n      },\n      field: '$2'\n    }"
      },
      // Fix patterns like: type: DataTypes.STRING\n    field: 'fieldName',
      {
        from: /(type: DataTypes\.[^,\n]+)\s*\n\s*field: '([^']+)',?\s*\n\s*}/g,
        to: "$1,\n      field: '$2'\n    }"
      }
    ];
    
    // Apply all fixes
    fixes.forEach((fix, index) => {
      const before = content;
      content = content.replace(fix.from, fix.to);
      if (content !== before) {
        console.log(`  ✅ تم تطبيق التصحيح ${index + 1}`);
      }
    });
    
    // Write the fixed content
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ تم إصلاح ${filePath}`);
    
  } catch (error) {
    console.log(`❌ خطأ في إصلاح ${filePath}: ${error.message}`);
  }
});

console.log('\n✅ تم إصلاح جميع أخطاء field mappings');
console.log('🎯 الآن يمكن تشغيل الخادم بدون أخطاء');
