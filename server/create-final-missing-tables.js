import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

async function createFinalMissingTables() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    const queryInterface = sequelize.getQueryInterface();

    // Check existing tables
    const [existingTables] = await sequelize.query(`
      SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'
    `);
    const existing = existingTables.map(t => t.tablename);

    console.log('🔨 Creating final missing tables...\n');
    console.log('='.repeat(60));

    // 1. Create company_logo table
    if (!existing.includes('company_logo')) {
      console.log('\n🔨 Creating table: company_logo');
      await queryInterface.createTable('company_logo', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        filename: {
          type: Sequelize.STRING,
          allowNull: false
        },
        original_name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        mimetype: {
          type: Sequelize.STRING,
          allowNull: false
        },
        size: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        data: {
          type: Sequelize.BLOB('long'),
          allowNull: false
        },
        upload_date: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      });
      console.log('   ✅ company_logo created');
    } else {
      console.log('\n⏭️  company_logo already exists');
    }

    // 2. Create purchase_invoice_payments table
    if (!existing.includes('purchase_invoice_payments')) {
      console.log('\n🔨 Creating table: purchase_invoice_payments');
      await queryInterface.createTable('purchase_invoice_payments', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        invoiceId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'purchase_invoices', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        paymentId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'payments', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        allocatedAmount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false
        },
        currency: {
          type: Sequelize.STRING(3),
          defaultValue: 'LYD'
        },
        exchangeRate: {
          type: Sequelize.DECIMAL(10, 6),
          defaultValue: 1.000000
        },
        allocationDate: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        settlementOrder: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        isFullySettled: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        remainingAmount: {
          type: Sequelize.DECIMAL(15, 2),
          defaultValue: 0.00
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        createdBy: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' }
        },
        isReversed: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        reversedAt: {
          type: Sequelize.DATE,
          allowNull: true
        },
        reversedBy: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'users', key: 'id' }
        },
        reversalReason: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      });

      await queryInterface.addIndex('purchase_invoice_payments', ['invoiceId']);
      await queryInterface.addIndex('purchase_invoice_payments', ['paymentId']);
      await queryInterface.addIndex('purchase_invoice_payments', ['allocationDate']);
      await queryInterface.addIndex('purchase_invoice_payments', ['settlementOrder']);
      await queryInterface.addIndex('purchase_invoice_payments', ['isFullySettled']);
      await queryInterface.addIndex('purchase_invoice_payments', ['isReversed']);
      await queryInterface.addIndex('purchase_invoice_payments', ['createdBy']);
      
      console.log('   ✅ purchase_invoice_payments created');
    } else {
      console.log('\n⏭️  purchase_invoice_payments already exists');
    }

    // 3. Create sales_invoice_payments table
    if (!existing.includes('sales_invoice_payments')) {
      console.log('\n🔨 Creating table: sales_invoice_payments');
      await queryInterface.createTable('sales_invoice_payments', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        invoiceId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'sales_invoices', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        paymentId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'payments', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        allocatedAmount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false
        },
        currency: {
          type: Sequelize.STRING(3),
          defaultValue: 'LYD'
        },
        exchangeRate: {
          type: Sequelize.DECIMAL(10, 6),
          defaultValue: 1.000000
        },
        allocationDate: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        createdBy: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' }
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      });

      await queryInterface.addIndex('sales_invoice_payments', ['invoiceId']);
      await queryInterface.addIndex('sales_invoice_payments', ['paymentId']);
      await queryInterface.addIndex('sales_invoice_payments', ['allocationDate']);
      await queryInterface.addIndex('sales_invoice_payments', ['createdBy']);
      
      console.log('   ✅ sales_invoice_payments created');
    } else {
      console.log('\n⏭️  sales_invoice_payments already exists');
    }

    // 4. Create stock_movements table
    if (!existing.includes('stock_movements')) {
      console.log('\n🔨 Creating table: stock_movements');
      await queryInterface.createTable('stock_movements', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        itemCode: {
          type: Sequelize.STRING(50),
          allowNull: false
        },
        description: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        quantity: {
          type: Sequelize.DECIMAL(15, 3),
          allowNull: false
        },
        unit: {
          type: Sequelize.STRING(20),
          allowNull: false
        },
        direction: {
          type: Sequelize.ENUM('in', 'out'),
          allowNull: false
        },
        reason: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        referenceType: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        referenceId: {
          type: Sequelize.UUID,
          allowNull: true
        },
        warehouseLocation: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        date: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        shipmentId: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'shipments', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        warehouseReleaseOrderId: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'warehouse_release_orders', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        invoiceId: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'invoices', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        createdBy: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' }
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      });

      await queryInterface.addIndex('stock_movements', ['itemCode']);
      await queryInterface.addIndex('stock_movements', ['direction']);
      await queryInterface.addIndex('stock_movements', ['date']);
      await queryInterface.addIndex('stock_movements', ['shipmentId']);
      await queryInterface.addIndex('stock_movements', ['warehouseReleaseOrderId']);
      await queryInterface.addIndex('stock_movements', ['invoiceId']);
      await queryInterface.addIndex('stock_movements', ['createdBy']);
      
      console.log('   ✅ stock_movements created');
    } else {
      console.log('\n⏭️  stock_movements already exists');
    }

    // 5. Create audit_logs table
    if (!existing.includes('audit_logs')) {
      console.log('\n🔨 Creating table: audit_logs');
      await queryInterface.createTable('audit_logs', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        userId: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        action: {
          type: Sequelize.STRING(50),
          allowNull: false
        },
        entityType: {
          type: Sequelize.STRING(50),
          allowNull: false
        },
        entityId: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        oldValues: {
          type: Sequelize.JSONB,
          allowNull: true
        },
        newValues: {
          type: Sequelize.JSONB,
          allowNull: true
        },
        changes: {
          type: Sequelize.JSONB,
          allowNull: true
        },
        ipAddress: {
          type: Sequelize.STRING(45),
          allowNull: true
        },
        userAgent: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        timestamp: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      });

      await queryInterface.addIndex('audit_logs', ['userId']);
      await queryInterface.addIndex('audit_logs', ['action']);
      await queryInterface.addIndex('audit_logs', ['entityType']);
      await queryInterface.addIndex('audit_logs', ['entityId']);
      await queryInterface.addIndex('audit_logs', ['timestamp']);
      
      console.log('   ✅ audit_logs created');
    } else {
      console.log('\n⏭️  audit_logs already exists');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All missing tables created successfully!');

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createFinalMissingTables();