import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  // Create shipment_movements table
  await queryInterface.createTable('shipment_movements', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    shipmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'shipments',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    trackingNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [1, 50]
      }
    },
    type: {
      type: DataTypes.ENUM('status_update', 'location_change', 'delivery_attempt', 'customs_clearance', 'warehouse_release'),
      allowNull: false,
      defaultValue: 'status_update'
    },
    previousStatus: {
      type: DataTypes.ENUM('received_china', 'in_transit', 'customs_clearance', 'out_for_delivery', 'delivered', 'returned'),
      allowNull: true
    },
    newStatus: {
      type: DataTypes.ENUM('received_china', 'in_transit', 'customs_clearance', 'out_for_delivery', 'delivered', 'returned'),
      allowNull: false
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    handledBy: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    // Additional fields for warehouse release tracking
    warehouseReleaseOrderId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'warehouse_release_orders',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    isSystemGenerated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  // Add indexes
  await queryInterface.addIndex('shipment_movements', ['shipmentId']);
  await queryInterface.addIndex('shipment_movements', ['trackingNumber']);
  await queryInterface.addIndex('shipment_movements', ['type']);
  await queryInterface.addIndex('shipment_movements', ['newStatus']);
  await queryInterface.addIndex('shipment_movements', ['date']);
  await queryInterface.addIndex('shipment_movements', ['createdBy']);
  await queryInterface.addIndex('shipment_movements', ['warehouseReleaseOrderId']);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('shipment_movements');
}