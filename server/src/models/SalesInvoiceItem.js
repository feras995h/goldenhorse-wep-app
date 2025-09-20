import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const SalesInvoiceItem = sequelize.define('SalesInvoiceItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    invoiceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'sales_invoices',
        key: 'id'
      }
    },
    itemCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Product/service code'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Item description in Arabic'
    },
    descriptionEn: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Item description in English'
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Item category'
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 1.000,
      validate: {
        min: 0.001,
        max: 9999999.999
      }
    },
    unit: {
      type: DataTypes.STRING(20),
      defaultValue: 'قطعة',
      comment: 'Unit of measurement (piece, kg, meter, etc.)'
    },
    unitPrice: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    discountPercent: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 100.00
      }
    },
    discountAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    taxPercent: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 100.00
      }
    },
    taxAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      }
    },
    lineTotal: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 999999999999.99
      },
      comment: 'Total for this line item (quantity * unitPrice - discount + tax)'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes for this item'
    },
    // Product specific fields
    weight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
      validate: {
        min: 0,
        max: 9999999.999
      },
      comment: 'Weight in kg'
    },
    dimensions: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Product dimensions {length, width, height}'
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    size: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    serialNumber: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    warrantyPeriod: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Warranty period in months'
    },
    // Inventory tracking
    stockLocation: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Stock location or warehouse'
    },
    batchNumber: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true
      }
    }
  }, {
    tableName: 'sales_invoice_items',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        fields: ['invoiceId']
      },
      {
        fields: ['itemCode']
      },
      {
        fields: ['category']
      },
      {
        fields: ['brand']
      }
    ],
    hooks: {
      beforeCreate: (item) => {
        // Calculate discount amount from percentage if not provided
        if (!item.discountAmount && item.discountPercent > 0) {
          const subtotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
          item.discountAmount = (subtotal * item.discountPercent) / 100;
        }

        // Calculate tax amount from percentage if not provided
        if (!item.taxAmount && item.taxPercent > 0) {
          const subtotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
          const taxableAmount = subtotal - (item.discountAmount || 0);
          item.taxAmount = (taxableAmount * item.taxPercent) / 100;
        }

        // Calculate line total
        const subtotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
        item.lineTotal = subtotal - (item.discountAmount || 0) + (item.taxAmount || 0);
      },
      beforeUpdate: (item) => {
        // Recalculate discount amount if percentage or quantity/price changed
        if (item.changed('discountPercent') || item.changed('quantity') || item.changed('unitPrice')) {
          if (item.discountPercent > 0) {
            const subtotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
            item.discountAmount = (subtotal * item.discountPercent) / 100;
          }
        }

        // Recalculate tax amount if percentage or other values changed
        if (item.changed('taxPercent') || item.changed('quantity') || 
            item.changed('unitPrice') || item.changed('discountAmount')) {
          if (item.taxPercent > 0) {
            const subtotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
            const taxableAmount = subtotal - (item.discountAmount || 0);
            item.taxAmount = (taxableAmount * item.taxPercent) / 100;
          }
        }

        // Recalculate line total if any component changed
        if (item.changed('quantity') || item.changed('unitPrice') || 
            item.changed('discountAmount') || item.changed('taxAmount')) {
          const subtotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
          item.lineTotal = subtotal - (item.discountAmount || 0) + (item.taxAmount || 0);
        }
      },
      afterCreate: async (item) => {
        // Update parent invoice totals
        await updateInvoiceTotals(item.invoiceId);
      },
      afterUpdate: async (item) => {
        // Update parent invoice totals
        await updateInvoiceTotals(item.invoiceId);
      },
      afterDestroy: async (item) => {
        // Update parent invoice totals
        await updateInvoiceTotals(item.invoiceId);
      }
    }
  });

  // Helper function to update invoice totals
  const updateInvoiceTotals = async (invoiceId) => {
    const { SalesInvoice } = sequelize.models;
    
    // Calculate totals from all items
    const items = await SalesInvoiceItem.findAll({
      where: { invoiceId }
    });

    // Compute raw subtotal from quantity * unitPrice to avoid double-counting discounts/taxes
    const subtotal = items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity || 0);
      const price = parseFloat(item.unitPrice || 0);
      return sum + (isNaN(qty) || isNaN(price) ? 0 : qty * price);
    }, 0);

    // Update only subtotal; invoice hooks will recompute discount/tax/total
    await SalesInvoice.update(
      { subtotal },
      { where: { id: invoiceId } }
    );
  };

  // Instance methods
  SalesInvoiceItem.prototype.getSubtotal = function() {
    return parseFloat(this.quantity) * parseFloat(this.unitPrice);
  };

  SalesInvoiceItem.prototype.getDiscountAmount = function() {
    if (this.discountAmount > 0) {
      return parseFloat(this.discountAmount);
    }
    if (this.discountPercent > 0) {
      return (this.getSubtotal() * this.discountPercent) / 100;
    }
    return 0;
  };

  SalesInvoiceItem.prototype.getTaxAmount = function() {
    if (this.taxAmount > 0) {
      return parseFloat(this.taxAmount);
    }
    if (this.taxPercent > 0) {
      const taxableAmount = this.getSubtotal() - this.getDiscountAmount();
      return (taxableAmount * this.taxPercent) / 100;
    }
    return 0;
  };

  SalesInvoiceItem.prototype.getLineTotal = function() {
    return this.getSubtotal() - this.getDiscountAmount() + this.getTaxAmount();
  };

  // Associations
  SalesInvoiceItem.associate = (models) => {
    SalesInvoiceItem.belongsTo(models.SalesInvoice, { 
      foreignKey: 'invoiceId', 
      as: 'invoice' 
    });
  };

  return SalesInvoiceItem;
};
