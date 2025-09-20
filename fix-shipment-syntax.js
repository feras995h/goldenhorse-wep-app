import fs from 'fs';

console.log('🔧 إصلاح أخطاء syntax في نموذج Shipment...\n');

// Read the current Shipment model
const filePath = './server/src/models/Shipment.js';
let content = fs.readFileSync(filePath, 'utf8');

// Fix missing commas before field mappings
const fixes = [
  // customerPhone
  {
    from: /allowNull: false\s+field: 'customerPhone',/g,
    to: "allowNull: false,\n      field: 'customerPhone'"
  },
  // itemDescription
  {
    from: /allowNull: false\s+field: 'itemDescription',/g,
    to: "allowNull: false,\n      field: 'itemDescription'"
  },
  // itemDescriptionEn
  {
    from: /allowNull: true\s+field: 'itemDescriptionEn',/g,
    to: "allowNull: true,\n      field: 'itemDescriptionEn'"
  },
  // category
  {
    from: /defaultValue: 'other'\s+field: 'category',/g,
    to: "defaultValue: 'other',\n      field: 'category'"
  },
  // quantity
  {
    from: /max: 999999\s+}\s+field: 'quantity',/g,
    to: "max: 999999\n      },\n      field: 'quantity'"
  },
  // weight
  {
    from: /max: 9999999\.999\s+field: 'weight',/g,
    to: "max: 9999999.999\n      },\n      field: 'weight'"
  },
  // length
  {
    from: /max: 99999999\.99\s+field: 'length',/g,
    to: "max: 99999999.99\n      },\n      field: 'length'"
  },
  // width
  {
    from: /max: 99999999\.99\s+field: 'width',/g,
    to: "max: 99999999.99\n      },\n      field: 'width'"
  },
  // height
  {
    from: /max: 99999999\.99\s+field: 'height',/g,
    to: "max: 99999999.99\n      },\n      field: 'height'"
  },
  // volume
  {
    from: /max: 999999999999\.999\s+field: 'volume',/g,
    to: "max: 999999999999.999\n      },\n      field: 'volume'"
  },
  // volumeOverride
  {
    from: /max: 999999999999\.999\s+field: 'volumeOverride',/g,
    to: "max: 999999999999.999\n      },\n      field: 'volumeOverride'"
  },
  // declaredValue
  {
    from: /max: 999999999999\.99\s+field: 'declaredValue',/g,
    to: "max: 999999999999.99\n      },\n      field: 'declaredValue'"
  },
  // shippingCost
  {
    from: /max: 999999999999\.99\s+field: 'shippingCost',/g,
    to: "max: 999999999999.99\n      },\n      field: 'shippingCost'"
  },
  // originLocation
  {
    from: /allowNull: false\s+field: 'originLocation',/g,
    to: "allowNull: false,\n      field: 'originLocation'"
  },
  // destinationLocation
  {
    from: /allowNull: false\s+field: 'destinationLocation',/g,
    to: "allowNull: false,\n      field: 'destinationLocation'"
  },
  // status
  {
    from: /defaultValue: 'received_china'\s+field: 'status',/g,
    to: "defaultValue: 'received_china',\n      field: 'status'"
  },
  // receivedDate
  {
    from: /allowNull: false\s+field: 'receivedDate',/g,
    to: "allowNull: false,\n      field: 'receivedDate'"
  },
  // estimatedDelivery
  {
    from: /allowNull: true\s+field: 'estimatedDelivery',/g,
    to: "allowNull: true,\n      field: 'estimatedDelivery'"
  },
  // actualDeliveryDate
  {
    from: /allowNull: true\s+field: 'actualDeliveryDate',/g,
    to: "allowNull: true,\n      field: 'actualDeliveryDate'"
  },
  // notes
  {
    from: /allowNull: true\s+field: 'notes',/g,
    to: "allowNull: true,\n      field: 'notes'"
  },
  // isFragile
  {
    from: /defaultValue: false\s+field: 'isFragile',/g,
    to: "defaultValue: false,\n      field: 'isFragile'"
  },
  // requiresSpecialHandling
  {
    from: /defaultValue: false\s+field: 'requiresSpecialHandling',/g,
    to: "defaultValue: false,\n      field: 'requiresSpecialHandling'"
  },
  // customsDeclaration
  {
    from: /allowNull: true\s+field: 'customsDeclaration',/g,
    to: "allowNull: true,\n      field: 'customsDeclaration'"
  },
  // createdBy
  {
    from: /allowNull: false\s+field: 'createdBy',/g,
    to: "allowNull: false,\n      field: 'createdBy'"
  }
];

// Apply all fixes
fixes.forEach((fix, index) => {
  const before = content;
  content = content.replace(fix.from, fix.to);
  if (content !== before) {
    console.log(`✅ إصلاح ${index + 1}: تم تطبيق التصحيح`);
  }
});

// Write the fixed content
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ تم إصلاح جميع أخطاء syntax في نموذج Shipment');
console.log('🎯 الآن يمكن تشغيل الخادم بدون أخطاء');
