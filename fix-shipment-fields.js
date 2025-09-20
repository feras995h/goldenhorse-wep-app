import fs from 'fs';

console.log('🔧 إصلاح أسماء الحقول في نموذج Shipment...\n');

// Read the current Shipment model
const filePath = './server/src/models/Shipment.js';
let content = fs.readFileSync(filePath, 'utf8');

// Define field mappings for all fields
const fieldMappings = {
  'trackingNumber': 'trackingNumber',
  'customerId': 'customerId', 
  'customerName': 'customerName',
  'customerPhone': 'customerPhone',
  'itemDescription': 'itemDescription',
  'itemDescriptionEn': 'itemDescriptionEn',
  'category': 'category',
  'quantity': 'quantity',
  'weight': 'weight',
  'length': 'length',
  'width': 'width',
  'height': 'height',
  'volume': 'volume',
  'volumeOverride': 'volumeOverride',
  'declaredValue': 'declaredValue',
  'shippingCost': 'shippingCost',
  'originLocation': 'originLocation',
  'destinationLocation': 'destinationLocation',
  'status': 'status',
  'receivedDate': 'receivedDate',
  'estimatedDelivery': 'estimatedDelivery',
  'actualDeliveryDate': 'actualDeliveryDate',
  'notes': 'notes',
  'isFragile': 'isFragile',
  'requiresSpecialHandling': 'requiresSpecialHandling',
  'customsDeclaration': 'customsDeclaration',
  'createdBy': 'createdBy'
};

// Add field mappings to each field
Object.keys(fieldMappings).forEach(fieldName => {
  const fieldRegex = new RegExp(`(${fieldName}:\\s*{[^}]*?)(\\s*},)`, 'gs');
  content = content.replace(fieldRegex, (match, fieldDef, closing) => {
    // Check if field mapping already exists
    if (fieldDef.includes('field:')) {
      return match;
    }
    
    // Add field mapping before the closing brace
    const fieldMapping = `      field: '${fieldMappings[fieldName]}',`;
    return fieldDef + '\n' + fieldMapping + closing;
  });
});

// Write the updated content
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ تم إصلاح أسماء الحقول في نموذج Shipment');
console.log('📋 الحقول المُصلحة:');
Object.keys(fieldMappings).forEach(fieldName => {
  console.log(`  - ${fieldName} → ${fieldMappings[fieldName]}`);
});

console.log('\n🔧 إصلاح أسماء الحقول في نموذج ShipmentMovement...\n');

// Fix ShipmentMovement model
const shipmentMovementPath = './server/src/models/ShipmentMovement.js';
let movementContent = fs.readFileSync(shipmentMovementPath, 'utf8');

const movementFieldMappings = {
  'shipmentId': 'shipmentId',
  'trackingNumber': 'trackingNumber',
  'type': 'type',
  'previousStatus': 'previousStatus',
  'newStatus': 'newStatus',
  'location': 'location',
  'date': 'date',
  'notes': 'notes',
  'handledBy': 'handledBy',
  'createdBy': 'createdBy',
  'warehouseReleaseOrderId': 'warehouseReleaseOrderId',
  'isSystemGenerated': 'isSystemGenerated'
};

Object.keys(movementFieldMappings).forEach(fieldName => {
  const fieldRegex = new RegExp(`(${fieldName}:\\s*{[^}]*?)(\\s*},)`, 'gs');
  movementContent = movementContent.replace(fieldRegex, (match, fieldDef, closing) => {
    if (fieldDef.includes('field:')) {
      return match;
    }
    
    const fieldMapping = `      field: '${movementFieldMappings[fieldName]}',`;
    return fieldDef + '\n' + fieldMapping + closing;
  });
});

fs.writeFileSync(shipmentMovementPath, movementContent, 'utf8');

console.log('✅ تم إصلاح أسماء الحقول في نموذج ShipmentMovement');
console.log('📋 الحقول المُصلحة:');
Object.keys(movementFieldMappings).forEach(fieldName => {
  console.log(`  - ${fieldName} → ${movementFieldMappings[fieldName]}`);
});

console.log('\n🔧 إصلاح أسماء الحقول في نموذج StockMovement...\n');

// Fix StockMovement model
const stockMovementPath = './server/src/models/StockMovement.js';
let stockContent = fs.readFileSync(stockMovementPath, 'utf8');

const stockFieldMappings = {
  'itemCode': 'itemCode',
  'description': 'description',
  'quantity': 'quantity',
  'unit': 'unit',
  'direction': 'direction',
  'reason': 'reason',
  'referenceType': 'referenceType',
  'referenceId': 'referenceId',
  'warehouseLocation': 'warehouseLocation',
  'date': 'date',
  'shipmentId': 'shipmentId',
  'warehouseReleaseOrderId': 'warehouseReleaseOrderId',
  'invoiceId': 'invoiceId',
  'createdBy': 'createdBy'
};

Object.keys(stockFieldMappings).forEach(fieldName => {
  const fieldRegex = new RegExp(`(${fieldName}:\\s*{[^}]*?)(\\s*},)`, 'gs');
  stockContent = stockContent.replace(fieldRegex, (match, fieldDef, closing) => {
    if (fieldDef.includes('field:')) {
      return match;
    }
    
    const fieldMapping = `      field: '${stockFieldMappings[fieldName]}',`;
    return fieldDef + '\n' + fieldMapping + closing;
  });
});

fs.writeFileSync(stockMovementPath, stockContent, 'utf8');

console.log('✅ تم إصلاح أسماء الحقول في نموذج StockMovement');
console.log('📋 الحقول المُصلحة:');
Object.keys(stockFieldMappings).forEach(fieldName => {
  console.log(`  - ${fieldName} → ${stockFieldMappings[fieldName]}`);
});

console.log('\n✅ تم إصلاح جميع نماذج الشحنات!');
console.log('🎯 الآن يجب أن تعمل API الشحنات بدون أخطاء 500');
