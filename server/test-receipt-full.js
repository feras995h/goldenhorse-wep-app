import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

async function testCreate() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    const queryInterface = sequelize.getQueryInterface();

    // Drop table if exists
    try {
      await queryInterface.dropTable('receipt_vouchers');
      console.log('Dropped existing receipt_vouchers table');
    } catch (e) {
      console.log('No existing table to drop');
    }

    console.log('\nAttempting to create receipt_vouchers table with full schema...\n');
    
    await queryInterface.createTable('receipt_vouchers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      voucherNumber: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      customerId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id'
        }
      },
      customerName: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      shipmentId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'shipments',
          key: 'id'
        }
      },
      paymentMethod: {
        type: Sequelize.ENUM('cash', 'bank_transfer', 'check', 'credit_card', 'other'),
        allowNull: false,
        defaultValue: 'cash'
      },
      currency: {
        type: Sequelize.ENUM('LYD', 'USD', 'EUR', 'CNY'),
        allowNull: false,
        defaultValue: 'LYD'
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      purpose: {
        type: Sequelize.ENUM('invoice_payment', 'advance_payment', 'settlement', 'refund', 'other'),
        allowNull: false,
        defaultValue: 'invoice_payment'
      },
      purposeDescription: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      debitAccountId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'accounts',
          key: 'id'
        }
      },
      creditAccountId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'accounts',
          key: 'id'
        }
      },
      exchangeRate: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: false,
        defaultValue: 1.0000
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      attachments: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      status: {
        type: Sequelize.ENUM('draft', 'posted', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft'
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      approvedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      approvedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    console.log('✅ Table created successfully!');
    
    await sequelize.close();
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error('\nError name:', err.name);
    if (err.sql) console.error('\nSQL:', err.sql);
    if (err.original) {
      console.error('\nOriginal error:', err.original.message);
      console.error('Original detail:', err.original.detail);
    }
    await sequelize.close();
    process.exit(1);
  }
}

testCreate();
