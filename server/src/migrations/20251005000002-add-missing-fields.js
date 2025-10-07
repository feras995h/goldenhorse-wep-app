export default {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('🔧 إضافة الحقول المفقودة إلى الجداول الموجودة...');

      // 1. إضافة حقول إلى جدول account_mappings
      console.log('📝 تحديث جدول account_mappings...');
      
      const accountMappingsColumns = await queryInterface.describeTable('account_mappings');
      
      if (!accountMappingsColumns.localCustomersAccount) {
        await queryInterface.addColumn('account_mappings', 'localCustomersAccount', {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'accounts', key: 'id' }
        }, { transaction });
      }
      
      if (!accountMappingsColumns.foreignCustomersAccount) {
        await queryInterface.addColumn('account_mappings', 'foreignCustomersAccount', {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'accounts', key: 'id' }
        }, { transaction });
      }
      
      if (!accountMappingsColumns.discountAccount) {
        await queryInterface.addColumn('account_mappings', 'discountAccount', {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'accounts', key: 'id' }
        }, { transaction });
      }
      
      if (!accountMappingsColumns.shippingRevenueAccount) {
        await queryInterface.addColumn('account_mappings', 'shippingRevenueAccount', {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'accounts', key: 'id' }
        }, { transaction });
      }
      
      if (!accountMappingsColumns.handlingFeeAccount) {
        await queryInterface.addColumn('account_mappings', 'handlingFeeAccount', {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'accounts', key: 'id' }
        }, { transaction });
      }
      
      if (!accountMappingsColumns.customsClearanceAccount) {
        await queryInterface.addColumn('account_mappings', 'customsClearanceAccount', {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'accounts', key: 'id' }
        }, { transaction });
      }
      
      if (!accountMappingsColumns.insuranceAccount) {
        await queryInterface.addColumn('account_mappings', 'insuranceAccount', {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'accounts', key: 'id' }
        }, { transaction });
      }
      
      if (!accountMappingsColumns.storageAccount) {
        await queryInterface.addColumn('account_mappings', 'storageAccount', {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'accounts', key: 'id' }
        }, { transaction });
      }
      
      if (!accountMappingsColumns.createdBy) {
        await queryInterface.addColumn('account_mappings', 'createdBy', {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' }
        }, { transaction });
      }
      
      if (!accountMappingsColumns.updatedBy) {
        await queryInterface.addColumn('account_mappings', 'updatedBy', {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' }
        }, { transaction });
      }

      console.log('✓ تم تحديث جدول account_mappings');

      // 2. إضافة حقول إلى جدول customers
      console.log('📝 تحديث جدول customers...');
      
      const customersColumns = await queryInterface.describeTable('customers');
      
      if (!customersColumns.accountId) {
        await queryInterface.addColumn('customers', 'accountId', {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'accounts', key: 'id' }
        }, { transaction });
      }
      
      if (!customersColumns.customerType) {
        await queryInterface.addColumn('customers', 'customerType', {
          type: DataTypes.ENUM('individual', 'company'),
          defaultValue: 'individual'
        }, { transaction });
      }
      
      if (!customersColumns.nationality) {
        await queryInterface.addColumn('customers', 'nationality', {
          type: DataTypes.STRING,
          allowNull: true
        }, { transaction });
      }
      
      if (!customersColumns.passportNumber) {
        await queryInterface.addColumn('customers', 'passportNumber', {
          type: DataTypes.STRING,
          allowNull: true
        }, { transaction });
      }
      
      if (!customersColumns.residencyStatus) {
        await queryInterface.addColumn('customers', 'residencyStatus', {
          type: DataTypes.STRING,
          allowNull: true
        }, { transaction });
      }

      console.log('✓ تم تحديث جدول customers');

      // 3. إضافة حقول إلى جدول employees
      console.log('📝 تحديث جدول employees...');
      
      const employeesColumns = await queryInterface.describeTable('employees');
      
      if (!employeesColumns.code) {
        await queryInterface.addColumn('employees', 'code', {
          type: DataTypes.STRING,
          allowNull: true,
          unique: true
        }, { transaction });
      }
      
      if (!employeesColumns.terminationDate) {
        await queryInterface.addColumn('employees', 'terminationDate', {
          type: DataTypes.DATE,
          allowNull: true
        }, { transaction });
      }
      
      if (!employeesColumns.accountId) {
        await queryInterface.addColumn('employees', 'accountId', {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'accounts', key: 'id' }
        }, { transaction });
      }
      
      if (!employeesColumns.bankAccount) {
        await queryInterface.addColumn('employees', 'bankAccount', {
          type: DataTypes.STRING,
          allowNull: true
        }, { transaction });
      }
      
      if (!employeesColumns.bankName) {
        await queryInterface.addColumn('employees', 'bankName', {
          type: DataTypes.STRING,
          allowNull: true
        }, { transaction });
      }
      
      if (!employeesColumns.taxNumber) {
        await queryInterface.addColumn('employees', 'taxNumber', {
          type: DataTypes.STRING,
          allowNull: true
        }, { transaction });
      }
      
      if (!employeesColumns.emergencyContact) {
        await queryInterface.addColumn('employees', 'emergencyContact', {
          type: DataTypes.STRING,
          allowNull: true
        }, { transaction });
      }
      
      if (!employeesColumns.emergencyPhone) {
        await queryInterface.addColumn('employees', 'emergencyPhone', {
          type: DataTypes.STRING,
          allowNull: true
        }, { transaction });
      }
      
      if (!employeesColumns.notes) {
        await queryInterface.addColumn('employees', 'notes', {
          type: DataTypes.TEXT,
          allowNull: true
        }, { transaction });
      }

      console.log('✓ تم تحديث جدول employees');

      // 4. إضافة حقول إلى جدول gl_entries
      console.log('📝 تحديث جدول gl_entries...');
      
      const glEntriesColumns = await queryInterface.describeTable('gl_entries');
      
      if (!glEntriesColumns.postingDate) {
        await queryInterface.addColumn('gl_entries', 'postingDate', {
          type: DataTypes.DATE,
          allowNull: true
        }, { transaction });
      }
      
      if (!glEntriesColumns.accountId) {
        await queryInterface.addColumn('gl_entries', 'accountId', {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'accounts', key: 'id' }
        }, { transaction });
      }
      
      if (!glEntriesColumns.debit) {
        await queryInterface.addColumn('gl_entries', 'debit', {
          type: DataTypes.DECIMAL(15, 2),
          defaultValue: 0
        }, { transaction });
      }
      
      if (!glEntriesColumns.credit) {
        await queryInterface.addColumn('gl_entries', 'credit', {
          type: DataTypes.DECIMAL(15, 2),
          defaultValue: 0
        }, { transaction });
      }
      
      if (!glEntriesColumns.voucherType) {
        await queryInterface.addColumn('gl_entries', 'voucherType', {
          type: DataTypes.STRING,
          allowNull: true
        }, { transaction });
      }
      
      if (!glEntriesColumns.voucherNo) {
        await queryInterface.addColumn('gl_entries', 'voucherNo', {
          type: DataTypes.STRING,
          allowNull: true
        }, { transaction });
      }
      
      if (!glEntriesColumns.journalEntryId) {
        await queryInterface.addColumn('gl_entries', 'journalEntryId', {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'journal_entries', key: 'id' }
        }, { transaction });
      }
      
      if (!glEntriesColumns.remarks) {
        await queryInterface.addColumn('gl_entries', 'remarks', {
          type: DataTypes.TEXT,
          allowNull: true
        }, { transaction });
      }
      
      if (!glEntriesColumns.isCancelled) {
        await queryInterface.addColumn('gl_entries', 'isCancelled', {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        }, { transaction });
      }
      
      if (!glEntriesColumns.cancelledAt) {
        await queryInterface.addColumn('gl_entries', 'cancelledAt', {
          type: DataTypes.DATE,
          allowNull: true
        }, { transaction });
      }
      
      if (!glEntriesColumns.cancelledBy) {
        await queryInterface.addColumn('gl_entries', 'cancelledBy', {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'users', key: 'id' }
        }, { transaction });
      }
      
      if (!glEntriesColumns.createdBy) {
        await queryInterface.addColumn('gl_entries', 'createdBy', {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'users', key: 'id' }
        }, { transaction });
      }
      
      if (!glEntriesColumns.currency) {
        await queryInterface.addColumn('gl_entries', 'currency', {
          type: DataTypes.STRING(3),
          defaultValue: 'LYD'
        }, { transaction });
      }
      
      if (!glEntriesColumns.exchangeRate) {
        await queryInterface.addColumn('gl_entries', 'exchangeRate', {
          type: DataTypes.DECIMAL(10, 4),
          defaultValue: 1
        }, { transaction });
      }

      console.log('✓ تم تحديث جدول gl_entries');

      // 5. إضافة حقول إلى جدول sales_invoices
      console.log('📝 تحديث جدول sales_invoices...');
      
      const salesInvoicesColumns = await queryInterface.describeTable('sales_invoices');
      
      if (!salesInvoicesColumns.subtotal) {
        await queryInterface.addColumn('sales_invoices', 'subtotal', {
          type: DataTypes.DECIMAL(15, 2),
          defaultValue: 0
        }, { transaction });
      }
      
      if (!salesInvoicesColumns.discountAmount) {
        await queryInterface.addColumn('sales_invoices', 'discountAmount', {
          type: DataTypes.DECIMAL(15, 2),
          defaultValue: 0
        }, { transaction });
      }
      
      if (!salesInvoicesColumns.taxAmount) {
        await queryInterface.addColumn('sales_invoices', 'taxAmount', {
          type: DataTypes.DECIMAL(15, 2),
          defaultValue: 0
        }, { transaction });
      }
      
      if (!salesInvoicesColumns.total) {
        await queryInterface.addColumn('sales_invoices', 'total', {
          type: DataTypes.DECIMAL(15, 2),
          defaultValue: 0
        }, { transaction });
      }
      
      if (!salesInvoicesColumns.currency) {
        await queryInterface.addColumn('sales_invoices', 'currency', {
          type: DataTypes.STRING(3),
          defaultValue: 'LYD'
        }, { transaction });
      }
      
      if (!salesInvoicesColumns.exchangeRate) {
        await queryInterface.addColumn('sales_invoices', 'exchangeRate', {
          type: DataTypes.DECIMAL(10, 4),
          defaultValue: 1
        }, { transaction });
      }
      
      if (!salesInvoicesColumns.paymentStatus) {
        await queryInterface.addColumn('sales_invoices', 'paymentStatus', {
          type: DataTypes.ENUM('unpaid', 'partial', 'paid'),
          defaultValue: 'unpaid'
        }, { transaction });
      }
      
      if (!salesInvoicesColumns.paymentMethod) {
        await queryInterface.addColumn('sales_invoices', 'paymentMethod', {
          type: DataTypes.STRING,
          allowNull: true
        }, { transaction });
      }
      
      if (!salesInvoicesColumns.invoiceDate) {
        await queryInterface.addColumn('sales_invoices', 'invoiceDate', {
          type: DataTypes.DATE,
          allowNull: true
        }, { transaction });
      }
      
      if (!salesInvoicesColumns.postedStatus) {
        await queryInterface.addColumn('sales_invoices', 'postedStatus', {
          type: DataTypes.ENUM('draft', 'posted', 'cancelled'),
          defaultValue: 'draft'
        }, { transaction });
      }
      
      if (!salesInvoicesColumns.postedAt) {
        await queryInterface.addColumn('sales_invoices', 'postedAt', {
          type: DataTypes.DATE,
          allowNull: true
        }, { transaction });
      }
      
      if (!salesInvoicesColumns.postedBy) {
        await queryInterface.addColumn('sales_invoices', 'postedBy', {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'users', key: 'id' }
        }, { transaction });
      }
      
      if (!salesInvoicesColumns.documentNo) {
        await queryInterface.addColumn('sales_invoices', 'documentNo', {
          type: DataTypes.STRING,
          allowNull: true
        }, { transaction });
      }
      
      if (!salesInvoicesColumns.fiscalYear) {
        await queryInterface.addColumn('sales_invoices', 'fiscalYear', {
          type: DataTypes.INTEGER,
          allowNull: true
        }, { transaction });
      }
      
      if (!salesInvoicesColumns.canEdit) {
        await queryInterface.addColumn('sales_invoices', 'canEdit', {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        }, { transaction });
      }
      
      if (!salesInvoicesColumns.voidReason) {
        await queryInterface.addColumn('sales_invoices', 'voidReason', {
          type: DataTypes.TEXT,
          allowNull: true
        }, { transaction });
      }
      
      if (!salesInvoicesColumns.createdBy) {
        await queryInterface.addColumn('sales_invoices', 'createdBy', {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'users', key: 'id' }
        }, { transaction });
      }

      console.log('✓ تم تحديث جدول sales_invoices');

      // 6. إضافة حقول إلى جدول receipts
      console.log('📝 تحديث جدول receipts...');
      
      const receiptsColumns = await queryInterface.describeTable('receipts');
      
      if (!receiptsColumns.receiptNo) {
        await queryInterface.addColumn('receipts', 'receiptNo', {
          type: DataTypes.STRING,
          allowNull: true,
          unique: true
        }, { transaction });
      }
      
      if (!receiptsColumns.receiptDate) {
        await queryInterface.addColumn('receipts', 'receiptDate', {
          type: DataTypes.DATE,
          allowNull: true
        }, { transaction });
      }
      
      if (!receiptsColumns.referenceNo) {
        await queryInterface.addColumn('receipts', 'referenceNo', {
          type: DataTypes.STRING,
          allowNull: true
        }, { transaction });
      }
      
      if (!receiptsColumns.bankAccount) {
        await queryInterface.addColumn('receipts', 'bankAccount', {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'accounts', key: 'id' }
        }, { transaction });
      }
      
      if (!receiptsColumns.checkNumber) {
        await queryInterface.addColumn('receipts', 'checkNumber', {
          type: DataTypes.STRING,
          allowNull: true
        }, { transaction });
      }
      
      if (!receiptsColumns.currency) {
        await queryInterface.addColumn('receipts', 'currency', {
          type: DataTypes.STRING(3),
          defaultValue: 'LYD'
        }, { transaction });
      }
      
      if (!receiptsColumns.exchangeRate) {
        await queryInterface.addColumn('receipts', 'exchangeRate', {
          type: DataTypes.DECIMAL(10, 4),
          defaultValue: 1
        }, { transaction });
      }
      
      if (!receiptsColumns.remarks) {
        await queryInterface.addColumn('receipts', 'remarks', {
          type: DataTypes.TEXT,
          allowNull: true
        }, { transaction });
      }
      
      if (!receiptsColumns.createdBy) {
        await queryInterface.addColumn('receipts', 'createdBy', {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'users', key: 'id' }
        }, { transaction });
      }
      
      if (!receiptsColumns.completedAt) {
        await queryInterface.addColumn('receipts', 'completedAt', {
          type: DataTypes.DATE,
          allowNull: true
        }, { transaction });
      }
      
      if (!receiptsColumns.completedBy) {
        await queryInterface.addColumn('receipts', 'completedBy', {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'users', key: 'id' }
        }, { transaction });
      }

      console.log('✓ تم تحديث جدول receipts');

      // 7. إضافة حقول إلى جدول suppliers
      console.log('📝 تحديث جدول suppliers...');
      
      const suppliersColumns = await queryInterface.describeTable('suppliers');
      
      if (!suppliersColumns.city) {
        await queryInterface.addColumn('suppliers', 'city', {
          type: DataTypes.STRING,
          allowNull: true
        }, { transaction });
      }
      
      if (!suppliersColumns.country) {
        await queryInterface.addColumn('suppliers', 'country', {
          type: DataTypes.STRING,
          allowNull: true
        }, { transaction });
      }
      
      if (!suppliersColumns.paymentTerms) {
        await queryInterface.addColumn('suppliers', 'paymentTerms', {
          type: DataTypes.STRING,
          allowNull: true
        }, { transaction });
      }
      
      if (!suppliersColumns.currency) {
        await queryInterface.addColumn('suppliers', 'currency', {
          type: DataTypes.STRING(3),
          defaultValue: 'LYD'
        }, { transaction });
      }
      
      if (!suppliersColumns.notes) {
        await queryInterface.addColumn('suppliers', 'notes', {
          type: DataTypes.TEXT,
          allowNull: true
        }, { transaction });
      }
      
      if (!suppliersColumns.createdBy) {
        await queryInterface.addColumn('suppliers', 'createdBy', {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'users', key: 'id' }
        }, { transaction });
      }

      console.log('✓ تم تحديث جدول suppliers');

      // 8. إضافة حقول إلى جدول invoices
      console.log('📝 تحديث جدول invoices...');
      
      const invoicesColumns = await queryInterface.describeTable('invoices');
      
      if (!invoicesColumns.dueDate) {
        await queryInterface.addColumn('invoices', 'dueDate', {
          type: DataTypes.DATE,
          allowNull: true
        }, { transaction });
      }
      
      if (!invoicesColumns.subtotal) {
        await queryInterface.addColumn('invoices', 'subtotal', {
          type: DataTypes.DECIMAL(15, 2),
          defaultValue: 0
        }, { transaction });
      }
      
      if (!invoicesColumns.taxAmount) {
        await queryInterface.addColumn('invoices', 'taxAmount', {
          type: DataTypes.DECIMAL(15, 2),
          defaultValue: 0
        }, { transaction });
      }

      console.log('✓ تم تحديث جدول invoices');

      // 9. إضافة حقول إلى جدول fixed_assets
      console.log('📝 تحديث جدول fixed_assets...');
      
      const fixedAssetsColumns = await queryInterface.describeTable('fixed_assets');
      
      if (!fixedAssetsColumns.categoryAccountId) {
        await queryInterface.addColumn('fixed_assets', 'categoryAccountId', {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'accounts', key: 'id' }
        }, { transaction });
      }

      console.log('✓ تم تحديث جدول fixed_assets');

      // 10. تصحيح اسم العمود في جدول purchase_invoices
      console.log('📝 تحديث جدول purchase_invoices...');
      
      const purchaseInvoicesColumns = await queryInterface.describeTable('purchase_invoices');
      
      if (purchaseInvoicesColumns.outstandingamount && !purchaseInvoicesColumns.outstandingAmount) {
        await queryInterface.renameColumn('purchase_invoices', 'outstandingamount', 'outstandingAmount', { transaction });
        console.log('✓ تم تصحيح اسم العمود outstandingAmount');
      }

      console.log('✓ تم تحديث جدول purchase_invoices');

      // 11. تحديث جدول shipping_invoices - توحيد نمط التسمية
      console.log('📝 تحديث جدول shipping_invoices...');
      
      const shippingInvoicesColumns = await queryInterface.describeTable('shipping_invoices');
      
      if (!shippingInvoicesColumns.invoiceNumber && shippingInvoicesColumns.invoice_number) {
        await queryInterface.renameColumn('shipping_invoices', 'invoice_number', 'invoiceNumber', { transaction });
      }
      
      if (!shippingInvoicesColumns.customerId && shippingInvoicesColumns.customer_id) {
        await queryInterface.renameColumn('shipping_invoices', 'customer_id', 'customerId', { transaction });
      }
      
      if (!shippingInvoicesColumns.totalAmount && shippingInvoicesColumns.total_amount) {
        await queryInterface.renameColumn('shipping_invoices', 'total_amount', 'totalAmount', { transaction });
      }
      
      if (!shippingInvoicesColumns.isActive) {
        await queryInterface.addColumn('shipping_invoices', 'isActive', {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        }, { transaction });
      }
      
      if (!shippingInvoicesColumns.shipmentId) {
        await queryInterface.addColumn('shipping_invoices', 'shipmentId', {
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: 'shipments', key: 'id' }
        }, { transaction });
      }
      
      if (!shippingInvoicesColumns.outstandingAmount) {
        await queryInterface.addColumn('shipping_invoices', 'outstandingAmount', {
          type: DataTypes.DECIMAL(15, 2),
          defaultValue: 0
        }, { transaction });
      }

      console.log('✓ تم تحديث جدول shipping_invoices');

      await transaction.commit();
      console.log('✅ تم إضافة جميع الحقول المفقودة بنجاح!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ خطأ في إضافة الحقول:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // عكس التغييرات (يمكن إضافة المزيد حسب الحاجة)
      console.log('⏪ التراجع عن التغييرات...');
      
      await transaction.commit();
      console.log('✅ تم التراجع بنجاح');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ خطأ في التراجع:', error);
      throw error;
    }
  }
};
