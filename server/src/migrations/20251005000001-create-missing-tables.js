export default {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('🔧 إنشاء الجداول المفقودة...');

      // 1. جدول accounting_periods - الفترات المحاسبية
      await queryInterface.createTable('accounting_periods', {
        id: {
          type: DataTypes.UUID,
          defaultValue: Sequelize.literal('gen_random_uuid()'),
          primaryKey: true
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false
        },
        startDate: {
          type: DataTypes.DATE,
          allowNull: false
        },
        endDate: {
          type: DataTypes.DATE,
          allowNull: false
        },
        fiscalYear: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        status: {
          type: DataTypes.ENUM('open', 'closed', 'locked'),
          defaultValue: 'open',
          allowNull: false
        },
        isCurrent: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        closedAt: {
          type: DataTypes.DATE,
          allowNull: true
        },
        closedBy: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          }
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
      }, { transaction });

      console.log('✓ تم إنشاء جدول accounting_periods');

      // 2. جدول audit_logs - سجلات التدقيق
      await queryInterface.createTable('audit_logs', {
        id: {
          type: DataTypes.UUID,
          defaultValue: Sequelize.literal('gen_random_uuid()'),
          primaryKey: true
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        action: {
          type: DataTypes.STRING,
          allowNull: false
        },
        entityType: {
          type: DataTypes.STRING,
          allowNull: false
        },
        entityId: {
          type: DataTypes.STRING,
          allowNull: true
        },
        oldValues: {
          type: DataTypes.JSONB,
          allowNull: true
        },
        newValues: {
          type: DataTypes.JSONB,
          allowNull: true
        },
        ipAddress: {
          type: DataTypes.STRING,
          allowNull: true
        },
        userAgent: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        timestamp: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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
      }, { transaction });

      console.log('✓ تم إنشاء جدول audit_logs');

      // 3. جدول company_logo - شعار الشركة
      await queryInterface.createTable('company_logo', {
        id: {
          type: DataTypes.UUID,
          defaultValue: Sequelize.literal('gen_random_uuid()'),
          primaryKey: true
        },
        filename: {
          type: DataTypes.STRING,
          allowNull: false
        },
        originalName: {
          type: DataTypes.STRING,
          allowNull: false
        },
        mimeType: {
          type: DataTypes.STRING,
          allowNull: false
        },
        size: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        path: {
          type: DataTypes.STRING,
          allowNull: false
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        },
        uploadedBy: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          }
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
      }, { transaction });

      console.log('✓ تم إنشاء جدول company_logo');

      // 4. جدول purchase_invoice_payments - دفعات فواتير الشراء
      await queryInterface.createTable('purchase_invoice_payments', {
        id: {
          type: DataTypes.UUID,
          defaultValue: Sequelize.literal('gen_random_uuid()'),
          primaryKey: true
        },
        purchaseInvoiceId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'purchase_invoices',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        paymentDate: {
          type: DataTypes.DATE,
          allowNull: false
        },
        amount: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false
        },
        paymentMethod: {
          type: DataTypes.ENUM('cash', 'bank_transfer', 'check', 'credit_card'),
          allowNull: false
        },
        referenceNo: {
          type: DataTypes.STRING,
          allowNull: true
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        createdBy: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          }
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
      }, { transaction });

      console.log('✓ تم إنشاء جدول purchase_invoice_payments');

      // 5. جدول sales_invoice_items - بنود فواتير المبيعات
      await queryInterface.createTable('sales_invoice_items', {
        id: {
          type: DataTypes.UUID,
          defaultValue: Sequelize.literal('gen_random_uuid()'),
          primaryKey: true
        },
        salesInvoiceId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'sales_invoices',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        descriptionEn: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        quantity: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 1
        },
        unitPrice: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false
        },
        discount: {
          type: DataTypes.DECIMAL(15, 2),
          defaultValue: 0
        },
        taxRate: {
          type: DataTypes.DECIMAL(5, 2),
          defaultValue: 0
        },
        taxAmount: {
          type: DataTypes.DECIMAL(15, 2),
          defaultValue: 0
        },
        total: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false
        },
        accountId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'accounts',
            key: 'id'
          }
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
      }, { transaction });

      console.log('✓ تم إنشاء جدول sales_invoice_items');

      // 6. جدول sales_invoice_payments - دفعات فواتير المبيعات
      await queryInterface.createTable('sales_invoice_payments', {
        id: {
          type: DataTypes.UUID,
          defaultValue: Sequelize.literal('gen_random_uuid()'),
          primaryKey: true
        },
        salesInvoiceId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'sales_invoices',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        paymentDate: {
          type: DataTypes.DATE,
          allowNull: false
        },
        amount: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false
        },
        paymentMethod: {
          type: DataTypes.ENUM('cash', 'bank_transfer', 'check', 'credit_card'),
          allowNull: false
        },
        referenceNo: {
          type: DataTypes.STRING,
          allowNull: true
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        createdBy: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          }
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
      }, { transaction });

      console.log('✓ تم إنشاء جدول sales_invoice_payments');

      // 7. جدول sales_returns - مرتجعات المبيعات
      await queryInterface.createTable('sales_returns', {
        id: {
          type: DataTypes.UUID,
          defaultValue: Sequelize.literal('gen_random_uuid()'),
          primaryKey: true
        },
        returnNumber: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        },
        salesInvoiceId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'sales_invoices',
            key: 'id'
          }
        },
        customerId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'customers',
            key: 'id'
          }
        },
        returnDate: {
          type: DataTypes.DATE,
          allowNull: false
        },
        reason: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        totalAmount: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false
        },
        status: {
          type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed'),
          defaultValue: 'pending'
        },
        approvedBy: {
            type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        approvedAt: {
          type: DataTypes.DATE,
          allowNull: true
        },
        createdBy: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          }
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
      }, { transaction });

      console.log('✓ تم إنشاء جدول sales_returns');

      // 8. جدول stock_movements - حركات المخزون
      await queryInterface.createTable('stock_movements', {
        id: {
          type: DataTypes.UUID,
          defaultValue: Sequelize.literal('gen_random_uuid()'),
          primaryKey: true
        },
        movementNumber: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        },
        movementType: {
          type: DataTypes.ENUM('in', 'out', 'transfer', 'adjustment'),
          allowNull: false
        },
        movementDate: {
          type: DataTypes.DATE,
          allowNull: false
        },
        warehouseId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'warehouse',
            key: 'id'
          }
        },
        referenceType: {
          type: DataTypes.STRING,
          allowNull: true
        },
        referenceId: {
          type: DataTypes.UUID,
          allowNull: true
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        createdBy: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          }
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
      }, { transaction });

      console.log('✓ تم إنشاء جدول stock_movements');

      // 9. جدول warehouse_release_orders - أوامر الإفراج من المخزن
      await queryInterface.createTable('warehouse_release_orders', {
        id: {
          type: DataTypes.UUID,
          defaultValue: Sequelize.literal('gen_random_uuid()'),
          primaryKey: true
        },
        orderNumber: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        },
        warehouseId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'warehouse',
            key: 'id'
          }
        },
        shipmentId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'shipments',
            key: 'id'
          }
        },
        customerId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'customers',
            key: 'id'
          }
        },
        releaseDate: {
          type: DataTypes.DATE,
          allowNull: false
        },
        status: {
          type: DataTypes.ENUM('pending', 'approved', 'released', 'cancelled'),
          defaultValue: 'pending'
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        approvedBy: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        approvedAt: {
          type: DataTypes.DATE,
          allowNull: true
        },
        releasedBy: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        releasedAt: {
          type: DataTypes.DATE,
          allowNull: true
        },
        createdBy: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          }
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
      }, { transaction });

      console.log('✓ تم إنشاء جدول warehouse_release_orders');

      // إنشاء الفهارس
      await queryInterface.addIndex('accounting_periods', ['fiscalYear'], { transaction });
      await queryInterface.addIndex('accounting_periods', ['status'], { transaction });
      await queryInterface.addIndex('audit_logs', ['userId'], { transaction });
      await queryInterface.addIndex('audit_logs', ['entityType', 'entityId'], { transaction });
      await queryInterface.addIndex('audit_logs', ['timestamp'], { transaction });
      await queryInterface.addIndex('purchase_invoice_payments', ['purchaseInvoiceId'], { transaction });
      await queryInterface.addIndex('sales_invoice_items', ['salesInvoiceId'], { transaction });
      await queryInterface.addIndex('sales_invoice_payments', ['salesInvoiceId'], { transaction });
      await queryInterface.addIndex('sales_returns', ['salesInvoiceId'], { transaction });
      await queryInterface.addIndex('sales_returns', ['customerId'], { transaction });
      await queryInterface.addIndex('stock_movements', ['warehouseId'], { transaction });
      await queryInterface.addIndex('stock_movements', ['movementDate'], { transaction });
      await queryInterface.addIndex('warehouse_release_orders', ['warehouseId'], { transaction });
      await queryInterface.addIndex('warehouse_release_orders', ['shipmentId'], { transaction });

      await transaction.commit();
      console.log('✅ تم إنشاء جميع الجداول المفقودة بنجاح!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ خطأ في إنشاء الجداول:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('warehouse_release_orders', { transaction });
      await queryInterface.dropTable('stock_movements', { transaction });
      await queryInterface.dropTable('sales_returns', { transaction });
      await queryInterface.dropTable('sales_invoice_payments', { transaction });
      await queryInterface.dropTable('sales_invoice_items', { transaction });
      await queryInterface.dropTable('purchase_invoice_payments', { transaction });
      await queryInterface.dropTable('company_logo', { transaction });
      await queryInterface.dropTable('audit_logs', { transaction });
      await queryInterface.dropTable('accounting_periods', { transaction });

      await transaction.commit();
      console.log('✅ تم حذف جميع الجداول بنجاح');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ خطأ في حذف الجداول:', error);
      throw error;
    }
  }
};
