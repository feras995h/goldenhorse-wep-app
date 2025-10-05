import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  // Determine users.id data type to match FK type
  const [rows] = await queryInterface.sequelize.query(
    "SELECT data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'users' AND column_name = 'id'"
  );
  const usersIdType = (rows && rows[0] && rows[0].data_type === 'uuid') ? DataTypes.UUID : DataTypes.INTEGER;

  // Create shipments table
  await queryInterface.createTable('shipments', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    trackingNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 50]
      }
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    customerName: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    customerPhone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    itemDescription: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    itemDescriptionEn: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.ENUM('electronics', 'clothing', 'accessories', 'books', 'toys', 'medical', 'industrial', 'other'),
      allowNull: false,
      defaultValue: 'other'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 999999
      }
    },
    weight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0.000,
      validate: {
        min: 0,
        max: 9999999.999
      }
    },
    length: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 99999999.99
      }
    },
    width: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 99999999.99
      }
    },
    height: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 99999999.99
      }
    },
    volume: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: true,
      validate: {
        min: 0,
        max: 999999999999.999
      }
    },
    volumeOverride: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: true,
      validate: {
        min: 0,
        max: 999999999999.999
      }
    },
    declaredValue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    shippingCost: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    originLocation: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    destinationLocation: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('received_china', 'in_transit', 'customs_clearance', 'out_for_delivery', 'delivered', 'returned'),
      allowNull: false,
      defaultValue: 'received_china'
    },
    receivedDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    estimatedDelivery: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    actualDeliveryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isFragile: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    requiresSpecialHandling: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    customsDeclaration: {
      type: DataTypes.TEXT,
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
    const [rows2] = await queryInterface.sequelize.query(
      "SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = :name",
      { replacements: { name } }
    );
    return rows2.length > 0;
  };
  const columnExists = async (table, column) => {
    const [rows3] = await queryInterface.sequelize.query(
      "SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = :table AND column_name = :column",
      { replacements: { table, column } }
    );
    return rows3.length > 0;
  };
  const ensureIndex = async (table, columns, name) => {
    const cols = Array.isArray(columns) ? columns : [String(columns)];
    for (const col of cols) {
      if (!(await columnExists(table, col))) return;
    }
    if (await indexExists(name)) return;
    await queryInterface.addIndex(table, cols, { name });
  };

  await ensureIndex('shipments', ['trackingNumber'], 'shipments_trackingNumber');
  await ensureIndex('shipments', ['customerId'], 'shipments_customerId');
  await ensureIndex('shipments', ['status'], 'shipments_status');
  await ensureIndex('shipments', ['receivedDate'], 'shipments_receivedDate');
  await ensureIndex('shipments', ['createdBy'], 'shipments_createdBy');
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('shipments');
}