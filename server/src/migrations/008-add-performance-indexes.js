/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    // Add performance indexes for better query performance
    
    // GL Entries indexes
    try {
      await queryInterface.addIndex('gl_entries', ['date'], {
        name: 'idx_gl_entries_date',
        using: 'BTREE'
      });
    } catch (error) {
      console.log('Index idx_gl_entries_date already exists, skipping');
    }
    
    try {
      await queryInterface.addIndex('gl_entries', ['status', 'date'], {
        name: 'idx_gl_entries_status_date',
        using: 'BTREE'
      });
    } catch (error) {
      console.log('Index idx_gl_entries_status_date already exists, skipping');
    }
    
    try {
      await queryInterface.addIndex('gl_entries', ['entryNumber'], {
        name: 'idx_gl_entries_entry_number',
        using: 'BTREE'
      });
    } catch (error) {
      console.log('Index idx_gl_entries_entry_number already exists, skipping');
    }
    
    // GL Entry Details indexes
    try {
      await queryInterface.addIndex('gl_entry_details', ['accountId', 'glEntryId'], {
        name: 'idx_gl_entry_details_account_entry',
        using: 'BTREE'
      });
    } catch (error) {
      console.log('Index idx_gl_entry_details_account_entry already exists, skipping');
    }
    
    // Journal Entries indexes - skip if already exist
    try {
      await queryInterface.addIndex('journal_entries', ['type', 'date'], {
        name: 'idx_journal_entries_type_date',
        using: 'BTREE'
      });
    } catch (error) {
      console.log('Index idx_journal_entries_type_date already exists, skipping');
    }
    
    // Invoices indexes
    try {
      await queryInterface.addIndex('invoices', ['customerId', 'status'], {
        name: 'idx_invoices_customer_status',
        using: 'BTREE'
      });
    } catch (error) {
      console.log('Index idx_invoices_customer_status already exists, skipping');
    }
    
    try {
      await queryInterface.addIndex('invoices', ['date', 'status'], {
        name: 'idx_invoices_date_status',
        using: 'BTREE'
      });
    } catch (error) {
      console.log('Index idx_invoices_date_status already exists, skipping');
    }
    
    try {
      await queryInterface.addIndex('invoices', ['type', 'date'], {
        name: 'idx_invoices_type_date',
        using: 'BTREE'
      });
    } catch (error) {
      console.log('Index idx_invoices_type_date already exists, skipping');
    }
    
    // Payments indexes
    try {
      await queryInterface.addIndex('payments', ['customerId', 'date'], {
        name: 'idx_payments_customer_date',
        using: 'BTREE'
      });
    } catch (error) {
      console.log('Index idx_payments_customer_date already exists, skipping');
    }
    
    try {
      await queryInterface.addIndex('payments', ['method', 'status'], {
        name: 'idx_payments_method_status',
        using: 'BTREE'
      });
    } catch (error) {
      console.log('Index idx_payments_method_status already exists, skipping');
    }
    
    // Receipts indexes
    try {
      await queryInterface.addIndex('receipts', ['customerId', 'date'], {
        name: 'idx_receipts_customer_date',
        using: 'BTREE'
      });
    } catch (error) {
      console.log('Index idx_receipts_customer_date already exists, skipping');
    }
    
    try {
      await queryInterface.addIndex('receipts', ['status', 'date'], {
        name: 'idx_receipts_status_date',
        using: 'BTREE'
      });
    } catch (error) {
      console.log('Index idx_receipts_status_date already exists, skipping');
    }
    
    // Customers indexes
    try {
      await queryInterface.addIndex('customers', ['isActive'], {
        name: 'idx_customers_active',
        using: 'BTREE'
      });
    } catch (error) {
      console.log('Index idx_customers_active already exists, skipping');
    }
    
    try {
      await queryInterface.addIndex('customers', ['type', 'isActive'], {
        name: 'idx_customers_type_active',
        using: 'BTREE'
      });
    } catch (error) {
      console.log('Index idx_customers_type_active already exists, skipping');
    }
    
    // Employees indexes
    try {
      await queryInterface.addIndex('employees', ['isActive', 'department'], {
        name: 'idx_employees_active_dept',
        using: 'BTREE'
      });
    } catch (error) {
      console.log('Index idx_employees_active_dept already exists, skipping');
    }
    
    // Accounts indexes
    try {
      await queryInterface.addIndex('accounts', ['type', 'isActive'], {
        name: 'idx_accounts_type_active',
        using: 'BTREE'
      });
    } catch (error) {
      console.log('Index idx_accounts_type_active already exists, skipping');
    }
    
    try {
      await queryInterface.addIndex('accounts', ['parentId', 'level'], {
        name: 'idx_accounts_parent_level',
        using: 'BTREE'
      });
    } catch (error) {
      console.log('Index idx_accounts_parent_level already exists, skipping');
    }
    
    // Users indexes
    try {
      await queryInterface.addIndex('users', ['role', 'isActive'], {
        name: 'idx_users_role_active',
        using: 'BTREE'
      });
    } catch (error) {
      console.log('Index idx_users_role_active already exists, skipping');
    }
    
    // Fixed Assets indexes
    try {
      await queryInterface.addIndex('fixed_assets', ['status', 'purchaseDate'], {
        name: 'idx_fixed_assets_status_date',
        using: 'BTREE'
      });
    } catch (error) {
      console.log('Index idx_fixed_assets_status_date already exists, skipping');
    }
    
    // Employee Advances indexes
    try {
      await queryInterface.addIndex('employee_advances', ['employeeId', 'date'], {
        name: 'idx_employee_advances_emp_date',
        using: 'BTREE'
      });
    } catch (error) {
      console.log('Index idx_employee_advances_emp_date already exists, skipping');
    }
    
    // Payroll Entries indexes
    try {
      await queryInterface.addIndex('payroll_entries', ['employeeId', 'month', 'year'], {
        name: 'idx_payroll_entries_emp_month_year',
        using: 'BTREE'
      });
    } catch (error) {
      console.log('Index idx_payroll_entries_emp_month_year already exists, skipping');
    }
    
    // Suppliers indexes
    try {
      await queryInterface.addIndex('suppliers', ['isActive'], {
        name: 'idx_suppliers_active',
        using: 'BTREE'
      });
    } catch (error) {
      console.log('Index idx_suppliers_active already exists, skipping');
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove all added indexes
    const indexes = [
      'idx_gl_entries_date',
      'idx_gl_entries_status_date',
      'idx_gl_entries_entry_number',
      'idx_gl_entry_details_account_entry',
      'idx_journal_entries_status_date',
      'idx_journal_entries_type_date',
      'idx_invoices_customer_status',
      'idx_invoices_date_status',
      'idx_invoices_type_date',
      'idx_payments_customer_date',
      'idx_payments_method_status',
      'idx_receipts_customer_date',
      'idx_receipts_status_date',
      'idx_customers_active',
      'idx_customers_type_active',
      'idx_employees_active_dept',
      'idx_accounts_type_active',
      'idx_accounts_parent_level',
      'idx_users_role_active',
      'idx_fixed_assets_status_date',
      'idx_employee_advances_emp_date',
      'idx_payroll_entries_emp_month_year',
      'idx_suppliers_active'
    ];
    
    for (const indexName of indexes) {
      try {
        // Try to remove from appropriate table
        if (indexName.includes('gl_entry_details')) {
          await queryInterface.removeIndex('gl_entry_details', indexName);
        } else if (indexName.includes('gl_entries')) {
          await queryInterface.removeIndex('gl_entries', indexName);
        } else if (indexName.includes('journal_entries')) {
          await queryInterface.removeIndex('journal_entries', indexName);
        } else if (indexName.includes('invoices')) {
          await queryInterface.removeIndex('invoices', indexName);
        } else if (indexName.includes('payments')) {
          await queryInterface.removeIndex('payments', indexName);
        } else if (indexName.includes('receipts')) {
          await queryInterface.removeIndex('receipts', indexName);
        } else if (indexName.includes('customers')) {
          await queryInterface.removeIndex('customers', indexName);
        } else if (indexName.includes('employees')) {
          await queryInterface.removeIndex('employees', indexName);
        } else if (indexName.includes('accounts')) {
          await queryInterface.removeIndex('accounts', indexName);
        } else if (indexName.includes('users')) {
          await queryInterface.removeIndex('users', indexName);
        } else if (indexName.includes('fixed_assets')) {
          await queryInterface.removeIndex('fixed_assets', indexName);
        } else if (indexName.includes('employee_advances')) {
          await queryInterface.removeIndex('employee_advances', indexName);
        } else if (indexName.includes('payroll_entries')) {
          await queryInterface.removeIndex('payroll_entries', indexName);
        } else if (indexName.includes('suppliers')) {
          await queryInterface.removeIndex('suppliers', indexName);
        }
      } catch (error) {
        // Index might not exist, continue
        console.log(`Index ${indexName} not found, skipping removal`);
      }
    }
  }
};

