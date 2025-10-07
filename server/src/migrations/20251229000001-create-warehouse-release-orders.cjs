'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('warehouse_release_orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      orderNumber: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      shipmentId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'shipments',
          key: 'id'
        }
      },
      customerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id'
        }
      },
      trackingNumber: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      releaseDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      requestedBy: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      requestedByPhone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      approvedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      warehouseLocation: {
        type: Sequelize.STRING(200),
        allowNull: false,
        defaultValue: 'المخزن الرئيسي - طرابلس'
      },
      itemDescription: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      weight: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false
      },
      volume: {
        type: Sequelize.DECIMAL(15, 3),
        allowNull: true
      },
      releaseConditions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      documentsRequired: {
        type: Sequelize.JSON,
        allowNull: true
      },
      documentsReceived: {
        type: Sequelize.JSON,
        allowNull: true
      },
      storageFeesAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      handlingFeesAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      totalFeesAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      paymentStatus: {
        type: Sequelize.ENUM('pending', 'partial', 'paid', 'waived'),
        allowNull: false,
        defaultValue: 'pending'
      },
      paymentMethod: {
        type: Sequelize.ENUM('cash', 'bank_transfer', 'check', 'credit_card', 'account_credit'),
        allowNull: true
      },
      paymentReference: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('draft', 'pending_approval', 'approved', 'released', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft'
      },
      approvalDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      releaseExecutedDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      releasedToName: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      releasedToPhone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      releasedToIdNumber: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      internalNotes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      releasedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('warehouse_release_orders');
  }
};