import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  // Determine users.id data type to match FK type
  const [rows] = await queryInterface.sequelize.query(
    "SELECT data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'users' AND column_name = 'id'"
  );
  const usersIdType = (rows && rows[0] && rows[0].data_type === 'uuid') ? DataTypes.UUID : DataTypes.INTEGER;

  // Detect optional dependencies
  const [wroRes] = await queryInterface.sequelize.query(
    "SELECT (to_regclass(current_schema() || '.warehouse_release_orders') IS NULL) AS missing"
  );
  const warehouseReleaseOrdersMissing = wroRes && wroRes[0] && wroRes[0].missing === true;

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
      type: usersIdType,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    // Additional fields for warehouse release tracking
    warehouseReleaseOrderId: Object.assign({ type: DataTypes.UUID, allowNull: true },
      warehouseReleaseOrdersMissing ? {} : { references: { model: 'warehouse_release_orders', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' }
    ),
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

  // Add indexes safely
  const indexExists = async (name) => {
    const [idxRows] = await queryInterface.sequelize.query(
      "SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = :name",
      { replacements: { name } }
    );
    return idxRows.length > 0;
  };
  const columnExists = async (table, column) => {
    const [colRows] = await queryInterface.sequelize.query(
      "SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = :table AND column_name = :column",
      { replacements: { table, column } }
    );
    return colRows.length > 0;
  };
  const ensureIndex = async (table, columns, name) => {
    const cols = Array.isArray(columns) ? columns : [String(columns)];
    for (const col of cols) {
      if (!(await columnExists(table, col))) return;
    }
    if (await indexExists(name)) return;
    await queryInterface.addIndex(table, cols, { name });
  };

  await ensureIndex('shipment_movements', ['shipmentId'], 'shipment_movements_shipmentId');
  await ensureIndex('shipment_movements', ['trackingNumber'], 'shipment_movements_trackingNumber');
  await ensureIndex('shipment_movements', ['type'], 'shipment_movements_type');
  await ensureIndex('shipment_movements', ['newStatus'], 'shipment_movements_newStatus');
  await ensureIndex('shipment_movements', ['date'], 'shipment_movements_date');
  await ensureIndex('shipment_movements', ['createdBy'], 'shipment_movements_createdBy');
  await ensureIndex('shipment_movements', ['warehouseReleaseOrderId'], 'shipment_movements_warehouseReleaseOrderId');
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('shipment_movements');
}