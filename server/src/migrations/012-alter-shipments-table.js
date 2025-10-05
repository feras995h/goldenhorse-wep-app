import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  // Alter shipments table to match the current model structure (idempotent)
  console.log('🔍 Altering shipments table structure...');

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
    if (!(await columnExists('shipments', name))) {
      await queryInterface.addColumn('shipments', name, spec);
    }
  };

  await addCol('customerName', { type: DataTypes.STRING(200), allowNull: false, defaultValue: 'Unknown Customer' });
  await addCol('customerPhone', { type: DataTypes.STRING(20), allowNull: true });
  await addCol('itemDescription', { type: DataTypes.TEXT, allowNull: false, defaultValue: 'No description' });
  await addCol('itemDescriptionEn', { type: DataTypes.TEXT, allowNull: true });
  await addCol('category', { type: DataTypes.ENUM('electronics', 'clothing', 'accessories', 'books', 'toys', 'medical', 'industrial', 'other'), allowNull: false, defaultValue: 'other' });
  await addCol('quantity', { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 });
  await addCol('weight', { type: DataTypes.DECIMAL(10, 3), allowNull: false, defaultValue: 0.000 });
  await addCol('length', { type: DataTypes.DECIMAL(10, 2), allowNull: true });
  await addCol('width', { type: DataTypes.DECIMAL(10, 2), allowNull: true });
  await addCol('height', { type: DataTypes.DECIMAL(10, 2), allowNull: true });
  await addCol('volume', { type: DataTypes.DECIMAL(15, 3), allowNull: true });
  await addCol('volumeOverride', { type: DataTypes.DECIMAL(15, 3), allowNull: true });
  await addCol('declaredValue', { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 });
  await addCol('shippingCost', { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 });
  await addCol('originLocation', { type: DataTypes.STRING(200), allowNull: false, defaultValue: 'Unknown' });
  await addCol('destinationLocation', { type: DataTypes.STRING(200), allowNull: false, defaultValue: 'Unknown' });
  await addCol('status', { type: DataTypes.ENUM('received_china', 'in_transit', 'customs_clearance', 'out_for_delivery', 'delivered', 'returned'), allowNull: false, defaultValue: 'received_china' });
  await addCol('receivedDate', { type: DataTypes.DATEONLY, allowNull: false, defaultValue: Sequelize.literal('CURRENT_DATE') });
  await addCol('estimatedDelivery', { type: DataTypes.DATEONLY, allowNull: true });
  await addCol('actualDeliveryDate', { type: DataTypes.DATEONLY, allowNull: true });
  await addCol('notes', { type: DataTypes.TEXT, allowNull: true });
  await addCol('isFragile', { type: DataTypes.BOOLEAN, defaultValue: false });
  await addCol('requiresSpecialHandling', { type: DataTypes.BOOLEAN, defaultValue: false });
  await addCol('customsDeclaration', { type: DataTypes.TEXT, allowNull: true });
  await addCol('createdBy', { type: usersIdType, allowNull: false, defaultValue: (usersIdType === DataTypes.UUID ? '00000000-0000-0000-0000-000000000000' : 0) });

  // Rename columns if source exists and target missing
  const info = await queryInterface.describeTable('shipments');
  if (info.origin && !info.originLocation) await queryInterface.renameColumn('shipments', 'origin', 'originLocation');
  if (info.destination && !info.destinationLocation) await queryInterface.renameColumn('shipments', 'destination', 'destinationLocation');
  if (info.actualDelivery && !info.actualDeliveryDate) await queryInterface.renameColumn('shipments', 'actualDelivery', 'actualDeliveryDate');

  // Ensure status column type
  if (await columnExists('shipments', 'status')) {
    await queryInterface.changeColumn('shipments', 'status', {
      type: DataTypes.ENUM('received_china', 'in_transit', 'customs_clearance', 'out_for_delivery', 'delivered', 'returned'),
      allowNull: false,
      defaultValue: 'received_china'
    });
  }

  // Remove old columns if they exist
  const tableInfo = await queryInterface.describeTable('shipments');
  if (tableInfo.origin) await queryInterface.removeColumn('shipments', 'origin');
  if (tableInfo.destination) await queryInterface.removeColumn('shipments', 'destination');
  if (tableInfo.actualDelivery) await queryInterface.removeColumn('shipments', 'actualDelivery');

  // Update indexes
  await ensureIndex('shipments', ['trackingNumber'], 'shipments_trackingNumber');
  await ensureIndex('shipments', ['customerId'], 'shipments_customerId');
  await ensureIndex('shipments', ['status'], 'shipments_status');
  await ensureIndex('shipments', ['receivedDate'], 'shipments_receivedDate');
  await ensureIndex('shipments', ['createdBy'], 'shipments_createdBy');

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