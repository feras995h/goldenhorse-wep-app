import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

async function createMissingTables() {
  try {
    await sequelize.authenticate();
    console.log('✅ متصل بقاعدة البيانات\n');

    const queryInterface = sequelize.getQueryInterface();

    // فحص الجداول الموجودة
    const [existingTables] = await sequelize.query(`
      SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'
    `);
    const existing = existingTables.map(t => t.tablename);

    console.log('📋 بدء إنشاء الجداول الناقصة...\n');
    console.log('='.repeat(60));

    // 1. إنشاء جدول account_mappings إذا لم يكن موجوداً
    if (!existing.includes('account_mappings')) {
      console.log('\n🔨 إنشاء جدول: account_mappings');
      await queryInterface.createTable('account_mappings', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        cashAccount: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'accounts', key: 'id' }
        },
        bankAccount: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'accounts', key: 'id' }
        },
        salesAccount: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'accounts', key: 'id' }
        },
        purchasesAccount: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'accounts', key: 'id' }
        },
        accountsReceivableAccount: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'accounts', key: 'id' }
        },
        accountsPayableAccount: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'accounts', key: 'id' }
        },
        inventoryAccount: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'accounts', key: 'id' }
        },
        costOfGoodsSoldAccount: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'accounts', key: 'id' }
        },
        revenueAccount: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'accounts', key: 'id' }
        },
        expenseAccount: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'accounts', key: 'id' }
        },
        salesTaxAccount: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'accounts', key: 'id' }
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
      console.log('   ✅ تم إنشاء account_mappings');
    } else {
      console.log('\n⏭️  account_mappings موجود بالفعل');
    }

    // 2. إنشاء جدول invoice_payments إذا لم يكن موجوداً
    if (!existing.includes('invoice_payments')) {
      console.log('\n🔨 إنشاء جدول: invoice_payments');
      await queryInterface.createTable('invoice_payments', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        invoiceId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'invoices', key: 'id' },
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
          type: Sequelize.INTEGER,
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
          type: Sequelize.INTEGER,
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

      await queryInterface.addIndex('invoice_payments', ['invoiceId']);
      await queryInterface.addIndex('invoice_payments', ['paymentId']);
      await queryInterface.addIndex('invoice_payments', ['allocationDate']);
      await queryInterface.addIndex('invoice_payments', ['settlementOrder']);
      await queryInterface.addIndex('invoice_payments', ['isFullySettled']);
      await queryInterface.addIndex('invoice_payments', ['isReversed']);
      
      console.log('   ✅ تم إنشاء invoice_payments');
    } else {
      console.log('\n⏭️  invoice_payments موجود بالفعل');
    }

    // 3. إنشاء جدول invoice_receipts إذا لم يكن موجوداً
    if (!existing.includes('invoice_receipts')) {
      console.log('\n🔨 إنشاء جدول: invoice_receipts');
      await queryInterface.createTable('invoice_receipts', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        invoiceId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'invoices', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        receiptId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'receipts', key: 'id' },
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
          type: Sequelize.INTEGER,
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
          type: Sequelize.INTEGER,
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

      await queryInterface.addIndex('invoice_receipts', ['invoiceId']);
      await queryInterface.addIndex('invoice_receipts', ['receiptId']);
      await queryInterface.addIndex('invoice_receipts', ['allocationDate']);
      await queryInterface.addIndex('invoice_receipts', ['settlementOrder']);
      await queryInterface.addIndex('invoice_receipts', ['isFullySettled']);
      await queryInterface.addIndex('invoice_receipts', ['isReversed']);
      
      console.log('   ✅ تم إنشاء invoice_receipts');
    } else {
      console.log('\n⏭️  invoice_receipts موجود بالفعل');
    }

    // 4. إنشاء جدول account_provisions إذا لم يكن موجوداً
    if (!existing.includes('account_provisions')) {
      console.log('\n🔨 إنشاء جدول: account_provisions');
      await queryInterface.createTable('account_provisions', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        mainAccountId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'accounts', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        provisionAccountId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'accounts', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        provisionType: {
          type: Sequelize.ENUM(
            'doubtful_debts', 'depreciation', 'warranty', 'bad_debts',
            'inventory_obsolescence', 'legal_claims', 'employee_benefits',
            'tax_provision', 'other'
          ),
          allowNull: false
        },
        provisionRate: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true
        },
        fixedAmount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: true
        },
        calculationMethod: {
          type: Sequelize.ENUM('percentage', 'fixed_amount', 'manual'),
          allowNull: false,
          defaultValue: 'percentage'
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        autoCalculate: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        calculationFrequency: {
          type: Sequelize.ENUM('monthly', 'quarterly', 'annually', 'manual'),
          defaultValue: 'monthly'
        },
        lastCalculationDate: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        nextCalculationDate: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        currentProvisionAmount: {
          type: Sequelize.DECIMAL(15, 2),
          defaultValue: 0.00
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        createdBy: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' }
        },
        lastUpdatedBy: {
          type: Sequelize.INTEGER,
          allowNull: true,
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

      await queryInterface.addIndex('account_provisions', ['mainAccountId']);
      await queryInterface.addIndex('account_provisions', ['provisionAccountId']);
      await queryInterface.addIndex('account_provisions', ['provisionType']);
      await queryInterface.addIndex('account_provisions', ['isActive']);
      await queryInterface.addIndex('account_provisions', ['autoCalculate']);
      await queryInterface.addIndex('account_provisions', ['nextCalculationDate']);
      
      console.log('   ✅ تم إنشاء account_provisions');
    } else {
      console.log('\n⏭️  account_provisions موجود بالفعل');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ اكتمل إنشاء جميع الجداول الناقصة بنجاح!');
    console.log('='.repeat(60));

    await sequelize.close();
  } catch (err) {
    console.error('\n❌ خطأ:', err.message);
    console.error('التفاصيل:', err);
    await sequelize.close();
    process.exit(1);
  }
}

createMissingTables();
