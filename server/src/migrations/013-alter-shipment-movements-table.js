import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  // Alter shipment_movements table to match the current model structure (idempotent)
  console.log('🔍 Altering shipment_movements table structure...');

  const columnExists = async (table, column) => {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = :table AND column_name = :column",
      { replacements: { table, column } }
    );
    return rows.length > 0;
  };
  const indexExists = async (name) => {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = :name",
      { replacements: { name } }
    );
    return rows.length > 0;
  };
  const ensureIndex = async (table, columns, name) => {
    const cols = Array.isArray(columns) ? columns : [String(columns)];
    for (const col of cols) {
      if (!(await columnExists(table, col))) return;
    }
    if (await indexExists(name)) return;
    await queryInterface.addIndex(table, cols, { name });
  };

  // Detect users.id type for createdBy
  const [u] = await queryInterface.sequelize.query(
    "SELECT data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'users' AND column_name = 'id'"
  );
  const usersIdType = (u && u[0] && u[0].data_type === 'uuid') ? DataTypes.UUID : DataTypes.INTEGER;

  const addCol = async (name, spec) => {
    if (!(await columnExists('shipment_movements', name))) {
      await queryInterface.addColumn('shipment_movements', name, spec);
    }
  };

  // Add missing columns
  await addCol('trackingNumber', { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'UNKNOWN' });
  await addCol('type', { type: DataTypes.ENUM('status_update', 'location_change', 'delivery_attempt', 'customs_clearance', 'warehouse_release'), allowNull: false, defaultValue: 'status_update' });
  await addCol('date', { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') });
  await addCol('handledBy', { type: DataTypes.STRING(100), allowNull: true });
  await addCol('createdBy', { type: usersIdType, allowNull: false, defaultValue: (usersIdType === DataTypes.UUID ? '00000000-0000-0000-0000-000000000000' : 0) });
  await addCol('warehouseReleaseOrderId', { type: DataTypes.UUID, allowNull: true });
  await addCol('isSystemGenerated', { type: DataTypes.BOOLEAN, defaultValue: false });

  // Rename columns if needed
  const info = await queryInterface.describeTable('shipment_movements');
  if (info.movedBy && !info.createdBy) await queryInterface.renameColumn('shipment_movements', 'movedBy', 'createdBy');
  if (info.movedAt && !info.date) await queryInterface.renameColumn('shipment_movements', 'movedAt', 'date');

  // Update ENUM values for status columns if exist
  if (await columnExists('shipment_movements', 'previousStatus')) {
    await queryInterface.changeColumn('shipment_movements', 'previousStatus', {
      type: DataTypes.ENUM('received_china', 'in_transit', 'customs_clearance', 'out_for_delivery', 'delivered', 'returned'),
      allowNull: true
    });
  }
  if (await columnExists('shipment_movements', 'newStatus')) {
    await queryInterface.changeColumn('shipment_movements', 'newStatus', {
      type: DataTypes.ENUM('received_china', 'in_transit', 'customs_clearance', 'out_for_delivery', 'delivered', 'returned'),
      allowNull: false
    });
  }

  // Add missing indexes
  await ensureIndex('shipment_movements', ['trackingNumber'], 'shipment_movements_trackingNumber');
  await ensureIndex('shipment_movements', ['type'], 'shipment_movements_type');
  await ensureIndex('shipment_movements', ['newStatus'], 'shipment_movements_newStatus');
  await ensureIndex('shipment_movements', ['date'], 'shipment_movements_date');
  await ensureIndex('shipment_movements', ['createdBy'], 'shipment_movements_createdBy');
  await ensureIndex('shipment_movements', ['warehouseReleaseOrderId'], 'shipment_movements_warehouseReleaseOrderId');

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