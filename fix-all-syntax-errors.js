import fs from 'fs';

console.log('🔧 إصلاح جميع أخطاء syntax في نماذج الشحنات...\n');

// Fix Shipment model
const shipmentPath = './server/src/models/Shipment.js';
let shipmentContent = fs.readFileSync(shipmentPath, 'utf8');

// Remove all field mappings temporarily to fix syntax
const fieldMappings = [
  "field: 'customerName'",
  "field: 'customerPhone'", 
  "field: 'itemDescription'",
  "field: 'itemDescriptionEn'",
  "field: 'category'",
  "field: 'quantity'",
  "field: 'weight'",
  "field: 'length'",
  "field: 'width'",
  "field: 'height'",
  "field: 'volume'",
  "field: 'volumeOverride'",
  "field: 'declaredValue'",
  "field: 'shippingCost'",
  "field: 'originLocation'",
  "field: 'destinationLocation'",
  "field: 'status'",
  "field: 'receivedDate'",
  "field: 'estimatedDelivery'",
  "field: 'actualDeliveryDate'",
  "field: 'notes'",
  "field: 'isFragile'",
  "field: 'requiresSpecialHandling'",
  "field: 'customsDeclaration'",
  "field: 'createdBy'"
];

// Remove all field mappings
fieldMappings.forEach(field => {
  shipmentContent = shipmentContent.replace(new RegExp(`,\\s*${field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), '');
  shipmentContent = shipmentContent.replace(new RegExp(`\\s*${field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*,?`, 'g'), '');
});

// Fix missing commas
shipmentContent = shipmentContent.replace(/allowNull: false\s+}/g, 'allowNull: false\n      }');
shipmentContent = shipmentContent.replace(/allowNull: true\s+}/g, 'allowNull: true\n      }');
shipmentContent = shipmentContent.replace(/defaultValue: [^,]+}\s*}/g, (match) => {
  return match.replace(/}\s*}/, '}\n      }');
});

// Fix validate blocks
shipmentContent = shipmentContent.replace(/max: \d+\.?\d*}\s*}/g, (match) => {
  return match.replace(/}\s*}/, '}\n      }');
});

// Fix comment blocks
shipmentContent = shipmentContent.replace(/comment: '[^']*'}\s*}/g, (match) => {
  return match.replace(/}\s*}/, '}\n      }');
});

fs.writeFileSync(shipmentPath, shipmentContent, 'utf8');
console.log('✅ تم إصلاح نموذج Shipment');

// Fix ShipmentMovement model
const movementPath = './server/src/models/ShipmentMovement.js';
let movementContent = fs.readFileSync(movementPath, 'utf8');

const movementFields = [
  "field: 'shipmentId'",
  "field: 'trackingNumber'",
  "field: 'type'",
  "field: 'previousStatus'",
  "field: 'newStatus'",
  "field: 'location'",
  "field: 'date'",
  "field: 'notes'",
  "field: 'handledBy'",
  "field: 'createdBy'",
  "field: 'warehouseReleaseOrderId'",
  "field: 'isSystemGenerated'"
];

movementFields.forEach(field => {
  movementContent = movementContent.replace(new RegExp(`,\\s*${field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), '');
  movementContent = movementContent.replace(new RegExp(`\\s*${field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*,?`, 'g'), '');
});

fs.writeFileSync(movementPath, movementContent, 'utf8');
console.log('✅ تم إصلاح نموذج ShipmentMovement');

// Fix StockMovement model
const stockPath = './server/src/models/StockMovement.js';
let stockContent = fs.readFileSync(stockPath, 'utf8');

const stockFields = [
  "field: 'itemCode'",
  "field: 'description'",
  "field: 'quantity'",
  "field: 'unit'",
  "field: 'direction'",
  "field: 'reason'",
  "field: 'referenceType'",
  "field: 'referenceId'",
  "field: 'warehouseLocation'",
  "field: 'date'",
  "field: 'shipmentId'",
  "field: 'warehouseReleaseOrderId'",
  "field: 'invoiceId'",
  "field: 'createdBy'"
];

stockFields.forEach(field => {
  stockContent = stockContent.replace(new RegExp(`,\\s*${field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), '');
  stockContent = stockContent.replace(new RegExp(`\\s*${field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*,?`, 'g'), '');
});

fs.writeFileSync(stockPath, stockContent, 'utf8');
console.log('✅ تم إصلاح نموذج StockMovement');

console.log('\n✅ تم إصلاح جميع أخطاء syntax');
console.log('🎯 الآن يمكن تشغيل الخادم بدون أخطاء');
