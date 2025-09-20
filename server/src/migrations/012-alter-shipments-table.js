import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  // Alter shipments table to match the current model structure
  console.log('🔍 Altering shipments table structure...');
  
  // Add missing columns
  await queryInterface.addColumn('shipments', 'customerName', {
    type: DataTypes.STRING(200),
    allowNull: false,
    defaultValue: 'Unknown Customer'
  });
  
  await queryInterface.addColumn('shipments', 'customerPhone', {
    type: DataTypes.STRING(20),
    allowNull: true
  });
  
  await queryInterface.addColumn('shipments', 'itemDescription', {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: 'No description'
  });
  
  await queryInterface.addColumn('shipments', 'itemDescriptionEn', {
    type: DataTypes.TEXT,
    allowNull: true
  });
  
  await queryInterface.addColumn('shipments', 'category', {
    type: DataTypes.ENUM('electronics', 'clothing', 'accessories', 'books', 'toys', 'medical', 'industrial', 'other'),
    allowNull: false,
    defaultValue: 'other'
  });
  
  await queryInterface.addColumn('shipments', 'quantity', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  });
  
  await queryInterface.addColumn('shipments', 'weight', {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
    defaultValue: 0.000
  });
  
  await queryInterface.addColumn('shipments', 'length', {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  });
  
  await queryInterface.addColumn('shipments', 'width', {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  });
  
  await queryInterface.addColumn('shipments', 'height', {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  });
  
  await queryInterface.addColumn('shipments', 'volume', {
    type: DataTypes.DECIMAL(15, 3),
    allowNull: true
  });
  
  await queryInterface.addColumn('shipments', 'volumeOverride', {
    type: DataTypes.DECIMAL(15, 3),
    allowNull: true
  });
  
  await queryInterface.addColumn('shipments', 'declaredValue', {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  });
  
  await queryInterface.addColumn('shipments', 'shippingCost', {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  });
  
  await queryInterface.addColumn('shipments', 'originLocation', {
    type: DataTypes.STRING(200),
    allowNull: false,
    defaultValue: 'Unknown'
  });
  
  await queryInterface.addColumn('shipments', 'destinationLocation', {
    type: DataTypes.STRING(200),
    allowNull: false,
    defaultValue: 'Unknown'
  });
  
  await queryInterface.addColumn('shipments', 'status', {
    type: DataTypes.ENUM('received_china', 'in_transit', 'customs_clearance', 'out_for_delivery', 'delivered', 'returned'),
    allowNull: false,
    defaultValue: 'received_china'
  });
  
  await queryInterface.addColumn('shipments', 'receivedDate', {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_DATE')
  });
  
  await queryInterface.addColumn('shipments', 'estimatedDelivery', {
    type: DataTypes.DATEONLY,
    allowNull: true
  });
  
  await queryInterface.addColumn('shipments', 'actualDeliveryDate', {
    type: DataTypes.DATEONLY,
    allowNull: true
  });
  
  await queryInterface.addColumn('shipments', 'notes', {
    type: DataTypes.TEXT,
    allowNull: true
  });
  
  await queryInterface.addColumn('shipments', 'isFragile', {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  });
  
  await queryInterface.addColumn('shipments', 'requiresSpecialHandling', {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  });
  
  await queryInterface.addColumn('shipments', 'customsDeclaration', {
    type: DataTypes.TEXT,
    allowNull: true
  });
  
  await queryInterface.addColumn('shipments', 'createdBy', {
    type: DataTypes.UUID,
    allowNull: false,
    defaultValue: '00000000-0000-0000-0000-000000000000'  // Temporary default, should be updated
  });
  
  // Rename columns to match the model
  await queryInterface.renameColumn('shipments', 'origin', 'originLocation');
  await queryInterface.renameColumn('shipments', 'destination', 'destinationLocation');
  await queryInterface.renameColumn('shipments', 'actualDelivery', 'actualDeliveryDate');
  
  // Update ENUM values for status column
  // Note: In PostgreSQL, we need to recreate the column to change ENUM values
  await queryInterface.changeColumn('shipments', 'status', {
    type: DataTypes.ENUM('received_china', 'in_transit', 'customs_clearance', 'out_for_delivery', 'delivered', 'returned'),
    allowNull: false,
    defaultValue: 'received_china'
  });
  
  // Remove old columns if they exist
  const tableInfo = await queryInterface.describeTable('shipments');
  if (tableInfo.origin) {
    await queryInterface.removeColumn('shipments', 'origin');
  }
  if (tableInfo.destination) {
    await queryInterface.removeColumn('shipments', 'destination');
  }
  if (tableInfo.actualDelivery) {
    await queryInterface.removeColumn('shipments', 'actualDelivery');
  }
  
  // Update indexes
  await queryInterface.addIndex('shipments', ['trackingNumber']);
  await queryInterface.addIndex('shipments', ['customerId']);
  await queryInterface.addIndex('shipments', ['status']);
  await queryInterface.addIndex('shipments', ['receivedDate']);
  await queryInterface.addIndex('shipments', ['createdBy']);
  
  console.log('✅ Shipments table structure updated successfully');
}

export async function down(queryInterface, Sequelize) {
  // Revert changes (simplified for now)
  await queryInterface.removeColumn('shipments', 'customerName');
  await queryInterface.removeColumn('shipments', 'customerPhone');
  await queryInterface.removeColumn('shipments', 'itemDescription');
  await queryInterface.removeColumn('shipments', 'itemDescriptionEn');
  await queryInterface.removeColumn('shipments', 'category');
  await queryInterface.removeColumn('shipments', 'quantity');
  await queryInterface.removeColumn('shipments', 'weight');
  await queryInterface.removeColumn('shipments', 'length');
  await queryInterface.removeColumn('shipments', 'width');
  await queryInterface.removeColumn('shipments', 'height');
  await queryInterface.removeColumn('shipments', 'volume');
  await queryInterface.removeColumn('shipments', 'volumeOverride');
  await queryInterface.removeColumn('shipments', 'declaredValue');
  await queryInterface.removeColumn('shipments', 'originLocation');
  await queryInterface.removeColumn('shipments', 'destinationLocation');
  await queryInterface.removeColumn('shipments', 'receivedDate');
  await queryInterface.removeColumn('shipments', 'actualDeliveryDate');
  await queryInterface.removeColumn('shipments', 'notes');
  await queryInterface.removeColumn('shipments', 'isFragile');
  await queryInterface.removeColumn('shipments', 'requiresSpecialHandling');
  await queryInterface.removeColumn('shipments', 'customsDeclaration');
  await queryInterface.removeColumn('shipments', 'createdBy');
}