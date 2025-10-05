import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: console.log });

async function testCreate() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    const queryInterface = sequelize.getQueryInterface();

    console.log('Attempting to create receipt_vouchers table...\n');
    
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
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    console.log('\n✅ Table created successfully!');
    
    await sequelize.close();
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error('\nFull error:', err);
    if (err.sql) console.error('\nSQL:', err.sql);
    if (err.original) console.error('\nOriginal:', err.original);
    process.exit(1);
  }
}

testCreate();
