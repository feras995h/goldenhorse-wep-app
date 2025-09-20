import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  // Alter shipment_movements table to match the current model structure
  console.log('🔍 Altering shipment_movements table structure...');
  
  // Add missing columns
  await queryInterface.addColumn('shipment_movements', 'trackingNumber', {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'UNKNOWN'
  });
  
  await queryInterface.addColumn('shipment_movements', 'type', {
    type: DataTypes.ENUM('status_update', 'location_change', 'delivery_attempt', 'customs_clearance', 'warehouse_release'),
    allowNull: false,
    defaultValue: 'status_update'
  });
  
  await queryInterface.addColumn('shipment_movements', 'date', {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  });
  
  await queryInterface.addColumn('shipment_movements', 'handledBy', {
    type: DataTypes.STRING(100),
    allowNull: true
  });
  
  await queryInterface.addColumn('shipment_movements', 'createdBy', {
    type: DataTypes.UUID,
    allowNull: false,
    defaultValue: '00000000-0000-0000-0000-000000000000'  // Temporary default
  });
  
  await queryInterface.addColumn('shipment_movements', 'warehouseReleaseOrderId', {
    type: DataTypes.UUID,
    allowNull: true
  });
  
  await queryInterface.addColumn('shipment_movements', 'isSystemGenerated', {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  });
  
  // Rename columns to match the model
  await queryInterface.renameColumn('shipment_movements', 'movedBy', 'createdBy');
  await queryInterface.renameColumn('shipment_movements', 'movedAt', 'date');
  
  // Update ENUM values for status columns
  await queryInterface.changeColumn('shipment_movements', 'previousStatus', {
    type: DataTypes.ENUM('received_china', 'in_transit', 'customs_clearance', 'out_for_delivery', 'delivered', 'returned'),
    allowNull: true
  });
  
  await queryInterface.changeColumn('shipment_movements', 'newStatus', {
    type: DataTypes.ENUM('received_china', 'in_transit', 'customs_clearance', 'out_for_delivery', 'delivered', 'returned'),
    allowNull: false
  });
  
  // Add missing indexes
  await queryInterface.addIndex('shipment_movements', ['trackingNumber']);
  await queryInterface.addIndex('shipment_movements', ['type']);
  await queryInterface.addIndex('shipment_movements', ['newStatus']);
  await queryInterface.addIndex('shipment_movements', ['date']);
  await queryInterface.addIndex('shipment_movements', ['createdBy']);
  await queryInterface.addIndex('shipment_movements', ['warehouseReleaseOrderId']);
  
  console.log('✅ Shipment movements table structure updated successfully');
}

export async function down(queryInterface, Sequelize) {
  // Revert changes (simplified for now)
  await queryInterface.removeColumn('shipment_movements', 'trackingNumber');
  await queryInterface.removeColumn('shipment_movements', 'type');
  await queryInterface.removeColumn('shipment_movements', 'date');
  await queryInterface.removeColumn('shipment_movements', 'handledBy');
  await queryInterface.removeColumn('shipment_movements', 'warehouseReleaseOrderId');
  await queryInterface.removeColumn('shipment_movements', 'isSystemGenerated');
  
  // Rename columns back
  await queryInterface.renameColumn('shipment_movements', 'createdBy', 'movedBy');
  await queryInterface.renameColumn('shipment_movements', 'date', 'movedAt');
}