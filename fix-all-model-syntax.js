import fs from 'fs';

console.log('🔧 إصلاح أخطاء syntax في جميع نماذج الشحنات...\n');

// Fix ShipmentMovement model
const shipmentMovementPath = './server/src/models/ShipmentMovement.js';
let movementContent = fs.readFileSync(shipmentMovementPath, 'utf8');

const movementFixes = [
  // shipmentId
  {
    from: /allowNull: false\s+field: 'shipmentId',/g,
    to: "allowNull: false,\n      field: 'shipmentId'"
  },
  // trackingNumber
  {
    from: /max: 50\s+}\s+field: 'trackingNumber',/g,
    to: "max: 50\n      },\n      field: 'trackingNumber'"
  },
  // type
  {
    from: /defaultValue: 'status_update'\s+field: 'type',/g,
    to: "defaultValue: 'status_update',\n      field: 'type'"
  },
  // previousStatus
  {
    from: /allowNull: true\s+field: 'previousStatus',/g,
    to: "allowNull: true,\n      field: 'previousStatus'"
  },
  // newStatus
  {
    from: /allowNull: false\s+field: 'newStatus',/g,
    to: "allowNull: false,\n      field: 'newStatus'"
  },
  // location
  {
    from: /allowNull: false\s+field: 'location',/g,
    to: "allowNull: false,\n      field: 'location'"
  },
  // date
  {
    from: /defaultValue: DataTypes\.NOW\s+field: 'date',/g,
    to: "defaultValue: DataTypes.NOW,\n      field: 'date'"
  },
  // notes
  {
    from: /allowNull: true\s+field: 'notes',/g,
    to: "allowNull: true,\n      field: 'notes'"
  },
  // handledBy
  {
    from: /allowNull: true\s+field: 'handledBy',/g,
    to: "allowNull: true,\n      field: 'handledBy'"
  },
  // createdBy
  {
    from: /allowNull: false\s+field: 'createdBy',/g,
    to: "allowNull: false,\n      field: 'createdBy'"
  },
  // warehouseReleaseOrderId
  {
    from: /allowNull: true\s+field: 'warehouseReleaseOrderId',/g,
    to: "allowNull: true,\n      field: 'warehouseReleaseOrderId'"
  },
  // isSystemGenerated
  {
    from: /defaultValue: false\s+field: 'isSystemGenerated',/g,
    to: "defaultValue: false,\n      field: 'isSystemGenerated'"
  }
];

movementFixes.forEach((fix, index) => {
  const before = movementContent;
  movementContent = movementContent.replace(fix.from, fix.to);
  if (movementContent !== before) {
    console.log(`✅ إصلاح ShipmentMovement ${index + 1}: تم تطبيق التصحيح`);
  }
});

fs.writeFileSync(shipmentMovementPath, movementContent, 'utf8');

// Fix StockMovement model
const stockMovementPath = './server/src/models/StockMovement.js';
let stockContent = fs.readFileSync(stockMovementPath, 'utf8');

const stockFixes = [
  // itemCode
  {
    from: /allowNull: true\s+field: 'itemCode',/g,
    to: "allowNull: true,\n      field: 'itemCode'"
  },
  // description
  {
    from: /allowNull: false\s+field: 'description',/g,
    to: "allowNull: false,\n      field: 'description'"
  },
  // quantity
  {
    from: /defaultValue: 0\s+field: 'quantity',/g,
    to: "defaultValue: 0,\n      field: 'quantity'"
  },
  // unit
  {
    from: /defaultValue: 'قطعة'\s+field: 'unit',/g,
    to: "defaultValue: 'قطعة',\n      field: 'unit'"
  },
  // direction
  {
    from: /defaultValue: 'out'\s+field: 'direction',/g,
    to: "defaultValue: 'out',\n      field: 'direction'"
  },
  // reason
  {
    from: /allowNull: true\s+field: 'reason',/g,
    to: "allowNull: true,\n      field: 'reason'"
  },
  // referenceType
  {
    from: /allowNull: true\s+field: 'referenceType',/g,
    to: "allowNull: true,\n      field: 'referenceType'"
  },
  // referenceId
  {
    from: /allowNull: true\s+field: 'referenceId',/g,
    to: "allowNull: true,\n      field: 'referenceId'"
  },
  // warehouseLocation
  {
    from: /allowNull: true\s+field: 'warehouseLocation',/g,
    to: "allowNull: true,\n      field: 'warehouseLocation'"
  },
  // date
  {
    from: /defaultValue: DataTypes\.NOW\s+field: 'date',/g,
    to: "defaultValue: DataTypes.NOW,\n      field: 'date'"
  },
  // shipmentId
  {
    from: /allowNull: true\s+field: 'shipmentId',/g,
    to: "allowNull: true,\n      field: 'shipmentId'"
  },
  // warehouseReleaseOrderId
  {
    from: /allowNull: true\s+field: 'warehouseReleaseOrderId',/g,
    to: "allowNull: true,\n      field: 'warehouseReleaseOrderId'"
  },
  // invoiceId
  {
    from: /allowNull: true\s+field: 'invoiceId',/g,
    to: "allowNull: true,\n      field: 'invoiceId'"
  },
  // createdBy
  {
    from: /allowNull: true\s+field: 'createdBy',/g,
    to: "allowNull: true,\n      field: 'createdBy'"
  }
];

stockFixes.forEach((fix, index) => {
  const before = stockContent;
  stockContent = stockContent.replace(fix.from, fix.to);
  if (stockContent !== before) {
    console.log(`✅ إصلاح StockMovement ${index + 1}: تم تطبيق التصحيح`);
  }
});

fs.writeFileSync(stockMovementPath, stockContent, 'utf8');

console.log('\n✅ تم إصلاح جميع أخطاء syntax في نماذج الشحنات');
console.log('🎯 الآن يمكن تشغيل الخادم بدون أخطاء');

